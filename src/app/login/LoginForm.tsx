"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

type ImpactPermissionRow = {
  can_read:
    | boolean
    | null;
};

export function LoginForm() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase =
      createClient();

    try {
      const {
        error:
          signInError,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              email
                .trim()
                .toLowerCase(),

            password,
          });

      if (signInError) {
        throw new Error(
          "El correo o la contraseña no son correctos."
        );
      }

      const {
        data:
          permissionsRaw,

        error:
          permissionsError,
      } =
        await supabase
          .rpc(
            "current_impact_user_permissions"
          )
          .maybeSingle();

      const permissions =
        permissionsRaw as
          | ImpactPermissionRow
          | null;

      if (
        permissionsError ||
        !permissions ||
        permissions.can_read !==
          true
      ) {
        await supabase.auth
          .signOut({
            scope:
              "local",
          });

        throw new Error(
          "Esta cuenta no tiene un rol interno activo para acceder al Impact Registry."
        );
      }

      router.replace(
        "/impact"
      );

      router.refresh();

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión."
      );

    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mt-8 space-y-5"
    >
      <label className="block text-sm font-medium text-slate-700">
        Correo electrónico

        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(
            event
          ) =>
            setEmail(
              event.target.value
            )
          }
          placeholder="usuario@ichthion.com"
          disabled={
            isSubmitting
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Contraseña

        <input
          type="password"
          autoComplete="current-password"
          required
          value={
            password
          }
          onChange={(
            event
          ) =>
            setPassword(
              event.target.value
            )
          }
          disabled={
            isSubmitting
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">
            No se pudo iniciar sesión
          </p>

          <p className="mt-1">
            {
              errorMessage
            }
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          isSubmitting
        }
        className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Iniciando sesión..."
          : "Iniciar sesión"}
      </button>
    </form>
  );
}