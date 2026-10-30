"use client";

import {
  FormEvent,
  useCallback,
  useState,
} from "react";

import {
  EvidenceDocumentSlots,
  type EvidenceSelectedDocument,
} from "@/components/impact/EvidenceDocumentSlots";
import { EvidenceUploadPanel } from "@/components/impact/EvidenceUploadPanel";

type ImpactLine =
  | "technology"
  | "mingas"
  | "recyclers_base";

type ScopeType =
  | "site"
  | "multi_site"
  | "company";

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

type FormErrors = Partial<
  Record<keyof EvidenceFormState, string>
>;

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
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function validateForm(
  form: EvidenceFormState
): FormErrors {
  const errors: FormErrors = {};

  if (!/^\d{6}$/.test(form.periodKey)) {
    errors.periodKey =
      "Use the YYYYMM format, for example 202607.";
  } else {
    const month = Number(
      form.periodKey.slice(4, 6)
    );

    if (month < 1 || month > 12) {
      errors.periodKey =
        "The month must be between 01 and 12.";
    }
  }

  if (!form.scopeCode.trim()) {
    errors.scopeCode =
      "The scope or event code is required.";
  } else if (
    !/^[A-Z0-9_]+$/.test(
      form.scopeCode.trim()
    )
  ) {
    errors.scopeCode =
      "Use only uppercase letters, numbers, and underscores.";
  }

  if (!form.scopeName.trim()) {
    errors.scopeName =
      "Project and impact identification is required.";
  }

  const kilograms = Number(
    form.totalReportedKg
  );

  if (
    !form.totalReportedKg.trim() ||
    !Number.isFinite(kilograms) ||
    kilograms <= 0
  ) {
    errors.totalReportedKg =
      "Enter a reported kilogram amount greater than zero.";
  }

  if (!form.description.trim()) {
    errors.description =
      "The impact description is required.";
  }

  return errors;
}

