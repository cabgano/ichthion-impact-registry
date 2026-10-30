
import type {
  ImpactRole,
} from "@/lib/impact/types";

export type ImpactNavAccess =
  | "read"
  | "operate";

export type ImpactNavItem = {
  href: string;
  label: string;
  description: string;
  access: ImpactNavAccess;
  roles?: ImpactRole[];
};

export const impactNavItems: ImpactNavItem[] = [
  {
    href: "/impact/evidence",
    label: "Evidence Review",
    description:
      "Review pending evidence and integrity.",
    access: "read",
  },
  {
    href: "/impact/evidence/new",
    label: "New Evidence",
    description:
      "Create and upload a new evidence package.",
    access: "operate",
  },
  {
    href: "/impact/conversions",
    label: "Conversions",
    description:
      "Conversion history and traceability from kg to VIUs.",
    access: "read",
  },
  {
    href: "/impact",
    label: "Wallet",
    description:
      "Overview of the impact wallet.",
    access: "read",
  },
  {
    href: "/impact/vius",
    label: "VIU Cards",
    description:
      "Available and assigned full VIU cards.",
    access: "read",
  },
  {
    href: "/impact/fractions",
    label: "Fractional Pool",
    description:
      "FVIUs, cent_VIUs, and residual kilograms.",
    access: "read",
  },
  {
    href: "/impact/allocations",
    label: "Allocations",
    description:
      "VIU allocations issued to clients.",
    access: "read",
  },
  {
    href: "/impact/statements",
    label: "Monthly Statements",
    description:
      "Finalized monthly statements and their traceability.",
    access: "read",
    roles: [
      "impact_admin",
      "technical_admin",
    ],
  },
  {
    href: "/impact/mint-candidates",
    label: "Future Mint",
    description:
      "Assigned full VIUs ready for future minting.",
    access: "read",
  },
];
