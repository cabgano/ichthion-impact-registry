import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { getCurrentImpactUserPermissions } from "@/lib/impact/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// In-process protection for local/single-instance development. For distributed
// deployments, use a database-backed job lock and a worker instead.
let syncing = false;

type SyncCounts = {
  copied: number;
  unchanged: number;
  repaired: number;
  missingSource: number;
  failed: number;
};

function readCounts(output: string): SyncCounts {
  const match = output.match(
    /Copied:\s*(\d+)\s*\|\s*Unchanged:\s*(\d+)\s*\|\s*Repaired:\s*(\d+)\s*\|\s*Missing source:\s*(\d+)\s*\|\s*Failed:\s*(\d+)/i
  );

  if (!match) {
    throw new Error("Document producer did not emit a valid results summary.");
  }

  return {
    copied: Number(match[1]),
    unchanged: Number(match[2]),
    repaired: Number(match[3]),
    missingSource: Number(match[4]),
    failed: Number(match[5]),
  };
}

function executeDocumentsProducer(): Promise<{ stdout: string; stderr: string }> {
  const scriptPath = path.join(
    process.cwd(),
    "scripts",
    "sync-portal-documents.ts"
  );

  if (!existsSync(scriptPath)) {
    throw new Error("Document producer script is missing.");
  }

  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [scriptPath, "--skip-missing-source"],
      {
        cwd: process.cwd(),
        env: process.env,
        windowsHide: true,
        timeout: 300_000,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Document producer execution failed:", error);
          console.error(stdout);
          console.error(stderr);
          reject(new Error("Document producer failed. Review server logs."));
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

export async function POST() {
  try {
    const permissions = await getCurrentImpactUserPermissions();

    if (
      permissions.impact_role !== "technical_admin" &&
      permissions.impact_role !== "impact_admin"
    ) {
      return NextResponse.json(
        { error: "You are not authorized to sync client documents." },
        { status: 403, headers: NO_STORE }
      );
    }

    if (syncing) {
      return NextResponse.json(
        { error: "A document synchronization is already running." },
        { status: 409, headers: NO_STORE }
      );
    }

    syncing = true;
    try {
      const { stdout } = await executeDocumentsProducer();
      const counts = readCounts(stdout);

      // Missing originals are separately reported as a partial result. Any
      // real transfer / integrity error must never be shown as a success.
      if (counts.failed !== 0) {
        throw new Error(`${counts.failed} document transfer(s) failed.`);
      }

      const isPartial = counts.missingSource > 0;
      const successMarker = stdout.includes(
        "PASS: Registry -> Portal document sync completed."
      );

      // The locally patched script and the packaged V2 emit different PARTIAL
      // wording. The validated counts and a successful exit code are the
      // reliable contract for partial runs; do not depend on log phrasing.
      if (!stdout.includes("Mode: WRITE") || (!isPartial && !successMarker)) {
        throw new Error("Document producer ended without the expected result marker.");
      }

      return NextResponse.json(
        {
          ok: true,
          partial: isPartial,
          ...counts,
          message: isPartial
            ? "Available documents synchronized; some source files are missing."
            : "Client documents synchronized successfully.",
        },
        { headers: NO_STORE }
      );
    } finally {
      syncing = false;
    }
  } catch (error) {
    console.error("Client document synchronization failed:", error);
    return NextResponse.json(
      { error: "Document synchronization failed. Review server logs." },
      { status: 500, headers: NO_STORE }
    );
  }
}
