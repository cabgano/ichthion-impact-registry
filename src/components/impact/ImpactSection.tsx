import type { ReactNode } from "react";

type ImpactSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ImpactSection({
  title,
  description,
  children,
}: ImpactSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      {children}
    </section>
  );
}