# Backup & Restore Guide (Project-Plernping-Cafe)

## Backup artifacts currently created on this machine

Backup folder:
- `D:\Backups\Project-Plernping-Cafe`

Current files:
- `Project-Plernping-Cafe_repo_20260304_132501.zip` (source snapshot)
- `Project-Plernping-Cafe_repo_20260304_132501.bundle` (full git history)
- `backup-supabase-db.ps1` (DB backup script)
- `README_RESTORE.md` (standalone restore instructions)

## Restore project files from ZIP

```powershell
Expand-Archive "D:\Backups\Project-Plernping-Cafe\Project-Plernping-Cafe_repo_20260304_132501.zip" -DestinationPath "D:\Restore\Project-Plernping-Cafe" -Force
cd D:\Restore\Project-Plernping-Cafe
npm install
npm run dev
```

## Restore full git repository from bundle

```powershell
mkdir D:\Restore\Project-Plernping-Cafe
cd D:\Restore\Project-Plernping-Cafe
git clone D:\Backups\Project-Plernping-Cafe\Project-Plernping-Cafe_repo_20260304_132501.bundle .
git log --oneline -5
```

## Supabase database backup (schema + data)

### Why DB backup not completed yet
Backup from this environment requires one of:
1) Supabase access token with permission to project `gomjfnkzhxqfmbwmaphz`, or
2) valid Postgres connection URL with actual DB password.

Current provided credentials were not sufficient for direct export.

### Run DB backup once credentials are ready

Option A: with Supabase Access Token
```powershell
$env:SUPABASE_ACCESS_TOKEN = "<TOKEN_WITH_PROJECT_ACCESS>"
& "D:\Backups\Project-Plernping-Cafe\backup-supabase-db.ps1"
```

Option B: with full Postgres URL (manual)
```powershell
# Requires pg_dump installed
pg_dump "<POSTGRES_CONNECTION_URL>" --schema-only > D:\Backups\Project-Plernping-Cafe\supabase-db\supabase_schema.sql
pg_dump "<POSTGRES_CONNECTION_URL>" --data-only > D:\Backups\Project-Plernping-Cafe\supabase-db\supabase_data.sql
```

## Restore Supabase database from SQL files

```powershell
# Requires psql installed
psql "<POSTGRES_CONNECTION_URL>" -f D:\Backups\Project-Plernping-Cafe\supabase-db\supabase_schema_YYYYMMDD_HHMMSS.sql
psql "<POSTGRES_CONNECTION_URL>" -f D:\Backups\Project-Plernping-Cafe\supabase-db\supabase_data_YYYYMMDD_HHMMSS.sql
```

## Integrity checks after restore

```powershell
git status
npm run build
```

And verify key tables exist: `rooms`, `room_availability`, `menus`, `chat_logs`, `booking_abuse_events`, `booking_blacklist`.
