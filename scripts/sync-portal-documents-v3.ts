/**
 * Ichthion — Registry -> Client Portal Document Shadow (v3, physical-first).
 *
 * IMPORTANT: the source of truth is NOT portal_viu_evidence.
 *   Issued Portal VIU -> Registry monthly statement source -> Registry evidence
 *   package -> statement-frozen evidence files present in Registry Storage
 *   (line_report and optional_evidence). A physical object is uploaded once per authorized
 *   tenant/file and linked to every eligible VIU. The Registry original is
 *   never modified.
 *
 * Usage from Impact Registry repo:
 *   node scripts/sync-portal-documents-v3.ts --dry-run
 *   node scripts/sync-portal-documents-v3.ts --skip-missing-source
 *   node scripts/sync-portal-documents-v3.ts --tenant-id=<uuid> --dry-run
 *
 * Required .env.local variables:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   PORTAL_SUPABASE_URL, PORTAL_SUPABASE_SERVICE_ROLE_KEY
 *
 * Uses existing Portal table portal_viu_evidence columns storage_path,
 * copied_sha256, copied_at and PRIVATE Storage bucket portal-documents.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) loadEnvFile(".env.local");

const REGISTRY_BUCKET = "monthly-evidence-packages";
const PORTAL_BUCKET = "portal-documents";
const PAGE = 500;
const SCRIPT_VERSION = "v3-physical-first-2026-10-29";
const dryRun = process.argv.includes("--dry-run");
const skipMissingSource = process.argv.includes("--skip-missing-source");
const tenantArg = process.argv.find((x) => x.startsWith("--tenant-id="));
const requestedTenant = tenantArg?.slice("--tenant-id=".length) || null;

type PortalViu = {
  id: string;
  tenant_id: string;
  registry_viu_asset_id: string;
  allocation_status: string | null;
};
type RegistrySource = {
  statement_id: string | null;
  viu_asset_id: string | null;
  evidence_package_id: string | null;
  evidence_package_permanent_id: string | null;
  evidence_verification_status: string | null;
};
type RegistryFile = {
  id: string;
  package_id: string;
  file_name: string;
  storage_path: string;
};
type Snapshot = {
  statement_id: string | null;
  evidence_file_id: string;
  evidence_package_id: string | null;
  evidence_package_permanent_id: string | null;
  file_role: string | null;
  original_filename: string | null;
  mime_type: string | null;
  description: string | null;
  declared_sha256: string | null;
  calculated_sha256: string | null;
  hash_match: boolean | null;
  uploaded_at: string | null;
};
type ExistingEvidence = {
  id: string;
  portal_viu_id: string;
  tenant_id: string;
  registry_evidence_file_id: string;
  storage_path: string | null;
  copied_sha256: string | null;
};
type DocumentLink = { viu: PortalViu; source: RegistrySource; file: RegistryFile; snapshot: Snapshot | null };

type LinkGroup = { tenantId: string; file: RegistryFile; links: DocumentLink[] };

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}
function admin(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
async function all<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await client.from(table).select(cols).range(offset, offset + PAGE - 1);
    if (error) throw new Error(`Cannot query ${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    out.push(...batch);
    if (batch.length < PAGE) return out;
  }
}
/**
 * Enumerate actual Storage objects in the directories named by Registry records.
 * A row in monthly_evidence_files is NOT proof that its physical file exists.
 * This intentionally excludes old 202607 fixture paths before planning copies.
 */
async function physicallyPresentFiles(
  registry: SupabaseClient,
  files: RegistryFile[]
): Promise<Map<string, RegistryFile>> {
  const dirToFiles = new Map<string, RegistryFile[]>();
  for (const file of files) {
    if (!file.storage_path) continue;
    const cut = file.storage_path.lastIndexOf("/");
    if (cut < 0) throw new Error(`Unexpected Registry storage_path: ${file.id}`);
    const directory = file.storage_path.slice(0, cut);
    const group = dirToFiles.get(directory) ?? [];
    group.push(file);
    dirToFiles.set(directory, group);
  }
  const present = new Map<string, RegistryFile>();
  for (const [directory, group] of dirToFiles) {
    const names = new Set<string>();
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await registry.storage
        .from(REGISTRY_BUCKET)
        .list(directory, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
      if (error) {
        throw new Error(`Unable to list Registry Storage directory ${directory}: ${error.message}`);
      }
      const records = data ?? [];
      for (const record of records) {
        if (record.id) names.add(record.name); // file, not synthetic directory
      }
      if (records.length < PAGE) break;
    }
    for (const file of group) {
      const baseName = file.storage_path.slice(directory.length + 1);
      if (names.has(baseName)) present.set(file.id, file);
    }
  }
  return present;
}

