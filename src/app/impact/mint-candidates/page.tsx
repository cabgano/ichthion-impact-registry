import { ImpactMetricCard } from "@/components/impact/ImpactMetricCard";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactSection } from "@/components/impact/ImpactSection";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { MintCandidateCard } from "@/components/impact/MintCandidateCard";
import {
  getMintCandidatesData,
  type ImpactRawRecord,
  type ImpactRawValue,
  type MintCandidate,
} from "@/lib/impact/mint-candidates";

function pickValue(record: ImpactRawRecord | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined && String(value).length > 0) {
      return value;
    }
  }

  return null;
}

function valueToString(value: ImpactRawValue, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function formatNumber(value: ImpactRawValue) {
  if (value === null || value === undefined) return "0";

  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);

  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function readinessStatus(candidate: MintCandidate) {
  return valueToString(
    pickValue(candidate, ["mint_readiness_status", "tokenization_status"]),
    "unknown"
  );
}

function onchainStatus(candidate: MintCandidate) {
  return valueToString(pickValue(candidate, ["onchain_status"]), "unknown");
}

function metadataHash(candidate: MintCandidate) {
  return valueToString(
    pickValue(candidate, ["onchain_metadata_hash", "metadata_hash"]),
    ""
  );
}

function assignedCents(candidate: MintCandidate) {
  const direct = pickValue(candidate, ["assigned_viu_cents"]);

  if (direct !== null && direct !== undefined) {
    const parsed =
      typeof direct === "string" ? Number.parseFloat(direct) : Number(direct);

    if (!Number.isNaN(parsed)) return parsed;
  }

  const viuAmount = pickValue(candidate, ["assigned_viu_amount"]);

  if (viuAmount !== null && viuAmount !== undefined) {
    const parsed =
      typeof viuAmount === "string"
        ? Number.parseFloat(viuAmount)
        : Number(viuAmount);

    if (!Number.isNaN(parsed)) return parsed * 100;
  }

  return 0;
}

export default async function ImpactMintCandidatesPage() {
  const { candidates, metadataRows, errorMessage } =
    await getMintCandidatesData();

  const rows = candidates.length > 0 ? candidates : metadataRows;

  const readyCount = rows.filter((candidate) =>
    readinessStatus(candidate).toLowerCase().includes("ready")
  ).length;

  const notMintedCount = rows.filter((candidate) =>
    onchainStatus(candidate).toLowerCase().includes("not")
  ).length;

  const hashedCount = rows.filter(
    (candidate) => metadataHash(candidate).length > 0
  ).length;

  const totalCents = rows.reduce(
    (total, candidate) => total + assignedCents(candidate),
    0
  );

  return (
    <>
      <ImpactPageHeader
        title="Future Mint Candidates"
        description="VIUs completas asignadas a clientes con metadata preparada para futura tokenización on-chain."
      >
        <ImpactStatusPill status={errorMessage ? "warning" : "connected"} />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No se pudieron cargar todos los candidatos a futuro mint.</strong>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Mint candidates"
          value={formatNumber(rows.length)}
          helper="VIUs completas asignadas"
        />

        <ImpactMetricCard
          label="Ready for future mint"
          value={formatNumber(readyCount)}
          helper="Metadata preparada"
        />

        <ImpactMetricCard
          label="Not minted"
          value={formatNumber(notMintedCount)}
          helper="Pendiente de Level 3"
        />

        <ImpactMetricCard
          label="Total VIU"
          value={formatNumber(totalCents / 100)}
          helper={`${formatNumber(totalCents * 10)} kg equivalentes`}
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Readiness summary"
          description="Resumen de preparación para futura emisión on-chain."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ImpactStatusPill status="ready_for_future_mint" />
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatNumber(readyCount)}
              </p>
              <p className="text-sm text-slate-500">ready candidates</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ImpactStatusPill status="not_minted" />
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatNumber(notMintedCount)}
              </p>
              <p className="text-sm text-slate-500">not minted yet</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ImpactStatusPill status="metadata_hashed" />
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatNumber(hashedCount)}
              </p>
              <p className="text-sm text-slate-500">with metadata hash</p>
            </div>
          </div>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Mint Candidate Gallery"
          description="Listado de VIUs completas asignadas que podrían convertirse en activos on-chain en Level 3."
        >
          {rows.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {rows.map((candidate, index) => {
                const key = valueToString(
                  pickValue(candidate, [
                    "mint_permanent_id",
                    "mint_reference",
                    "permanent_id",
                    "metadata_id",
                    "id",
                  ]),
                  `mint-candidate-${index}`
                );

                return <MintCandidateCard key={key} candidate={candidate} />;
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No future mint candidates available yet.
            </p>
          )}
        </ImpactSection>
      </div>
    </>
  );
}