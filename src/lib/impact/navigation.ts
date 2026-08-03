export type ImpactNavAccess =
  | "read"
  | "operate";

export type ImpactNavItem = {
  href: string;
  label: string;
  description: string;
  access: ImpactNavAccess;
};

export const impactNavItems: ImpactNavItem[] = [
  {
    href: "/impact/evidence/new",
    label: "New Evidence",
    description:
      "Crear y cargar un nuevo paquete de evidencia.",
    access: "operate",
  },
  {
    href: "/impact",
    label: "Wallet",
    description:
      "Resumen general de la wallet de impacto.",
    access: "read",
  },
  {
    href: "/impact/vius",
    label: "VIU Cards",
    description:
      "Tarjetas VIU completas disponibles/asignadas.",
    access: "read",
  },
  {
    href: "/impact/fractions",
    label: "Fractional Pool",
    description:
      "FVIUs, cent_VIUs y kg residuales.",
    access: "read",
  },
  {
    href: "/impact/allocations",
    label: "Allocations",
    description:
      "Asignaciones emitidas a clientes.",
    access: "read",
  },
  {
    href: "/impact/mint-candidates",
    label: "Future Mint",
    description:
      "VIUs completas asignadas listas para futuro mint.",
    access: "read",
  },
];