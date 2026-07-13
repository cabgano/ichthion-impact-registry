export type ImpactNavItem = {
  href: string;
  label: string;
  description: string;
};

export const impactNavItems: ImpactNavItem[] = [
  {
    href: "/impact",
    label: "Wallet",
    description: "Resumen general de la wallet de impacto.",
  },
  {
    href: "/impact/vius",
    label: "VIU Cards",
    description: "Tarjetas VIU completas disponibles/asignadas.",
  },
  {
    href: "/impact/fractions",
    label: "Fractional Pool",
    description: "FVIUs, cent_VIUs y kg residuales.",
  },
  {
    href: "/impact/allocations",
    label: "Allocations",
    description: "Asignaciones emitidas a clientes.",
  },
  {
    href: "/impact/mint-candidates",
    label: "Future Mint",
    description: "VIUs completas asignadas listas para futuro mint.",
  },
];