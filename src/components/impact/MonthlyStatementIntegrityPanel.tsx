import type {
  MonthlyImpactStatement,
  MonthlyStatementIntegrity,
} from "@/lib/impact/monthly-statements";

type MonthlyStatementIntegrityPanelProps = {
  statement: MonthlyImpactStatement;
  integrity: MonthlyStatementIntegrity;
};

type IntegrityCheckProps = {
  label: string;
  description: string;
  passed: boolean;
};

function IntegrityCheck({
  label,
  description,
  passed,
}: IntegrityCheckProps) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        passed
          ? "border-emerald-200 bg-emerald-50"
          : "border-red-200 bg-red-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={[
              "text-sm font-semibold",
              passed
                ? "text-emerald-950"
                : "text-red-950",
            ].join(" ")}
          >
            {label}
          </p>

          <p
            className={[
              "mt-1 text-xs",
              passed
                ? "text-emerald-700"
                : "text-red-700",
            ].join(" ")}
          >
            {description}
          </p>
        </div>

        <span
          className={[
            "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
            passed
              ? "bg-emerald-200 text-emerald-900"
              : "bg-red-200 text-red-900",
          ].join(" ")}
        >
          {passed
            ? "Pass"
            : "Fail"}
        </span>
      </div>
    </div>
  );
}

export function MonthlyStatementIntegrityPanel({
  statement,
  integrity,
}: MonthlyStatementIntegrityPanelProps) {
  return (
    <div className="space-y-5">
      <div
        className={[
          "rounded-xl border p-5",
          integrity.complete_hash_contract
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50",
        ].join(" ")}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Snapshot integrity
        </p>

        <p
          className={[
            "mt-2 text-lg font-bold",
            integrity.complete_hash_contract
              ? "text-emerald-950"
              : "text-red-950",
          ].join(" ")}
        >
          {integrity.complete_hash_contract
            ? "Complete hash contract"
            : "Incomplete hash contract"}
        </p>

        <p className="mt-2 text-sm text-slate-600">
          The frontend is reading the immutable monthly snapshot and checking its stored hash formats, provenance resolution, evidence agreement and event-chain links.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <IntegrityCheck
          label="Statement hashes"
          description="Source fingerprint and statement manifest hashes are present and use SHA-256 format."
          passed={
            integrity.statement_hashes_present
          }
        />

        <IntegrityCheck
          label="Source snapshots"
          description="Every movement source has resolved provenance and a valid frozen snapshot hash."
          passed={
            integrity.source_snapshot_hashes_valid
          }
        />

        <IntegrityCheck
          label="Evidence snapshots"
          description="Declared and calculated file hashes agree across the frozen evidence set."
          passed={
            integrity.evidence_hashes_valid
          }
        />

        <IntegrityCheck
          label="Event chain"
          description="Event sequences and previous-event hash links form a complete ordered chain."
          passed={
            integrity.event_chain_linked
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Source fingerprint
          </p>

          <p className="mt-2 break-all font-mono text-xs text-slate-800">
            {
              statement.source_fingerprint_hash
            }
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Statement manifest
          </p>

          <p className="mt-2 break-all font-mono text-xs text-slate-800">
            {
              statement.statement_manifest_hash
            }
          </p>
        </div>
      </div>
    </div>
  );
}