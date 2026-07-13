type ImpactStatusPillProps = {
  status: string | null | undefined;
};

export function ImpactStatusPill({ status }: ImpactStatusPillProps) {
  const normalizedStatus = status ?? "unknown";

  const isPass = normalizedStatus.toLowerCase() === "pass";
  const isOk = normalizedStatus.toLowerCase() === "ok";

  const className =
    isPass || isOk
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        className,
      ].join(" ")}
    >
      {normalizedStatus}
    </span>
  );
}