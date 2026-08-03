import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/impact");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ichthion
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Impact Registry
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Acceso interno al registro de evidencia, wallet de impacto
          y operaciones VIU.
        </p>

        <LoginForm />

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          El acceso está limitado a usuarios internos autorizados
          por Ichthion.
        </p>
      </section>
    </main>
  );
}