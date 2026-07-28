import { EvidenceIntakeForm } from "@/components/impact/EvidenceIntakeForm";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { getCurrentImpactUserPermissions } from "@/lib/impact/permissions";

export default async function NewEvidencePackagePage() {
  const permissions = await getCurrentImpactUserPermissions();
  const canOperate = permissions.can_operate_impact;

  return (
    <>
      <ImpactPageHeader
        eyebrow="Operational workflow"
        title="New evidence package"
        description="Registre la información inicial de un nuevo evento de impacto antes de cargar, verificar e importar su evidencia."
      >
        <ImpactStatusPill
          status={canOperate ? "operational" : "read_only"}
        />
      </ImpactPageHeader>

      {canOperate ? (
        <EvidenceIntakeForm />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Acceso operativo requerido.</strong>
          <p className="mt-1">
            Su rol actual puede consultar información, pero no puede crear
            paquetes de evidencia.
          </p>
        </div>
      )}
    </>
  );
}
