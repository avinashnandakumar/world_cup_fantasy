# Local Live Data Sync

Use the free local sync path by default:

- Script: `scripts/sync_worldcup_free.py`
- Setup/runbook: `docs/free-live-sync-offline.md`
- Source: ESPN public scoreboard JSON
- Write behavior: Google Sheets is updated only when the normalized match/event hash changes.

The old paid-provider approach is intentionally not the default. The free script keeps local match history in `.worldcup-free-sync-state.json`, prevents overlapping minute runs with `.worldcup-free-sync.lock`, and sends canonical `matches`/`events` to the existing Apps Script `doPost` endpoint.

Quick smoke test:

```bash
python3 -m py_compile scripts/sync_worldcup_free.py
python3 scripts/sync_worldcup_free.py --dry-run --no-fetch-details
```

Cron setup and offline recovery steps live in:

```text
docs/free-live-sync-offline.md
```
