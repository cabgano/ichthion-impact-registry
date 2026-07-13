import type { ReactNode } from "react";
import { ImpactShell } from "@/components/impact/ImpactShell";

type ImpactLayoutProps = {
  children: ReactNode;
};

export default function ImpactLayout({ children }: ImpactLayoutProps) {
  return <ImpactShell>{children}</ImpactShell>;
}