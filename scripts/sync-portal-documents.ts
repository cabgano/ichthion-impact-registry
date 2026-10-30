/**
 * Ichthion — Registry Storage -> Client Portal Storage (V6: exact bucket mirror).
 *
 * Physical sync: copy EVERY object from Registry bucket monthly-evidence-packages
 * to Portal PRIVATE bucket portal-documents, preserving the exact object key.
 * A file is uploaded only when absent or when its SHA-256 differs. Never delete.
 *
 * Relation sync: independently link each issued Portal VIU to ALL evidence files
 * in its Registry origin package through the canonical lineage:
 *   portal_vius.registry_viu_asset_id -> viu_assets.source_verified_impact_id
 *   -> monthly_verified_impacts.source_package_id -> monthly_evidence_files.package_id
 * The physical file is stored ONCE in the Portal (even for multiple tenants).
 * Each authorized VIU gets its own portal_viu_evidence metadata row; the Portal
 * must authorize access using tenant membership before creating signed URLs.
 *
 * Usage (Impact Registry root):
 *   node scripts/sync-portal-documents-v6.ts --dry-run
 *   node scripts/sync-portal-documents-v6.ts
 *   node scripts/sync-portal-documents-v6.ts --skip-missing-source
 *
 * Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *           PORTAL_SUPABASE_URL, PORTAL_SUPABASE_SERVICE_ROLE_KEY.
 * Assumes Portal private Storage bucket portal-documents, Portal table
 * portal_viu_evidence with storage_path, copied_sha256, copied_at columns.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) loadEnvFile(".env.local");

const VERSION = "v6-exact-bucket-mirror-2026-10-29";
const REGISTRY_BUCKET = "monthly-evidence-packages";
const PORTAL_BUCKET = "portal-documents";
const PAGE = 500;
const DRY_RUN = process.argv.includes("--dry-run");
// Accepted only for compatibility with the existing button's API.
const SKIP_MISSING_SOURCE = process.argv.includes("--skip-missing-source");

interface PortalViu {
  id: string;
  tenant_id: string;
  registry_viu_asset_id: string;
  allocation_status: string | null;
}
interface RegistryViuAsset {
  id: string;
  source_verified_impact_id: string;
  allocated_to_client_id: string | null;
}
interface VerifiedImpact { id: string; source_package_id: string }
interface Package { id: string; permanent_id: string }
interface IssuedViu {
  viu_asset_id: string;
  client_id: string | null;
  allocation_status: string | null;
}
interface Client { id: string; main_platform_client_id: string | null }
interface EvidenceFile {
  id: string;
  package_id: string;
  file_name: string;
  file_role: string;
  storage_path: string;
  mime_type: string | null;
  declared_sha256: string | null;
  calculated_sha256: string | null;
  hash_match: boolean | null;
  uploaded_at: string | null;
}
interface PortalEvidence {
  id: string;
  tenant_id: string;
  portal_viu_id: string;
  registry_evidence_file_id: string;
  description: string | null;
  verification_status: string | null;
  storage_path: string | null;
  copied_sha256: string | null;
}
interface Link { viu: PortalViu; file: EvidenceFile; pack: Package }

function need(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}
function admin(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
async function all<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await client.from(table).select(columns)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`Cannot read ${table}: ${error.message}`);
    const items = (data ?? []) as T[];
    result.push(...items);
    if (items.length < PAGE) return result;
  }
}
/** List real objects recursively, not SQL rows and not synthetic folders. */
async function listAllStorageObjects(client: SupabaseClient, bucket: string): Promise<string[]> {
  const paths: string[] = [];
  const visited = new Set<string>();
  async function visit(prefix: string) {
    if (visited.has(prefix)) return;
    visited.add(prefix);
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await client.storage.from(bucket).list(prefix, {
        limit: PAGE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Cannot list ${bucket}/${prefix}: ${error.message}`);
      const entries = data ?? [];
      for (const entry of entries) {
        const key = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (!entry.name || entry.name === ".emptyFolderPlaceholder") continue;
        if (entry.id) paths.push(key); // object
        else await visit(key); // folder
      }
      if (entries.length < PAGE) break;
    }
  }
  await visit("");
  return [...new Set(paths)].sort();
}
function hash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
function normalizedHash(h: string | null): string | null {
  if (!h?.trim()) return null;
  const x = h.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(x)) throw new Error(`Invalid SHA-256 metadata: ${h}`);
  return x;
}
async function download(client: SupabaseClient, bucket: string, key: string): Promise<Uint8Array> {
  const { data, error } = await client.storage.from(bucket).download(key);
  if (error || !data) throw new Error(`Cannot download ${bucket}/${key}: ${error?.message ?? "empty response"}`);
  return new Uint8Array(await data.arrayBuffer());
}
function mimeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop();
  const types: Record<string, string> = {
    pdf: "application/pdf", json: "application/json", jpg: "image/jpeg",
    jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    csv: "text/csv", txt: "text/plain", zip: "application/zip",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return types[ext ?? ""] ?? "application/octet-stream";
}
function pairKey(viuId: string, fileId: string): string {
  return `${viuId}::${fileId}`;
}

async function main() {
  const registry = admin(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"));
  const portal = admin(need("PORTAL_SUPABASE_URL"), need("PORTAL_SUPABASE_SERVICE_ROLE_KEY"));
  console.log(`Script version: ${VERSION}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "WRITE"}`);
  console.log(`Registry bucket: ${REGISTRY_BUCKET} | Portal bucket: ${PORTAL_BUCKET}`);
  if (SKIP_MISSING_SOURCE) console.log("Legacy --skip-missing-source accepted; only real Storage objects are mirrored.");

  // 1) Source is the actual bucket; nothing is filtered by a VIU, statement, or tenant.
  const [sourceKeys, targetKeys, files] = await Promise.all([
    listAllStorageObjects(registry, REGISTRY_BUCKET),
    listAllStorageObjects(portal, PORTAL_BUCKET),
    all<EvidenceFile>(registry, "monthly_evidence_files",
      "id,package_id,file_name,file_role,storage_path,mime_type,declared_sha256,calculated_sha256,hash_match,uploaded_at"),
  ]);
  const targetSet = new Set(targetKeys);
  const filesByPath = new Map<string, EvidenceFile[]>();
  for (const f of files) {
    const samePath = filesByPath.get(f.storage_path) ?? [];
    samePath.push(f);
    filesByPath.set(f.storage_path, samePath);
  }
  console.log(`Physical objects found in Registry bucket: ${sourceKeys.length}`);
  console.log(`Registered file records in Registry: ${files.length}`);
  console.log(`Existing physical objects in Portal bucket: ${targetKeys.length}`);

  let copied = 0, unchanged = 0, repaired = 0, failed = 0;
  const verified = new Map<string, string>(); // source key -> SHA-256, only when already safe in target
  const issues: string[] = [];

  for (const key of sourceKeys) {
    try {
      const candidates = filesByPath.get(key) ?? [];
      const bytes = await download(registry, REGISTRY_BUCKET, key);
      const sourceHash = hash(bytes);
      // Mirror source bytes exactly. A stale Registry metadata hash must NOT
      // silently exclude a physical object from the requested bucket mirror.
      // Report discrepancies; the Portal's document access route will apply
      // the evidence verification policy separately.
      for (const f of candidates) {
        try {
          const declared = normalizedHash(f.declared_sha256);
          const calculated = normalizedHash(f.calculated_sha256);
          if (f.hash_match === false ||
              (declared && declared !== sourceHash) ||
              (calculated && calculated !== sourceHash)) {
            console.warn(`[SOURCE_HASH_WARNING] ${key} (Registry file ID ${f.id})`);
          }
        } catch (error) {
          console.warn(`[INVALID_REGISTRY_HASH_METADATA] ${key} (${f.id}): ${String(error)}`);
        }
      }
      const existed = targetSet.has(key);
      const targetHash = existed ? hash(await download(portal, PORTAL_BUCKET, key)) : null;
      if (targetHash === sourceHash) {
        unchanged++;
        verified.set(key, sourceHash);
        console.log(`[UNCHANGED] ${key}`);
        continue;
      }
      if (DRY_RUN) {
        if (existed) repaired++;
        else copied++;
        console.log(`[${existed ? "REPAIR" : "COPY"}] ${key}`);
        // An object is NOT yet present/verified in the destination on dry run.
        continue;
      }
      const mimeType = candidates[0]?.mime_type ?? mimeFromName(key);
      const { error: uploadError } = await portal.storage.from(PORTAL_BUCKET).upload(key, bytes, {
        upsert: true,
        contentType: mimeType,
        cacheControl: "0",
      });
      if (uploadError) throw new Error(`Cannot upload Portal/${key}: ${uploadError.message}`);
      const afterHash = hash(await download(portal, PORTAL_BUCKET, key));
      if (afterHash !== sourceHash) throw new Error(`Portal integrity verification failed for ${key}`);
      verified.set(key, sourceHash);
      if (existed) repaired++; else copied++;
      console.log(`[${existed ? "REPAIRED" : "COPIED"}] ${key}`);
    } catch (error) {
      failed++;
      const msg = `${key}: ${error instanceof Error ? error.message : String(error)}`;
      issues.push(msg);
      console.error(`[FAIL] ${msg}`);
    }
  }

  // 2) Link metadata to the very same original file. Do not copy per tenant.
  // Only links with matching authoritative Registry tenant assignment are projected.
  const [portalVius, assets, impacts, packages, issued, clients, existingEvidence] = await Promise.all([
    all<PortalViu>(portal, "portal_vius", "id,tenant_id,registry_viu_asset_id,allocation_status"),
    all<RegistryViuAsset>(registry, "viu_assets", "id,source_verified_impact_id,allocated_to_client_id"),
    all<VerifiedImpact>(registry, "monthly_verified_impacts", "id,source_package_id"),
    all<Package>(registry, "monthly_evidence_packages", "id,permanent_id"),
    all<IssuedViu>(registry, "viu_asset_verification_page", "viu_asset_id,client_id,allocation_status"),
    all<Client>(registry, "impact_clients", "id,main_platform_client_id"),
    all<PortalEvidence>(portal, "portal_viu_evidence",
      "id,tenant_id,portal_viu_id,registry_evidence_file_id,description,verification_status,storage_path,copied_sha256"),
  ]);
  const assetsById = new Map(assets.map((x) => [x.id, x]));
  const impactById = new Map(impacts.map((x) => [x.id, x]));
  const packageById = new Map(packages.map((x) => [x.id, x]));
  const issuedById = new Map(issued.filter((x) => x.allocation_status === "issued")
    .map((x) => [x.viu_asset_id, x]));
  const clientsById = new Map(clients.map((x) => [x.id, x]));
  const filesByPackage = new Map<string, EvidenceFile[]>();
  for (const f of files) {
    const group = filesByPackage.get(f.package_id) ?? [];
    group.push(f);
    filesByPackage.set(f.package_id, group);
  }
  const existingByPair = new Map(existingEvidence.map((x) =>
    [pairKey(x.portal_viu_id, x.registry_evidence_file_id), x]));
  const sourceSet = new Set(sourceKeys);
  const plannedLinks = new Map<string, Link>();
  let unmappedVius = 0, missingPhysicalLinks = 0;
  for (const viu of portalVius.filter((v) => v.allocation_status === "issued")) {
    const asset = assetsById.get(viu.registry_viu_asset_id);
    const issuedViu = issuedById.get(viu.registry_viu_asset_id);
    const client = issuedViu?.client_id ? clientsById.get(issuedViu.client_id) : null;
    if (!asset || !issuedViu || !client || client.main_platform_client_id !== viu.tenant_id ||
        (asset.allocated_to_client_id && asset.allocated_to_client_id !== issuedViu.client_id)) {
      unmappedVius++;
      console.error(`[UNAUTHORIZED_OR_UNMAPPED_VIU] ${viu.registry_viu_asset_id}`);
      continue;
    }
    const impact = impactById.get(asset.source_verified_impact_id);
    const pack = impact ? packageById.get(impact.source_package_id) : null;
    if (!pack) {
      unmappedVius++;
      console.error(`[NO_ORIGIN_PACKAGE] ${viu.registry_viu_asset_id}`);
      continue;
    }
    for (const file of filesByPackage.get(pack.id) ?? []) {
      if (!sourceSet.has(file.storage_path)) {
        missingPhysicalLinks++;
        continue;
      }
      plannedLinks.set(pairKey(viu.id, file.id), { viu, file, pack });
    }
  }
  console.log(`Portal issued VIUs: ${portalVius.filter((x) => x.allocation_status === "issued").length}`);
  console.log(`Authorized physical VIU/file associations: ${plannedLinks.size}`);
  console.log(`Links to absent physical source objects (not published): ${missingPhysicalLinks}`);
  console.log(`VIUs with mapping/provenance conflicts: ${unmappedVius}`);

  let metadataUpdated = 0;
  const now = new Date().toISOString();
  if (!DRY_RUN) {
    const rows = [];
    for (const { viu, file, pack } of plannedLinks.values()) {
      const digest = verified.get(file.storage_path);
      if (!digest) continue; // Never advertise an unavailable/unverified Portal object.
      const existing = existingByPair.get(pairKey(viu.id, file.id));
      rows.push({
        tenant_id: viu.tenant_id,
        portal_viu_id: viu.id,
        registry_evidence_file_id: file.id,
        evidence_package_permanent_id: pack.permanent_id,
        file_role: file.file_role,
        original_filename: file.file_name,
        mime_type: file.mime_type ?? mimeFromName(file.file_name),
        description: existing?.description ?? null,
        declared_sha256: file.declared_sha256,
        calculated_sha256: file.calculated_sha256,
        hash_match: file.hash_match,
        verification_status: file.hash_match === false ? "hash_mismatch" : (existing?.verification_status ?? "linked"),
        registry_uploaded_at: file.uploaded_at,
        storage_path: file.storage_path, // SAME key as original Registry bucket.
        copied_sha256: digest,
        copied_at: now,
        synced_at: now,
        updated_at: now,
      });
    }
    for (let i = 0; i < rows.length; i += PAGE) {
      const batch = rows.slice(i, i + PAGE);
      const { error } = await portal.from("portal_viu_evidence")
        .upsert(batch, { onConflict: "portal_viu_id,registry_evidence_file_id" });
      if (error) {
        failed++;
        issues.push(`Portal evidence metadata upsert: ${error.message}`);
        console.error(`[FAIL] Portal evidence metadata upsert: ${error.message}`);
      } else metadataUpdated += batch.length;
    }
  } else {
    console.log(`Metadata associations to upsert if written: ${plannedLinks.size}`);
  }
  console.log(`Copied: ${copied} | Unchanged: ${unchanged} | Repaired: ${repaired} | Missing source: 0 | Failed: ${failed}`);
  console.log(`Metadata links updated: ${metadataUpdated}`);
  if (failed) throw new Error(`${failed} Storage/metadata operations failed.\n${issues.join("\n")}`);
  if (unmappedVius > 0) {
    throw new Error(`${unmappedVius} Portal VIU(s) could not be safely associated to Registry lineage.`);
  }
  if (DRY_RUN) {
    console.log("AUDIT: Exact-bucket-mirror dry run completed. No writes performed.");
  } else {
    console.log("PASS: Registry -> Portal document sync completed.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
