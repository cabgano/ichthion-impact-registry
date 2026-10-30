$ErrorActionPreference = "Stop"

# Run from the Impact Registry project root. Neither Portal DB nor Storage is touched here.
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$target = Join-Path $root "scripts\project-portal-shadow.ts"
$replacement = Join-Path $PSScriptRoot "project-portal-shadow.ts"

if (!(Test-Path (Join-Path $root "package.json"))) {
  throw "Run the installer from the Impact Registry repo. package.json not found."
}
if (!(Test-Path -LiteralPath $target)) {
  throw "Missing target: $target"
}
if (!(Test-Path -LiteralPath $replacement)) {
  throw "Missing replacement: $replacement"
}

$current = Get-Content -LiteralPath $target -Raw
if ($current.Contains("PASS: Registry") -and $current.Contains('portal_vius') -and !$current.Contains("Unique tenant/document copies")) {
  Write-Host "Already using a Registry-to-Portal projection script. No changes made." -ForegroundColor Yellow
  exit 0
}

$looksLikeOldDocCopier = $current.Contains("Unique tenant/document copies") -or $current.Contains("document copy/copies failed") -or $current.Contains("Manifest rows:")
if (!$looksLikeOldDocCopier) {
  throw "The current script does not match the obsolete document-copy signatures. No files changed. Inspect the script before replacing it."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root "scripts\project-portal-shadow.ts.backup-$stamp"
Copy-Item -LiteralPath $target -Destination $backup -Force
Copy-Item -LiteralPath $replacement -Destination $target -Force

$installed = Get-Content -LiteralPath $target -Raw
if (!$installed.Contains("PASS: Registry") -or !$installed.Contains('portal_viu_evidence') -or $installed.Contains("Unique tenant/document copies")) {
  Copy-Item -LiteralPath $backup -Destination $target -Force
  throw "Unexpected installation result. Backup restored."
}

Write-Host "Restored the Registry-to-Portal data projection script." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "NEXT (in Impact Registry root): node .\scripts\project-portal-shadow.ts --dry-run"
Write-Host "If the dry-run succeeds, click Sync Portal Shadow in the app."
