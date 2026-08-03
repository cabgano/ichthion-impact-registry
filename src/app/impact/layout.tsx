import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ImpactShell } from "@/components/impact/ImpactShell";
import { createClient } from "@/lib/supabase/server";

type ImpactLayoutProps = {
  children: ReactNode;
};

export default async function ImpactLayout({
  children,
}: ImpactLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ImpactShell>
      {children}
    </ImpactShell>
  );
}