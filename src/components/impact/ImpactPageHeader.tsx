import type { ReactNode } from "react";

type ImpactPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function ImpactPageHeader({
  eyebrow = "Impact Registry",
  title,
  description,
  children,
}: ImpactPageHeaderProps) {
  return (
    <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {eyebrow}
      </p>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {description}
            </p>
          ) : null}
        </div>

        {children ? <div>{children}</div> : null}
      </div>
    </header>
  );
}