export function EvidenceIntakeForm() {
  const [form, setForm] =
    useState<EvidenceFormState>(
      initialState
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [
    validatedForm,
    setValidatedForm,
  ] = useState<EvidenceFormState | null>(
    null
  );

  const [documents, setDocuments] = useState(
    [] as EvidenceSelectedDocument[]
  );

  const [
    documentsError,
    setDocumentsError,
  ] = useState<string | null>(null);

  const [
    documentsResetKey,
    setDocumentsResetKey,
  ] = useState(0);

  const [
    isCreatingPackage,
    setIsCreatingPackage,
  ] = useState(false);

  const [
    packageCreated,
    setPackageCreated,
  ] = useState(false);

  const isFormLocked =
    isCreatingPackage || packageCreated;

  const handleDocumentsChange =
    useCallback(
      (
        updatedDocuments: EvidenceSelectedDocument[]
      ) => {
        setDocuments(updatedDocuments);

        const hasPrincipalDocument =
          updatedDocuments.some(
            (document) =>
              document.role ===
                "line_report" &&
              document.file !== null
          );

        if (hasPrincipalDocument) {
          setDocumentsError(null);
        }

        setValidatedForm(null);
      },
      []
    );

  function updateField<
    Key extends keyof EvidenceFormState,
  >(
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

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isFormLocked) {
      return;
    }

    const validationErrors =
      validateForm(form);

    setErrors(validationErrors);

    const principalDocument =
      documents.find(
        (document) =>
          document.role ===
            "line_report" &&
          document.file !== null
      );

    if (!principalDocument) {
      setDocumentsError(
        "You must select the main impact report."
      );
    } else {
      setDocumentsError(null);
    }

    if (
      Object.keys(validationErrors)
        .length > 0 ||
      !principalDocument
    ) {
      setValidatedForm(null);
      return;
    }

    setValidatedForm({
      ...form,
      periodKey:
        form.periodKey.trim(),
      scopeCode:
        form.scopeCode
          .trim()
          .toUpperCase(),
      scopeName:
        form.scopeName.trim(),
      description:
        form.description.trim(),
      internalNotes:
        form.internalNotes.trim(),
      totalReportedKg: String(
        Number(
          form.totalReportedKg
        )
      ),
    });
  }

  function handleReset() {
    setForm(initialState);
    setErrors({});
    setValidatedForm(null);
    setDocuments([]);
    setDocumentsError(null);
    setIsCreatingPackage(false);
    setPackageCreated(false);

    setDocumentsResetKey(
      (current) => current + 1
    );
  }

  const selectedDocumentsCount =
    documents.filter(
      (document) =>
        document.file !== null
    ).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form
        onSubmit={handleSubmit}
        aria-busy={isCreatingPackage}
        className={[
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition",
          isFormLocked
            ? "opacity-70"
            : "",
        ].join(" ")}
      >
        <fieldset
          disabled={isFormLocked}
          className="min-w-0"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-950">
              Impact Information
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Enter the basic impact details before
              uploading supporting documentation.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Reporting Period (YYYYMM)

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="202607"
                value={form.periodKey}
                onChange={(event) =>
                  updateField(
                    "periodKey",
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />

              {errors.periodKey ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.periodKey}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-700">
              Impact Line

              <select
                value={
                  form.impactLine
                }
                onChange={(event) =>
                  updateField(
                    "impactLine",
                    event.target
                      .value as ImpactLine
                  )
                }
                className={
                  inputClassName
                }
              >
                <option value="technology">
                  Technology
                </option>

                <option value="mingas">
                  Community Cleanups (Mingas)
                </option>

                <option value="recyclers_base">
                  Grassroots Recyclers
                </option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Scope Type

              <select
                value={
                  form.scopeType
                }
                onChange={(event) =>
                  updateField(
                    "scopeType",
                    event.target
                      .value as ScopeType
                  )
                }
                className={
                  inputClassName
                }
              >
                <option value="site">
                  Site
                </option>

                <option value="multi_site">
                  Multi-site
                </option>

                <option value="company">
                  Company
                </option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Reported Kilograms

              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="1000"
                value={
                  form.totalReportedKg
                }
                onChange={(event) =>
                  updateField(
                    "totalReportedKg",
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />

              {errors.totalReportedKg ? (
                <span className="mt-1 block text-xs text-red-600">
                  {
                    errors.totalReportedKg
                  }
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-700">
              Scope / Event Code

              <input
                type="text"
                placeholder="Enter a unique code for each impact event"
                value={form.scopeCode}
                onChange={(event) =>
                  updateField(
                    "scopeCode",
                    event.target.value.toUpperCase()
                  )
                }
                className={
                  inputClassName
                }
              />

              <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
                Example: SAN_PEDRO_CUMBAYA_20261015_01
              </span>

              {errors.scopeCode ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.scopeCode}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-700">
              Project &amp; Impact Identification

              <input
                type="text"
                placeholder="Project Name — Location — Date"
                value={form.scopeName}
                onChange={(event) =>
                  updateField(
                    "scopeName",
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />

              <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
                Example: San Pedro River Cleanup — Cumbayá — October 15, 2026
              </span>

              {errors.scopeName ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.scopeName}
                </span>
              ) : null}
            </label>
          </div>

          <label className="mt-10 block text-sm font-medium text-slate-700">
            Impact Description

            <textarea
              rows={4}
              placeholder="Describe the event, activity, or source that generated the reported impact."
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              className={
                inputClassName
              }
            />

            {errors.description ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.description}
              </span>
            ) : null}
          </label>

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Internal Notes

            <textarea
              rows={3}
              placeholder="Internal notes for the Ichthion team."
              value={
                form.internalNotes
              }
              onChange={(event) =>
                updateField(
                  "internalNotes",
                  event.target.value
                )
              }
              className={
                inputClassName
              }
            />
          </label>

          <EvidenceDocumentSlots
            key={documentsResetKey}
            onDocumentsChange={
              handleDocumentsChange
            }
          />

          {documentsError ? (
            <p className="mt-2 text-sm font-medium text-red-600">
              {documentsError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear Form
            </button>

            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Validate Information
            </button>
          </div>
        </fieldset>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">
            Operational Workflow
          </h3>

          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li>
              <strong className="text-slate-900">
                1.
              </strong>{" "}
              Record impact details.
            </li>

            <li>
              <strong className="text-slate-900">
                2.
              </strong>{" "}
              Upload supporting evidence.
            </li>

            <li>
              <strong className="text-slate-900">
                3.
              </strong>{" "}
              Review and verify the evidence package.
            </li>

            <li>
              <strong className="text-slate-900">
                4.
              </strong>{" "}
              Import verified kilograms.
            </li>

            <li>
              <strong className="text-slate-900">
                5.
              </strong>{" "}
              Convert verified impact into VIUs.
            </li>
          </ol>
        </div>

        {validatedForm ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Validated Information
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-emerald-700">
                  Reporting Period
                </dt>

                <dd className="font-semibold text-emerald-950">
                  {
                    validatedForm.periodKey
                  }
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">
                  Impact Line
                </dt>

                <dd className="font-semibold text-emerald-950">
                  {validatedForm.impactLine === "technology"
                    ? "Technology"
                    : validatedForm.impactLine === "mingas"
                    ? "Community Cleanups (Mingas)"
                    : "Grassroots Recyclers"}
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">
                  Scope / Event Code
                </dt>

                <dd className="break-all font-mono text-xs font-semibold text-emerald-950">
                  {
                    validatedForm.scopeCode
                  }
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">
                  Project &amp; Impact Identification
                </dt>

                <dd className="font-semibold text-emerald-950">
                  {
                    validatedForm.scopeName
                  }
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">
                  Reported Kilograms
                </dt>

                <dd className="font-semibold text-emerald-950">
                  {Number(
                    validatedForm.totalReportedKg
                  ).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  kg
                </dd>
              </div>

              <div>
                <dt className="text-emerald-700">
                  Selected Documents
                </dt>

                <dd className="font-semibold text-emerald-950">
                  {
                    selectedDocumentsCount
                  }
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-5 text-emerald-800">
              Local validation completed.
              Review the information before creating
              the evidence package and uploading documents.
            </p>

            <EvidenceUploadPanel
              input={{
                periodKey:
                  validatedForm.periodKey,

                impactLine:
                  validatedForm.impactLine,

                scopeType:
                  validatedForm.scopeType,

                scopeCode:
                  validatedForm.scopeCode,

                scopeName:
                  validatedForm.scopeName,

                totalReportedKg:
                  Number(
                    validatedForm.totalReportedKg
                  ),

                impactDescription:
                  validatedForm.description,

                internalNotes:
                  validatedForm.internalNotes,

                documents,
              }}
              onUploadingChange={
                setIsCreatingPackage
              }
              onCompleted={() => {
                setPackageCreated(true);
              }}
              onCreateAnother={
                handleReset
              }
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              No Preview Available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Complete the form, select the main impact
              report, and validate the information
              to preview the evidence package.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
