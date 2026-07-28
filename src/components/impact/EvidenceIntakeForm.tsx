"use client";

import { FormEvent, useState } from "react";

type ImpactLine = "technology" | "mingas" | "recyclers_base";
type ScopeType = "site" | "multi_site" | "company";

type EvidenceFormState = {
  periodKey: string;
  impactLine: ImpactLine;
  scopeType: ScopeType;
  scopeCode: string;
  scopeName: string;
  totalReportedKg: string;
  description: string;
  internalNotes: string;
};

type FormErrors = Partial<Record<keyof EvidenceFormState, string>>;

const initialState: EvidenceFormState = {
  periodKey: "",
  impactLine: "technology",
  scopeType: "site",
  scopeCode: "",
  scopeName: "",
  totalReportedKg: "",
  description: "",
  internalNotes: "",
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

function validateForm(form: EvidenceFormState): FormErrors {
  const errors: FormErrors = {};

  if (!/^\d{6}$/.test(form.periodKey)) {
    errors.periodKey = "Use el formato YYYYMM, por ejemplo 202607.";
  } else {
    const month = Number(form.periodKey.slice(4, 6));

    if (month < 1 || month > 12) {
      errors.periodKey = "El mes debe estar entre 01 y 12.";
    }
  }

  if (!form.scopeCode.trim()) {
    errors.scopeCode = "El código del alcance o evento es obligatorio.";
  } else if (!/^[A-Z0-9_]+$/.test(form.scopeCode.trim())) {
    errors.scopeCode =
      "Use únicamente letras mayúsculas, números y guiones bajos.";
  }

  if (!form.scopeName.trim()) {
    errors.scopeName = "El nombre del alcance o evento es obligatorio.";
  }

  const kilograms = Number(form.totalReportedKg);

  if (
    !form.totalReportedKg.trim() ||
    !Number.isFinite(kilograms) ||
    kilograms <= 0
  ) {
    errors.totalReportedKg =
      "Ingrese una cantidad de kilogramos mayor que cero.";
  }

  if (!form.description.trim()) {
    errors.description = "La descripción del impacto es obligatoria.";
  }

  return errors;
}

export function EvidenceIntakeForm() {
  const [form, setForm] = useState<EvidenceFormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [validatedForm, setValidatedForm] =
    useState<EvidenceFormState | null>(null);

  function updateField<Key extends keyof EvidenceFormState>(
    key: Key,
    value: EvidenceFormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    setValidatedForm(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setValidatedForm(null);
      return;
    }

    setValidatedForm({
      ...form,
      scopeCode: form.scopeCode.trim(),
      scopeName: form.scopeName.trim(),
      description: form.description.trim(),
      internalNotes: form.internalNotes.trim(),
      totalReportedKg: String(Number(form.totalReportedKg)),
    });
  }

  function handleReset() {
    setForm(initialState);
    setErrors({});
    setValidatedForm(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-950">
            Información del impacto
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Registre la información básica del evento antes de cargar su
            evidencia documental.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Periodo
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="202607"
              value={form.periodKey}
              onChange={(event) =>
                updateField("periodKey", event.target.value)
              }
              className={inputClassName}
            />
            {errors.periodKey ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.periodKey}
              </span>
            ) : null}
          </label>

          <label className="text-sm font-medium text-slate-700">
            Línea de impacto
            <select
              value={form.impactLine}
              onChange={(event) =>
                updateField(
                  "impactLine",
                  event.target.value as ImpactLine
                )
              }
              className={inputClassName}
            >
              <option value="technology">Technology</option>
              <option value="mingas">Mingas</option>
              <option value="recyclers_base">Recyclers Base</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Tipo de alcance
            <select
              value={form.scopeType}
              onChange={(event) =>
                updateField(
                  "scopeType",
                  event.target.value as ScopeType
                )
              }
              className={inputClassName}
            >
              <option value="site">Site</option>
              <option value="multi_site">Multi-site</option>
              <option value="company">Company</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Kilogramos reportados
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="1000"
              value={form.totalReportedKg}
              onChange={(event) =>
                updateField("totalReportedKg", event.target.value)
              }
              className={inputClassName}
            />
            {errors.totalReportedKg ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.totalReportedKg}
              </span>
            ) : null}
          </label>

          <label className="text-sm font-medium text-slate-700">
            Código del alcance o evento
            <input
              type="text"
              placeholder="TECH_EVENT_202607"
              value={form.scopeCode}
              onChange={(event) =>
                updateField(
                  "scopeCode",
                  event.target.value.toUpperCase()
                )
              }
              className={inputClassName}
            />
            {errors.scopeCode ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.scopeCode}
              </span>
            ) : null}
          </label>

          <label className="text-sm font-medium text-slate-700">
            Nombre del alcance o evento
            <input
              type="text"
              placeholder="Technology deployment — July 2026"
              value={form.scopeName}
              onChange={(event) =>
                updateField("scopeName", event.target.value)
              }
              className={inputClassName}
            />
            {errors.scopeName ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.scopeName}
              </span>
            ) : null}
          </label>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Descripción del impacto
          <textarea
            rows={4}
            placeholder="Describa el evento, actividad o fuente que produjo el impacto reportado."
            value={form.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            className={inputClassName}
          />
          {errors.description ? (
            <span className="mt-1 block text-xs text-red-600">
              {errors.description}
            </span>
          ) : null}
        </label>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Notas internas
          <textarea
            rows={3}
            placeholder="Observaciones internas para el equipo de Ichthion."
            value={form.internalNotes}
            onChange={(event) =>
              updateField("internalNotes", event.target.value)
            }
            className={inputClassName}
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Limpiar
          </button>

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Validar información
          </button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Flujo operativo</h3>

          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li>
              <strong className="text-slate-900">1.</strong> Registrar datos
              del impacto.
            </li>
            <li>
              <strong className="text-slate-900">2.</strong> Cargar evidencia
              documental.
            </li>
            <li>
              <strong className="text-slate-900">3.</strong> Revisar y
              verificar el paquete.
            </li>
            <li>
              <strong className="text-slate-900">4.</strong> Importar los kg
              verificados.
            </li>
            <li>
              <strong className="text-slate-900">5.</strong> Convertir el
              impacto en VIUs.
            </li>
          </ol>
        </div>

        {validatedForm ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Información validada
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-emerald-700">Periodo</dt>
                <dd className="font-semibold text-emerald-950">
                  {validatedForm.periodKey}
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">Línea</dt>
                <dd className="font-semibold text-emerald-950">
                  {validatedForm.impactLine}
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">Evento</dt>
                <dd className="font-semibold text-emerald-950">
                  {validatedForm.scopeName}
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">
                  Kilogramos reportados
                </dt>
                <dd className="font-semibold text-emerald-950">
                  {Number(
                    validatedForm.totalReportedKg
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  kg
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-5 text-emerald-800">
              Validación local completada. Todavía no se ha creado ningún
              registro en Supabase.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Sin vista previa
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Complete y valide el formulario para revisar el paquete antes
              de continuar.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
