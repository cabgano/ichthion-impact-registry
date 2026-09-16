import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getCurrentImpactUserPermissions } from "@/lib/impact/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function canSyncPortalShadow(role: string) {
  return (
    role === "technical_admin" ||
    role === "impact_admin"
  );
}

function createPortalAdminClient() {
  return createClient(
    requiredEnv("PORTAL_SUPABASE_URL"),
    requiredEnv("PORTAL_SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

async function getPortalShadowStatus() {
  const portal = createPortalAdminClient();

  const [
    latestViuResult,
    viuCountResult,
    evidenceCountResult,
  ] = await Promise.all([
    portal
      .from("portal_vius")
      .select("synced_at")
      .order("synced_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    portal
      .from("portal_vius")
      .select("*", {
        count: "exact",
        head: true,
      }),

    portal
      .from("portal_viu_evidence")
      .select("*", {
        count: "exact",
        head: true,
      }),
  ]);

  if (latestViuResult.error) {
    throw new Error(
      `Could not read Portal sync status: ${latestViuResult.error.message}`
    );
  }

  if (viuCountResult.error) {
    throw new Error(
      `Could not count Portal VIUs: ${viuCountResult.error.message}`
    );
  }

  if (evidenceCountResult.error) {
    throw new Error(
      `Could not count Portal evidence: ${evidenceCountResult.error.message}`
    );
  }

  return {
    lastSyncAt:
      latestViuResult.data?.synced_at ?? null,

    totalVius:
      viuCountResult.count ?? 0,

    totalEvidence:
      evidenceCountResult.count ?? 0,
  };
}

async function requireSyncPermission() {
  const permissions =
    await getCurrentImpactUserPermissions();

  if (
    !canSyncPortalShadow(
      permissions.impact_role
    )
  ) {
    return null;
  }

  return permissions;
}

function executeProjectionProducer() {
  const scriptPath = path.join(
    process.cwd(),
    "scripts",
    "project-portal-shadow.ts"
  );

  if (!existsSync(scriptPath)) {
    throw new Error(
      `Projection producer not found at ${scriptPath}`
    );
  }

  return new Promise<{
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    execFile(
      process.execPath,
      [scriptPath],
      {
        cwd: process.cwd(),
        env: process.env,
        windowsHide: true,
        timeout: 120_000,
        maxBuffer: 5 * 1024 * 1024,
      },
      (
        error,
        stdout,
        stderr
      ) => {
        if (error) {
          console.error(
            "Portal Shadow producer failed."
          );

          console.error(stdout);
          console.error(stderr);

          reject(error);

          return;
        }

        resolve({
          stdout,
          stderr,
        });
      }
    );
  });
}

function extractProjectedCount(
  output: string,
  pattern: RegExp
) {
  const match = output.match(pattern);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  return Number.isFinite(value)
    ? value
    : null;
}

export async function GET() {
  try {
    const permissions =
      await requireSyncPermission();

    if (!permissions) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to manage the Client Portal Shadow.",
        },
        {
          status: 403,
        }
      );
    }

    const status =
      await getPortalShadowStatus();

    return NextResponse.json({
      ok: true,
      ...status,
    });
  } catch (error) {
    console.error(
      "Could not read Portal Shadow status:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not read Client Portal Shadow status.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST() {
  try {
    const permissions =
      await requireSyncPermission();

    if (!permissions) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to sync the Client Portal Shadow.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      stdout,
      stderr,
    } = await executeProjectionProducer();

    if (stderr.trim()) {
      console.warn(
        "Portal Shadow producer warnings:"
      );

      console.warn(stderr);
    }

    if (
      !stdout.includes(
        "PASS: Registry → Portal projection completed."
      )
    ) {
      throw new Error(
        "Projection producer finished without the expected PASS result."
      );
    }

    const projectedVius =
      extractProjectedCount(
        stdout,
        /portal_vius upserted:\s*(\d+)/i
      );

    const projectedEvidence =
      extractProjectedCount(
        stdout,
        /portal_viu_evidence upserted:\s*(\d+)/i
      );

    const status =
      await getPortalShadowStatus();

    return NextResponse.json({
      ok: true,

      message:
        "Client Portal Shadow synchronized successfully.",

      projectedVius,
      projectedEvidence,

      ...status,
    });
  } catch (error) {
    console.error(
      "Client Portal Shadow synchronization failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Client Portal Shadow synchronization failed.",
      },
      {
        status: 500,
      }
    );
  }
}