function sha(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
function normalizedHash(value: string | null | undefined): string | null {
  if (!value) return null;
  const h = value.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) throw new Error("Registry contains invalid SHA-256 metadata.");
  return h;
}
function missingObject(message: string): boolean {
  return /object not found|resource was not found|file not found|^not found$/i.test(message);
}
async function download(client: SupabaseClient, bucket: string, key: string): Promise<Uint8Array> {
  const { data, error } = await client.storage.from(bucket).download(key);
  if (error || !data) {
    const e = new Error(`${bucket}/${key}: ${error?.message ?? "empty Storage response"}`);
    if (error && missingObject(error.message)) e.name = "MissingStorageObject";
    throw e;
  }
  return new Uint8Array(await data.arrayBuffer());
}
async function existingCopy(portal: SupabaseClient, key: string): Promise<Uint8Array | null> {
  try {
    return await download(portal, PORTAL_BUCKET, key);
  } catch (error) {
    if (error instanceof Error && error.name === "MissingStorageObject") return null;
    throw error;
  }
}
function mimeFromFile(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".csv")) return "text/csv";
  return "application/octet-stream";
}
function roleFromPath(path: string): string {
  return path.includes("/optional_evidence/") ? "optional_evidence" : "line_report";
}

async function main() {
  const registry = admin(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const portal = admin(env("PORTAL_SUPABASE_URL"), env("PORTAL_SUPABASE_SERVICE_ROLE_KEY"));

  // 1. Retrieve issued VIUs that have actually been projected into Portal and
  // have an explicit tenant mapping. Never guess a tenant from a filename.
  const portalVius = (await all<PortalViu>(portal, "portal_vius",
    "id,tenant_id,registry_viu_asset_id,allocation_status"))
    .filter((v) => v.allocation_status === "issued" &&
      (!requestedTenant || v.tenant_id === requestedTenant));
  const byRegistryViu = new Map<string, PortalViu[]>();
  for (const viu of portalVius) {
    const list = byRegistryViu.get(viu.registry_viu_asset_id) ?? [];
    list.push(viu);
    byRegistryViu.set(viu.registry_viu_asset_id, list);
  }

  // 2. Registry AUTHORITATIVE source/package links; do not start from the
  // previously projected portal_viu_evidence manifest.
  const sources = await all<RegistrySource>(registry, "monthly_impact_statement_sources",
    "statement_id,viu_asset_id,evidence_package_id,evidence_package_permanent_id,evidence_verification_status");
  const registryFiles = await all<RegistryFile>(registry, "monthly_evidence_files",
    "id,package_id,file_name,storage_path");
  const snapshots = await all<Snapshot>(registry, "monthly_impact_statement_evidence_files",
    "statement_id,evidence_file_id,evidence_package_id,evidence_package_permanent_id,file_role,original_filename,mime_type,description,declared_sha256,calculated_sha256,hash_match,uploaded_at");

  // Restrict source inventory to physical objects, before assembling client copies.
  // Do not copy everything physically present: a file must also have a frozen
  // statement-evidence link to an issued VIU for its target tenant.
  const existingRegistryFiles = await physicallyPresentFiles(registry, registryFiles);
  const snapshotByStatementPackage = new Map<string, Snapshot[]>();
  for (const snapshot of snapshots) {
    if (!snapshot.statement_id) continue;
    for (const packageId of new Set([
      snapshot.evidence_package_id,
      snapshot.evidence_package_permanent_id,
    ].filter((v): v is string => Boolean(v)))) {
      const key = `${snapshot.statement_id}::${packageId}`;
      const rows = snapshotByStatementPackage.get(key) ?? [];
      rows.push(snapshot);
      snapshotByStatementPackage.set(key, rows);
    }
  }

  const groups = new Map<string, LinkGroup>();
  let sourceLinks = 0;
  let unresolvedPackages = 0;
  let sourcesWithoutIssuedViu = 0;
  const eligiblePhysicalIds = new Set<string>();

  for (const source of sources) {
    if (!source.viu_asset_id) continue;
    const issued = byRegistryViu.get(source.viu_asset_id);
    if (!issued?.length) {
      sourcesWithoutIssuedViu++;
      continue;
    }
    sourceLinks++;

    // Precise join: frozen evidence for THIS statement AND THIS evidence
    // package. Never authorize a document just because it shares a folder.
    const statementFiles = new Map<string, Snapshot>();
    if (source.statement_id) {
      for (const packageId of [source.evidence_package_id, source.evidence_package_permanent_id]) {
        if (!packageId) continue;
        for (const snapshot of snapshotByStatementPackage.get(
          `${source.statement_id}::${packageId}`
        ) ?? []) {
          statementFiles.set(snapshot.evidence_file_id, snapshot);
        }
      }
    }
    if (statementFiles.size === 0) {
      // An issued source with no frozen evidence cannot authorize any file.
      unresolvedPackages++;
      continue;
    }

    for (const [fileId, snapshot] of statementFiles) {
      const file = existingRegistryFiles.get(fileId);
      if (!file) continue; // historical/no-physical-object: never planned
      if (source.evidence_package_id && file.package_id !== source.evidence_package_id) {
        // Do not cross packages when old permanent-id metadata is ambiguous.
        continue;
      }
      eligiblePhysicalIds.add(file.id);
      for (const viu of issued) {
        const key = `${viu.tenant_id}/${file.id}`;
        const group = groups.get(key) ?? {
          tenantId: viu.tenant_id, file, links: [],
        };
        if (!group.links.some((link) => link.viu.id === viu.id)) {
          group.links.push({ viu, source, file, snapshot });
        }
        groups.set(key, group);
      }
    }
  }

  console.log(`Script version: ${SCRIPT_VERSION}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "WRITE"}`);
  console.log(`Physical objects in Registry inventory: ${existingRegistryFiles.size}`);
  console.log(`Issued Portal VIUs: ${portalVius.length}`);
  console.log(`Registry statement links to issued VIUs: ${sourceLinks}`);
  console.log(`Eligible physical source documents: ${eligiblePhysicalIds.size}`);
  console.log(`Authorized tenant/document copies: ${groups.size}`);
  console.log(`Issued statement links lacking frozen evidence: ${unresolvedPackages}`);
  console.log(`Registry statement links without issued Portal VIUs: ${sourcesWithoutIssuedViu}`);

  let copied = 0;
  let unchanged = 0;
  let repaired = 0;
  let missingSource = 0;
  let failed = 0;
  let metadataRows = 0;
  let dryRunReady = 0;
  const now = new Date().toISOString();

  for (const [destPath, group] of groups) {
    try {
      const { file, links, tenantId } = group;
      if (!file.storage_path) throw new Error("Evidence file has no Registry storage_path.");
      const hashes = new Set<string>();
      for (const link of links) {
        const s = link.snapshot;
        if (s?.hash_match === false || ["rejected", "hash_mismatch"].includes(
          (link.source.evidence_verification_status ?? "").toLowerCase())) {
          throw new Error("Rejected evidence or known hash mismatch; not copying.");
        }
        for (const h of [s?.declared_sha256, s?.calculated_sha256]) {
          const normalized = normalizedHash(h);
          if (normalized) hashes.add(normalized);
        }
      }
      if (hashes.size > 1) throw new Error("Conflicting hashes in Registry statement snapshots.");
      // A dry run MUST check the physical Registry object, not just metadata.
      // The previous script reported 25 planned copies while 23 did not exist.
      let bytes: Uint8Array;
      try {
        bytes = await download(registry, REGISTRY_BUCKET, file.storage_path);
      } catch (error) {
        if (error instanceof Error && error.name === "MissingStorageObject") {
          missingSource++;
          console.warn(`[MISSING_SOURCE] ${file.storage_path} (document ${file.id}); no Portal access published`);
          continue;
        }
        throw error;
      }
      const sourceHash = sha(bytes);
      if (hashes.size === 1 && sourceHash !== [...hashes][0]) {
        throw new Error(`SHA-256 mismatch for ${file.storage_path}; refusing to publish.`);
      }
      if (dryRun) {
        dryRunReady++;
        console.log(`[READY] ${destPath} <- ${file.storage_path} (${links.length} VIU link(s))`);
        continue;
      }

      const current = await existingCopy(portal, destPath);
      const currentHash = current ? sha(current) : null;
      if (currentHash !== sourceHash) {
        const { error } = await portal.storage.from(PORTAL_BUCKET).upload(destPath, bytes, {
          contentType: links.find((l) => l.snapshot?.mime_type)?.snapshot?.mime_type ?? mimeFromFile(file.file_name),
          upsert: true,
          cacheControl: "0",
        });
        if (error) throw new Error(`Portal upload failed: ${error.message}`);
        const checked = await download(portal, PORTAL_BUCKET, destPath);
        if (sha(checked) !== sourceHash) throw new Error("Copied file failed SHA-256 verification.");
      }

      // Register EVERY VIU link only after the verified physical copy exists.
      // This also repairs missing rows in the previous metadata-only producer.
      const rows = links.map(({ viu, source, snapshot }) => ({
        tenant_id: tenantId,
        portal_viu_id: viu.id,
        registry_evidence_file_id: file.id,
        evidence_package_permanent_id: source.evidence_package_permanent_id,
        file_role: snapshot?.file_role ?? roleFromPath(file.storage_path),
        original_filename: snapshot?.original_filename ?? file.file_name,
        mime_type: snapshot?.mime_type ?? mimeFromFile(file.file_name),
        description: snapshot?.description ?? null,
        declared_sha256: snapshot?.declared_sha256 ?? null,
        calculated_sha256: snapshot?.calculated_sha256 ?? null,
        hash_match: snapshot?.hash_match ?? null,
        verification_status: snapshot?.hash_match === false ? "hash_mismatch" :
          source.evidence_verification_status ?? (snapshot?.hash_match === true ? "verified" : null),
        registry_uploaded_at: snapshot?.uploaded_at ?? null,
        storage_path: destPath,
        copied_sha256: sourceHash,
        copied_at: now,
        synced_at: now,
        updated_at: now,
      }));
      const { error: metadataError } = await portal.from("portal_viu_evidence")
        .upsert(rows, { onConflict: "portal_viu_id,registry_evidence_file_id" });
      if (metadataError) throw new Error(`Portal metadata upsert failed: ${metadataError.message}`);
      metadataRows += rows.length;
      if (currentHash === sourceHash) unchanged++;
      else if (currentHash) repaired++;
      else copied++;
      console.log(`[OK] ${destPath} (${links.length} VIU link(s))`);
    } catch (error) {
      failed++;
      console.error(`[FAIL] ${destPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (dryRun) {
    console.log(`Physical copies ready: ${dryRunReady} | Missing source during transfer: ${missingSource} | Failed: ${failed} | Unresolved packages: ${unresolvedPackages}`);
    console.log("AUDIT: Document sync dry run complete. No changes written.");
    if (failed || unresolvedPackages) process.exitCode = 1;
    return;
  }
  console.log(`Portal evidence metadata links updated: ${metadataRows}`);
  console.log(`Copied: ${copied} | Unchanged: ${unchanged} | Repaired: ${repaired} | Missing source: ${missingSource} | Failed: ${failed}`);
  if (failed > 0 || unresolvedPackages > 0) {
    throw new Error(`Document sync incomplete: ${failed} failures and ${unresolvedPackages} unresolved package links.`);
  }
  if (missingSource > 0) {
    const message = `PARTIAL: ${missingSource} Registry document copies have no physical source.`;
    if (!skipMissingSource) throw new Error(message);
    console.warn(message);
    return;
  }
  console.log("PASS: Registry -> Portal document sync completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
