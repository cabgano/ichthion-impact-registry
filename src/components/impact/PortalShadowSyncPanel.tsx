"use client";

import { useState } from "react";

type ShadowStatus = {
  lastSyncAt: string | null;
  totalVius: number;
  totalEvidence: number;
};

type SyncResult = ShadowStatus & {
  projectedVius: number | null;
  projectedEvidence: number | null;
};

type UiStatus =
  | "ready"
  | "synced"
  | "syncing"
  | "failed";

function formatSyncDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function statusLabel(
  status: UiStatus
) {
  switch (status) {
    case "syncing":
      return "Syncing...";
    case "failed":
      return "Sync failed";
    case "synced":
      return "Synced";
    default:
      return "Ready";
  }
}

function statusClasses(
  status: UiStatus
) {
  switch (status) {
    case "synced":
      return "text-emerald-700";
    case "syncing":
      return "text-cyan-700";
    case "failed":
      return "text-red-700";
    default:
      return "text-slate-500";
  }
}

export function PortalShadowSyncPanel() {
  const [
    status,
    setStatus,
  ] = useState<ShadowStatus>({
    lastSyncAt: null,
    totalVius: 0,
    totalEvidence: 0,
  });

  const [
    uiStatus,
    setUiStatus,
  ] = useState<UiStatus>("ready");

  const [
    result,
    setResult,
  ] = useState<SyncResult | null>(
    null
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  async function handleSync() {
    setUiStatus("syncing");
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch(
        "/api/impact/portal-shadow-sync",
        {
          method: "POST",
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Portal Shadow sync failed."
        );
      }

      const nextStatus: ShadowStatus = {
        lastSyncAt:
          payload.lastSyncAt ?? null,

        totalVius:
          Number(
            payload.totalVius ?? 0
          ),

        totalEvidence:
          Number(
            payload.totalEvidence ?? 0
          ),
      };

      setStatus(nextStatus);

      setResult({
        ...nextStatus,

        projectedVius:
          payload.projectedVius ??
          null,

        projectedEvidence:
          payload.projectedEvidence ??
          null,
      });

      setUiStatus("synced");
    } catch (error) {
      console.error(error);

      setUiStatus("failed");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Portal Shadow sync failed."
      );
    }
  }

  return (
    <section className="border-t border-slate-200 pt-5">
      <p className="text-sm font-semibold text-slate-950">
        Client Portal Shadow
      </p>

      <div className="mt-3 space-y-1.5 text-xs">
        <p className="text-slate-500">
          Last sync:{" "}
          <span className="font-medium text-slate-700">
            {formatSyncDate(
              status.lastSyncAt
            )}
          </span>
        </p>

        <p className="text-slate-500">
          Status:{" "}
          <span
            className={`font-semibold ${statusClasses(
              uiStatus
            )}`}
          >
            {statusLabel(uiStatus)}
          </span>
        </p>

        {status.lastSyncAt && (
          <p className="text-slate-400">
            {status.totalVius} VIUs ·{" "}
            {status.totalEvidence} evidence files
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSync}
        disabled={uiStatus === "syncing"}
        className="mt-4 w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uiStatus === "syncing"
          ? "Syncing..."
          : "Sync Portal Shadow"}
      </button>

      {result && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
          Sync completed.

          {result.projectedVius !== null && (
            <>
              <br />
              {result.projectedVius} VIUs
            </>
          )}

          {result.projectedEvidence !==
            null && (
            <>
              {" "}
              ·{" "}
              {result.projectedEvidence}{" "}
              evidence files
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {errorMessage}
        </div>
      )}
    </section>
  );
}