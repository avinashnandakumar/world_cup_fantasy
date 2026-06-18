#!/usr/bin/env python3
"""Summarize local World Cup sync health from state and cron logs."""

from __future__ import annotations

import argparse
import html
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import run_worldcup_live_sync as gate


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STATE_FILE = REPO_ROOT / ".worldcup-free-sync-state.json"
DEFAULT_LOG_FILE = REPO_ROOT / "logs" / "worldcup-live-sync.log"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def resolve_project_path(value: str | Path) -> Path:
    path = Path(value)
    return path if path.is_absolute() else REPO_ROOT / path


def load_json_file(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def read_recent_lines(path: Path, max_lines: int) -> list[str]:
    if not path.exists():
        return []
    lines = path.read_text(errors="replace").splitlines()
    return lines[-max_lines:]


def last_line_matching(lines: list[str], needles: tuple[str, ...]) -> str:
    for line in reversed(lines):
        if any(needle in line for needle in needles):
            return line
    return ""


def recent_change_lines(lines: list[str], limit: int) -> list[str]:
    changes: list[str] = []
    capture = False
    for line in lines:
        if "New/changed data detected:" in line:
            changes = []
            capture = True
            continue
        if capture:
            if line.startswith("- NEW ") or line.startswith("- UPDATED "):
                changes.append(line[2:])
                continue
            if changes:
                capture = False
    return changes[-limit:]


def recent_issue_lines(lines: list[str], limit: int) -> list[str]:
    issue_needles = ("ERROR", "mismatch", "rejected", "failed", "Traceback")
    return [line for line in lines if any(needle in line for needle in issue_needles)][-limit:]


def destination_summary(state: dict[str, Any]) -> list[dict[str, Any]]:
    destinations = state.get("destinations") or {}
    rows = []
    for key, value in sorted(destinations.items()):
        if isinstance(value, dict):
            rows.append({
                "key": key,
                "lastPostedAtUtc": value.get("lastPostedAtUtc") or "",
                "matches": value.get("matches") or "",
                "events": value.get("events") or "",
            })
    return rows


def known_match_rows(state: dict[str, Any]) -> list[dict[str, Any]]:
    matches = state.get("knownMatches") or {}
    return [match for match in matches.values() if isinstance(match, dict)]


def known_event_rows(state: dict[str, Any]) -> list[dict[str, Any]]:
    events = state.get("knownEvents") or {}
    return [event for event in events.values() if isinstance(event, dict)]


def state_statuses(state: dict[str, Any]) -> dict[str, str]:
    return {
        str(match.get("matchId") or ""): str(match.get("status") or "")
        for match in known_match_rows(state)
        if match.get("matchId")
    }


def current_poll_windows(state: dict[str, Any]) -> list[str]:
    now = datetime.now(timezone.utc)
    active = gate.active_matches(
        now,
        state_statuses(state),
        gate.DEFAULT_GROUP_LIVE_MINUTES,
        gate.DEFAULT_KNOCKOUT_LIVE_MINUTES,
        gate.DEFAULT_MAX_POLL_MINUTES,
    )
    return [f"{match.label} ({status}, kickoff {match.kickoff_utc.isoformat()})" for match, status in active]


def build_status(state_path: Path, log_path: Path, max_log_lines: int) -> dict[str, Any]:
    state = load_json_file(state_path)
    lines = read_recent_lines(log_path, max_log_lines)
    matches = known_match_rows(state)
    events = known_event_rows(state)
    status_counts = Counter(str(match.get("status") or "<blank>") for match in matches)
    event_counts = Counter(str(event.get("eventType") or "<blank>") for event in events)
    source_counts = Counter(str(event.get("source") or "<blank>") for event in events)
    non_final = sorted(
        [
            match
            for match in matches
            if str(match.get("status") or "") not in {"final", "postponed"}
        ],
        key=lambda row: (str(row.get("kickoffUtc") or ""), str(row.get("matchId") or "")),
    )
    recent_matches = sorted(
        matches,
        key=lambda row: str(row.get("lastUpdatedUtc") or ""),
        reverse=True,
    )[:8]

    return {
        "generatedAtUtc": utc_now_iso(),
        "stateFile": str(state_path),
        "logFile": str(log_path),
        "stateExists": state_path.exists(),
        "logExists": log_path.exists(),
        "lastFetchedAtUtc": state.get("lastFetchedAtUtc") or "",
        "lastHash": state.get("lastHash") or "",
        "knownMatches": len(matches),
        "knownEvents": len(events),
        "matchStatuses": dict(sorted(status_counts.items())),
        "eventTypes": dict(sorted(event_counts.items())),
        "eventSources": dict(sorted(source_counts.items())),
        "destinations": destination_summary(state),
        "currentPollWindows": current_poll_windows(state),
        "nonFinalMatches": non_final[:12],
        "recentUpdatedMatches": recent_matches,
        "lastLiveWindow": last_line_matching(lines, ("Live match window",)),
        "lastRealSync": last_line_matching(lines, ("Running sync for ESPN date",)),
        "lastPost": last_line_matching(lines, ("Posted changed data", "Posting changed data")),
        "lastNoNewData": last_line_matching(lines, ("No new data to post",)),
        "lastSyncComplete": last_line_matching(lines, ("Sync complete",)),
        "recentChanges": recent_change_lines(lines, 12),
        "recentIssues": recent_issue_lines(lines, 12),
    }


def format_match(match: dict[str, Any]) -> str:
    home = match.get("homeTeamId") or "home"
    away = match.get("awayTeamId") or "away"
    score = f"{match.get('homeScore', '')}-{match.get('awayScore', '')}"
    return f"{match.get('matchId')}: {home} vs {away} {score}, status={match.get('status')}, kickoff={match.get('kickoffUtc')}"


def render_text(status: dict[str, Any]) -> str:
    lines = [
        "World Cup sync status",
        f"Generated UTC: {status['generatedAtUtc']}",
        f"State file: {status['stateFile']} ({'present' if status['stateExists'] else 'missing'})",
        f"Log file: {status['logFile']} ({'present' if status['logExists'] else 'missing'})",
        "",
        f"Last fetched UTC: {status['lastFetchedAtUtc'] or 'never'}",
        f"Last real sync command: {status['lastRealSync'] or 'none seen in log'}",
        f"Last posted change: {status['lastPost'] or 'none seen in log'}",
        f"Last no-new-data result: {status['lastNoNewData'] or 'none seen in log'}",
        f"Last sync complete: {status['lastSyncComplete'] or 'none seen in log'}",
        "",
        f"Known matches: {status['knownMatches']} {status['matchStatuses']}",
        f"Known events: {status['knownEvents']} {status['eventTypes']} sources={status['eventSources']}",
    ]

    if status["destinations"]:
        lines.append("")
        lines.append("Destinations:")
        for destination in status["destinations"]:
            lines.append(
                f"- {destination['key']}: lastPostedAtUtc={destination['lastPostedAtUtc'] or 'never'} "
                f"matches={destination['matches']} events={destination['events']}"
            )

    if status["currentPollWindows"]:
        lines.append("")
        lines.append("Current poll windows:")
        lines.extend(f"- {item}" for item in status["currentPollWindows"])

    if status["recentChanges"]:
        lines.append("")
        lines.append("Most recent detected changes:")
        lines.extend(f"- {item}" for item in status["recentChanges"])

    if status["recentIssues"]:
        lines.append("")
        lines.append("Recent issues/mismatches:")
        lines.extend(f"- {item}" for item in status["recentIssues"])

    if status["nonFinalMatches"]:
        lines.append("")
        lines.append("Next non-final matches:")
        lines.extend(f"- {format_match(match)}" for match in status["nonFinalMatches"][:8])

    return "\n".join(lines) + "\n"


def html_list(items: list[str]) -> str:
    if not items:
        return "<p class=\"muted\">None</p>"
    return "<ul>" + "".join(f"<li>{html.escape(item)}</li>" for item in items) + "</ul>"


def render_html(status: dict[str, Any]) -> str:
    destinations = [
        f"{row['key']}: lastPostedAtUtc={row['lastPostedAtUtc'] or 'never'}, matches={row['matches']}, events={row['events']}"
        for row in status["destinations"]
    ]
    non_final = [format_match(match) for match in status["nonFinalMatches"][:10]]
    recent_matches = [format_match(match) for match in status["recentUpdatedMatches"][:8]]
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="60">
  <title>World Cup Sync Status</title>
  <style>
    body {{ font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #171717; background: #f7f7f4; }}
    main {{ max-width: 980px; margin: 0 auto; }}
    h1 {{ margin: 0 0 4px; font-size: 24px; }}
    h2 {{ margin: 0 0 10px; font-size: 15px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }}
    .card {{ background: white; border: 1px solid #deded8; border-radius: 8px; padding: 14px; }}
    .metric {{ font-size: 24px; font-weight: 700; }}
    .muted {{ color: #666; }}
    code {{ background: #f0f0eb; padding: 1px 4px; border-radius: 4px; }}
    ul {{ margin: 0; padding-left: 18px; }}
    li {{ margin: 4px 0; }}
  </style>
</head>
<body>
<main>
  <h1>World Cup Sync Status</h1>
  <p class="muted">Generated {html.escape(status['generatedAtUtc'])}. Auto-refreshes every 60 seconds.</p>
  <section class="grid">
    <div class="card"><h2>Last Fetch</h2><div>{html.escape(status['lastFetchedAtUtc'] or 'never')}</div></div>
    <div class="card"><h2>Matches</h2><div class="metric">{status['knownMatches']}</div><div class="muted">{html.escape(str(status['matchStatuses']))}</div></div>
    <div class="card"><h2>Events</h2><div class="metric">{status['knownEvents']}</div><div class="muted">{html.escape(str(status['eventTypes']))}</div></div>
  </section>
  <section class="grid" style="margin-top:12px">
    <div class="card"><h2>Last Real Sync</h2><p>{html.escape(status['lastRealSync'] or 'none seen in log')}</p></div>
    <div class="card"><h2>Last Posted Change</h2><p>{html.escape(status['lastPost'] or 'none seen in log')}</p></div>
    <div class="card"><h2>Last No-New-Data</h2><p>{html.escape(status['lastNoNewData'] or 'none seen in log')}</p></div>
  </section>
  <section class="grid" style="margin-top:12px">
    <div class="card"><h2>Current Poll Windows</h2>{html_list(status['currentPollWindows'])}</div>
    <div class="card"><h2>Destinations</h2>{html_list(destinations)}</div>
  </section>
  <section class="grid" style="margin-top:12px">
    <div class="card"><h2>Recent Changes</h2>{html_list(status['recentChanges'])}</div>
    <div class="card"><h2>Recent Issues</h2>{html_list(status['recentIssues'])}</div>
  </section>
  <section class="grid" style="margin-top:12px">
    <div class="card"><h2>Next Non-Final Matches</h2>{html_list(non_final)}</div>
    <div class="card"><h2>Recently Updated Matches</h2>{html_list(recent_matches)}</div>
  </section>
  <p class="muted">State: <code>{html.escape(status['stateFile'])}</code><br>Log: <code>{html.escape(status['logFile'])}</code></p>
</main>
</body>
</html>
"""


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Show local World Cup sync status.")
    parser.add_argument("--state-file", default=str(DEFAULT_STATE_FILE))
    parser.add_argument("--log-file", default=str(DEFAULT_LOG_FILE))
    parser.add_argument("--max-log-lines", type=int, default=5000)
    parser.add_argument("--json", action="store_true", help="Print JSON instead of text.")
    parser.add_argument("--html", help="Write an auto-refreshing HTML dashboard to this path.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    status = build_status(
        resolve_project_path(args.state_file),
        resolve_project_path(args.log_file),
        args.max_log_lines,
    )
    if args.html:
        html_path = resolve_project_path(args.html)
        html_path.parent.mkdir(parents=True, exist_ok=True)
        html_path.write_text(render_html(status))
        print(f"Wrote {html_path}")
        return 0
    if args.json:
        print(json.dumps(status, indent=2, sort_keys=True))
    else:
        print(render_text(status), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
