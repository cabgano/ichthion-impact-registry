"use client";

import { useState } from "react";

type UiStatus = "ready" | "syncing" | "synced" | "partial" | "failed";

type SyncResult = {
  ok: boolean;
  partial: boolean;
  copied: number;
  unchanged: number;
  repaired: number;
  missingSource: number;
  failed: number;
  message: string;
};

function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PortalDocumentsSyncPanel() {
  const [uiStatus, setUiStatus] = useState<UiStatus>("ready");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSync() {
    if (uiStatus === "syncing") return;
    setUiStatus("syncing");
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/impact/documents-sync", {
        method: "POST",
        cache: "no-store",
      });
      const payload: Record<string, unknown> = await response.json();

      if (!response.ok || payload.ok !== true) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Document sync failed."
        );
      }

      const nextResult: SyncResult = {
        ok: true,
        partial: payload.partial === true,
        copied: numeric(payload.copied),
        unchanged: numeric(payload.unchanged),
        repaired: numeric(payload.repaired),
        missingSource: numeric(payload.missingSource),
        failed: numeric(payload.failed),
        message: typeof payload.message === "string" ? payload.message : "Sync complete.",
      };

      setResult(nextResult);
      setUiStatus(nextResult.partial ? "partial" : "synced");
    } catch (error) {
      setUiStatus("failed");
      setErrorMessage(
        error instanceof Error ? error.message : "Document sync failed."
      );
    }
  }

  const statusText: Record<UiStatus, string> = {
    ready: "Ready",
    syncing: "Syncing...",
    synced: "Synced",
    partial: "Partial sync",
    failed: "Sync failed",
  };
  const statusStyle: Record<UiStatus, string> = {
    ready: "text-slate-500",
    syncing: "text-cyan-700",
    synced: "text-emerald-700",
    partial: "text-amber-700",
    failed: "text-red-700",
  };

  return (
    <section className="border-t border-slate-200 pt-5">
      <p className="text-sm font-semibold text-slate-950">Client Documents Shadow</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Copy authorized Registry evidence to private Client Portal storage.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Status: <span className={`font-semibold ${statusStyle[uiStatus]}`}>{statusText[uiStatus]}</span>
      </p>

      <button
        type="button"
        onClick={handleSync}
        disabled={uiStatus === "syncing"}
        className="mt-4 w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uiStatus === "syncing" ? "Syncing documents..." : "Sync Documents"}
      </button>

      {result && (
        <div
          role="status"
          className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-5 ${
            result.partial
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <p className="font-semibold">
            {result.partial ? "Partial sync completed" : "Documents synchronized"}
          </p>
          <p>Copied: {result.copied} · Unchanged: {result.unchanged}</p>
          <p>Repaired: {result.repaired} · Missing originals: {result.missingSource}</p>
          {result.partial && (
            <p className="mt-1">Missing source documents were not published.</p>
          )}
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {errorMessage}
        </div>
      )}
    </section>
  );
}
