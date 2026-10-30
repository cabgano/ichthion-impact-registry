ICHtHION — Portal Shadow button repair

ROOT CAUSE
The old scripts/project-portal-shadow.ts currently attempts physical document copies (Manifest rows / Unique tenant-document copies) and fails on 23 historical records with no actual Storage object. The already-successful V6 physical mirror uses a DIFFERENT script, scripts/sync-portal-documents.ts.

WHAT IS PROVIDED
- repair/project-portal-shadow.ts: historical Registry-to-Portal metadata/VIU projector from the earlier validated project source. No Storage calls.
- repair/apply.ps1: guarded backup and replacement of the incorrectly installed old document copier; rejects files with unknown structure.

STEPS (PowerShell IN IMPACT REGISTRY ROOT)
1) Expand-Archive -LiteralPath "$HOME\Downloads\Ichthion-Portal-Shadow-Repair.zip" -DestinationPath . -Force
2) powershell -NoProfile -ExecutionPolicy Bypass -File .\repair\apply.ps1
3) node .\scripts\project-portal-shadow.ts --dry-run
4) If PASS: Registry projection payload can be constructed, click Sync Portal Shadow.

Do not copy 23 missing historical objects and do not modify Sync Documents V6.
The script is an older saved projection snapshot; if the user introduced newer projection-specific features since that snapshot, inspect the backup/diff before replacing in production.
