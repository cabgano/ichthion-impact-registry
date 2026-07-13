type ImpactMetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function ImpactMetricCard({
  label,
  value,
  helper,
}: ImpactMetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}