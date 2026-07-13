type ImpactPlaceholderProps = {
  title: string;
  description: string;
  dataSource?: string;
};

export function ImpactPlaceholder({
  title,
  description,
  dataSource,
}: ImpactPlaceholderProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>

      {dataSource ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fuente de datos prevista
          </p>
          <code className="mt-1 block text-sm text-slate-800">
            {dataSource}
          </code>
        </div>
      ) : null}
    </section>
  );
}