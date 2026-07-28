import { ImpactSection } from "@/components/impact/ImpactSection";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import type { VerificationRecord } from "@/lib/impact/verification";

type VerificationRecordPanelProps = {
  record: VerificationRecord;
  mainFields: string[];
  hashFields: string[];
  checkFields: string[];
};

function humanizeKey(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";

  if (typeof value === "boolean") return value ? "true" : "false";

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
    }).format(value);
  }

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function shortenHash(value: unknown) {
  const text = formatValue(value);

  if (text.length <= 28) return text;

  return `${text.slice(0, 14)}...${text.slice(-10)}`;
}

function getField(record: VerificationRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined && String(value).length > 0) {
      return value;
    }
  }

  return null;
}

function isPositiveCheck(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.toLowerCase();

    return (
      normalized.includes("verified") ||
      normalized.includes("valid") ||
      normalized.includes("match") ||
      normalized.includes("pass") ||
      normalized.includes("ready") ||
      normalized === "true"
    );
  }

  return false;
}

export function VerificationRecordPanel({
  record,
  mainFields,
  hashFields,
  checkFields,
}: VerificationRecordPanelProps) {
  const verificationStatus = getField(record, [
    "verification_status",
    "status",
    "asset_verification_status",
    "allocation_verification_status",
  ]);

  const availableMainFields = mainFields.filter(
    (field) => record[field] !== null && record[field] !== undefined
  );

  const availableHashFields = hashFields.filter(
    (field) => record[field] !== null && record[field] !== undefined
  );

  const availableCheckFields = checkFields.filter(
    (field) => record[field] !== null && record[field] !== undefined
  );

  return (
    <div className="space-y-6">
      <ImpactSection
        title="Verification status"
        description="Estado lógico calculado por las funciones de verificación Level 2."
      >
        <div className="flex flex-wrap items-center gap-3">
          <ImpactStatusPill status={formatValue(verificationStatus)} />
          <p className="text-sm text-slate-600">
            Esta página se construye desde el registro verificable generado en Supabase.
          </p>
        </div>
      </ImpactSection>

      <ImpactSection
        title="Main verification data"
        description="Datos principales del activo o asignación verificable."
      >
        {availableMainFields.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {availableMainFields.map((field) => (
              <div
                key={field}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {humanizeKey(field)}
                </p>
                <p className="mt-1 break-words text-sm font-medium text-slate-950">
                  {formatValue(record[field])}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No main fields available.</p>
        )}
      </ImpactSection>

      <ImpactSection
        title="Hashes and manifests"
        description="Hashes almacenados o recalculados que respaldan la verificabilidad."
      >
        {availableHashFields.length > 0 ? (
          <div className="grid gap-3">
            {availableHashFields.map((field) => (
              <div
                key={field}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {humanizeKey(field)}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-700">
                  {shortenHash(record[field])}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hash fields available.</p>
        )}
      </ImpactSection>

      <ImpactSection
        title="Verification checks"
        description="Checks booleanos o estados calculados por la vista/función verificable."
      >
        {availableCheckFields.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {availableCheckFields.map((field) => {
              const value = record[field];
              const positive = isPositiveCheck(value);

              return (
                <div
                  key={field}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {humanizeKey(field)}
                  </p>
                  <div className="mt-2">
                    <ImpactStatusPill
                      status={positive ? "pass" : formatValue(value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No verification checks available.
          </p>
        )}
      </ImpactSection>
    </div>
  );
}