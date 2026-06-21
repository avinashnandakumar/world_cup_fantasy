#!/usr/bin/env python3
"""Run the World Cup free sync only during embedded match windows.

Install this script in cron/launchd at a one-minute interval. It keeps cron
simple while avoiding scoreboard/API polling outside match windows.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from zoneinfo import ZoneInfo


REPO_ROOT = Path(__file__).resolve().parents[1]
SYNC_SCRIPT = REPO_ROOT / "scripts" / "sync_worldcup_free.py"
DEFAULT_GROUP_LIVE_MINUTES = 150
DEFAULT_KNOCKOUT_LIVE_MINUTES = 240
DEFAULT_MAX_POLL_MINUTES = 720
ESPN_SCOREBOARD_TZ = ZoneInfo("America/New_York")


@dataclass(frozen=True)
class MatchWindow:
    provider_id: str
    stage: str
    kickoff_utc: datetime
    home: str
    away: str

    @property
    def label(self) -> str:
        return f"{self.home} vs {self.away}"

    @property
    def match_id(self) -> str:
        return f"espn-{self.provider_id}"


SCHEDULE_ROWS = [
    ("760415", "GROUP", "2026-06-11T19:00:00Z", "Mexico", "South Africa"),
    ("760414", "GROUP", "2026-06-12T02:00:00Z", "South Korea", "Czechia"),
    ("760416", "GROUP", "2026-06-12T19:00:00Z", "Canada", "Bosnia-Herzegovina"),
    ("760417", "GROUP", "2026-06-13T01:00:00Z", "United States", "Paraguay"),
    ("760420", "GROUP", "2026-06-13T19:00:00Z", "Qatar", "Switzerland"),
    ("760419", "GROUP", "2026-06-13T22:00:00Z", "Brazil", "Morocco"),
    ("760418", "GROUP", "2026-06-14T01:00:00Z", "Haiti", "Scotland"),
    ("760421", "GROUP", "2026-06-14T04:00:00Z", "Australia", "Turkey"),
    ("760422", "GROUP", "2026-06-14T17:00:00Z", "Germany", "Curacao"),
    ("760425", "GROUP", "2026-06-14T20:00:00Z", "Netherlands", "Japan"),
    ("760423", "GROUP", "2026-06-14T23:00:00Z", "Ivory Coast", "Ecuador"),
    ("760424", "GROUP", "2026-06-15T02:00:00Z", "Sweden", "Tunisia"),
    ("760428", "GROUP", "2026-06-15T16:00:00Z", "Spain", "Cape Verde"),
    ("760426", "GROUP", "2026-06-15T19:00:00Z", "Belgium", "Egypt"),
    ("760429", "GROUP", "2026-06-15T22:00:00Z", "Saudi Arabia", "Uruguay"),
    ("760427", "GROUP", "2026-06-16T01:00:00Z", "Iran", "New Zealand"),
    ("760432", "GROUP", "2026-06-16T19:00:00Z", "France", "Senegal"),
    ("760430", "GROUP", "2026-06-16T22:00:00Z", "Iraq", "Norway"),
    ("760433", "GROUP", "2026-06-17T01:00:00Z", "Argentina", "Algeria"),
    ("760431", "GROUP", "2026-06-17T04:00:00Z", "Austria", "Jordan"),
    ("760435", "GROUP", "2026-06-17T17:00:00Z", "Portugal", "Congo DR"),
    ("760437", "GROUP", "2026-06-17T20:00:00Z", "England", "Croatia"),
    ("760434", "GROUP", "2026-06-17T23:00:00Z", "Ghana", "Panama"),
    ("760436", "GROUP", "2026-06-18T02:00:00Z", "Uzbekistan", "Colombia"),
    ("760438", "GROUP", "2026-06-18T16:00:00Z", "Czechia", "South Africa"),
    ("760439", "GROUP", "2026-06-18T19:00:00Z", "Switzerland", "Bosnia-Herzegovina"),
    ("760440", "GROUP", "2026-06-18T22:00:00Z", "Canada", "Qatar"),
    ("760441", "GROUP", "2026-06-19T01:00:00Z", "Mexico", "South Korea"),
    ("760442", "GROUP", "2026-06-19T19:00:00Z", "United States", "Australia"),
    ("760445", "GROUP", "2026-06-19T22:00:00Z", "Scotland", "Morocco"),
    ("760444", "GROUP", "2026-06-20T00:30:00Z", "Brazil", "Haiti"),
    ("760443", "GROUP", "2026-06-20T03:00:00Z", "Turkey", "Paraguay"),
    ("760447", "GROUP", "2026-06-20T17:00:00Z", "Netherlands", "Sweden"),
    ("760448", "GROUP", "2026-06-20T20:00:00Z", "Germany", "Ivory Coast"),
    ("760446", "GROUP", "2026-06-21T00:00:00Z", "Ecuador", "Curacao"),
    ("760449", "GROUP", "2026-06-21T04:00:00Z", "Tunisia", "Japan"),
    ("760453", "GROUP", "2026-06-21T16:00:00Z", "Spain", "Saudi Arabia"),
    ("760451", "GROUP", "2026-06-21T19:00:00Z", "Belgium", "Iran"),
    ("760450", "GROUP", "2026-06-21T22:00:00Z", "Uruguay", "Cape Verde"),
    ("760452", "GROUP", "2026-06-22T01:00:00Z", "New Zealand", "Egypt"),
    ("760456", "GROUP", "2026-06-22T17:00:00Z", "Argentina", "Austria"),
    ("760457", "GROUP", "2026-06-22T21:00:00Z", "France", "Iraq"),
    ("760454", "GROUP", "2026-06-23T00:00:00Z", "Norway", "Senegal"),
    ("760455", "GROUP", "2026-06-23T03:00:00Z", "Jordan", "Algeria"),
    ("760461", "GROUP", "2026-06-23T17:00:00Z", "Portugal", "Uzbekistan"),
    ("760458", "GROUP", "2026-06-23T20:00:00Z", "England", "Ghana"),
    ("760460", "GROUP", "2026-06-23T23:00:00Z", "Panama", "Croatia"),
    ("760459", "GROUP", "2026-06-24T02:00:00Z", "Colombia", "Congo DR"),
    ("760462", "GROUP", "2026-06-24T19:00:00Z", "Bosnia-Herzegovina", "Qatar"),
    ("760463", "GROUP", "2026-06-24T19:00:00Z", "Switzerland", "Canada"),
    ("760464", "GROUP", "2026-06-24T22:00:00Z", "Morocco", "Haiti"),
    ("760465", "GROUP", "2026-06-24T22:00:00Z", "Scotland", "Brazil"),
    ("760467", "GROUP", "2026-06-25T01:00:00Z", "Czechia", "Mexico"),
    ("760466", "GROUP", "2026-06-25T01:00:00Z", "South Africa", "South Korea"),
    ("760473", "GROUP", "2026-06-25T20:00:00Z", "Curacao", "Ivory Coast"),
    ("760468", "GROUP", "2026-06-25T20:00:00Z", "Ecuador", "Germany"),
    ("760471", "GROUP", "2026-06-25T23:00:00Z", "Japan", "Sweden"),
    ("760472", "GROUP", "2026-06-25T23:00:00Z", "Tunisia", "Netherlands"),
    ("760469", "GROUP", "2026-06-26T02:00:00Z", "Paraguay", "Australia"),
    ("760470", "GROUP", "2026-06-26T02:00:00Z", "Turkey", "United States"),
    ("760475", "GROUP", "2026-06-26T19:00:00Z", "Norway", "France"),
    ("760474", "GROUP", "2026-06-26T19:00:00Z", "Senegal", "Iraq"),
    ("760478", "GROUP", "2026-06-27T00:00:00Z", "Cape Verde", "Saudi Arabia"),
    ("760479", "GROUP", "2026-06-27T00:00:00Z", "Uruguay", "Spain"),
    ("760476", "GROUP", "2026-06-27T03:00:00Z", "Egypt", "Iran"),
    ("760477", "GROUP", "2026-06-27T03:00:00Z", "New Zealand", "Belgium"),
    ("760480", "GROUP", "2026-06-27T21:00:00Z", "Croatia", "Ghana"),
    ("760485", "GROUP", "2026-06-27T21:00:00Z", "Panama", "England"),
    ("760481", "GROUP", "2026-06-27T23:30:00Z", "Colombia", "Portugal"),
    ("760482", "GROUP", "2026-06-27T23:30:00Z", "Congo DR", "Uzbekistan"),
    ("760484", "GROUP", "2026-06-28T02:00:00Z", "Algeria", "Austria"),
    ("760483", "GROUP", "2026-06-28T02:00:00Z", "Jordan", "Argentina"),
    ("760486", "KNOCKOUT", "2026-06-28T19:00:00Z", "Group A 2nd Place", "Group B 2nd Place"),
    ("760487", "KNOCKOUT", "2026-06-29T17:00:00Z", "Group C Winner", "Group F 2nd Place"),
    ("760489", "KNOCKOUT", "2026-06-29T20:30:00Z", "Group E Winner", "Third Place Group A/B/C/D/F"),
    ("760488", "KNOCKOUT", "2026-06-30T01:00:00Z", "Group F Winner", "Group C 2nd Place"),
    ("760490", "KNOCKOUT", "2026-06-30T17:00:00Z", "Group E 2nd Place", "Group I 2nd Place"),
    ("760492", "KNOCKOUT", "2026-06-30T21:00:00Z", "Group I Winner", "Third Place Group C/D/F/G/H"),
    ("760491", "KNOCKOUT", "2026-07-01T01:00:00Z", "Group A Winner", "Third Place Group C/E/F/H/I"),
    ("760495", "KNOCKOUT", "2026-07-01T16:00:00Z", "Group L Winner", "Third Place Group E/H/I/J/K"),
    ("760493", "KNOCKOUT", "2026-07-01T20:00:00Z", "Group G Winner", "Third Place Group A/E/H/I/J"),
    ("760494", "KNOCKOUT", "2026-07-02T00:00:00Z", "Group D Winner", "Third Place Group B/E/F/I/J"),
    ("760497", "KNOCKOUT", "2026-07-02T19:00:00Z", "Group H Winner", "Group J 2nd Place"),
    ("760496", "KNOCKOUT", "2026-07-02T23:00:00Z", "Group K 2nd Place", "Group L 2nd Place"),
    ("760498", "KNOCKOUT", "2026-07-03T03:00:00Z", "Group B Winner", "Third Place Group E/F/G/I/J"),
    ("760499", "KNOCKOUT", "2026-07-03T18:00:00Z", "Group D 2nd Place", "Group G 2nd Place"),
    ("760500", "KNOCKOUT", "2026-07-03T22:00:00Z", "Group J Winner", "Group H 2nd Place"),
    ("760501", "KNOCKOUT", "2026-07-04T01:30:00Z", "Group K Winner", "Third Place Group D/E/I/J/L"),
    ("760502", "KNOCKOUT", "2026-07-04T17:00:00Z", "Round of 32 1 Winner", "Round of 32 3 Winner"),
    ("760503", "KNOCKOUT", "2026-07-04T21:00:00Z", "Round of 32 2 Winner", "Round of 32 5 Winner"),
    ("760504", "KNOCKOUT", "2026-07-05T20:00:00Z", "Round of 32 4 Winner", "Round of 32 6 Winner"),
    ("760505", "KNOCKOUT", "2026-07-06T00:00:00Z", "Round of 32 7 Winner", "Round of 32 8 Winner"),
    ("760506", "KNOCKOUT", "2026-07-06T19:00:00Z", "Round of 32 11 Winner", "Round of 32 12 Winner"),
    ("760507", "KNOCKOUT", "2026-07-07T00:00:00Z", "Round of 32 9 Winner", "Round of 32 10 Winner"),
    ("760509", "KNOCKOUT", "2026-07-07T16:00:00Z", "Round of 32 14 Winner", "Round of 32 16 Winner"),
    ("760508", "KNOCKOUT", "2026-07-07T20:00:00Z", "Round of 32 13 Winner", "Round of 32 15 Winner"),
    ("760510", "KNOCKOUT", "2026-07-09T20:00:00Z", "Round of 16 1 Winner", "Round of 16 2 Winner"),
    ("760511", "KNOCKOUT", "2026-07-10T19:00:00Z", "Round of 16 5 Winner", "Round of 16 6 Winner"),
    ("760512", "KNOCKOUT", "2026-07-11T21:00:00Z", "Round of 16 3 Winner", "Round of 16 4 Winner"),
    ("760513", "KNOCKOUT", "2026-07-12T01:00:00Z", "Round of 16 7 Winner", "Round of 16 8 Winner"),
    ("760514", "KNOCKOUT", "2026-07-14T19:00:00Z", "Quarterfinal 1 Winner", "Quarterfinal 2 Winner"),
    ("760515", "KNOCKOUT", "2026-07-15T19:00:00Z", "Quarterfinal 3 Winner", "Quarterfinal 4 Winner"),
    ("760516", "KNOCKOUT", "2026-07-18T21:00:00Z", "Semifinal 1 Loser", "Semifinal 2 Loser"),
    ("760517", "FINAL", "2026-07-19T19:00:00Z", "Semifinal 1 Winner", "Semifinal 2 Winner"),
]


def parse_utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


MATCH_SCHEDULE = [
    MatchWindow(provider_id, stage, parse_utc(kickoff), home, away)
    for provider_id, stage, kickoff, home, away in SCHEDULE_ROWS
]


def parse_now(value: Optional[str]) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def live_duration(match: MatchWindow, group_minutes: int, knockout_minutes: int) -> timedelta:
    if match.stage == "GROUP":
        return timedelta(minutes=group_minutes)
    return timedelta(minutes=knockout_minutes)


def load_synced_statuses(state_path: Path) -> dict[str, str]:
    try:
        with state_path.open() as handle:
            state = json.load(handle)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Could not parse sync state file: {state_path}") from exc

    known_matches = state.get("knownMatches") or {}
    statuses = {}
    for match_id, match in known_matches.items():
        if isinstance(match, dict):
            statuses[str(match_id)] = str(match.get("status") or "")
    return statuses


def match_status(
    match: MatchWindow,
    now: datetime,
    synced_statuses: dict[str, str],
    group_minutes: int = DEFAULT_GROUP_LIVE_MINUTES,
    knockout_minutes: int = DEFAULT_KNOCKOUT_LIVE_MINUTES,
    max_poll_minutes: int = DEFAULT_MAX_POLL_MINUTES,
) -> str:
    if now < match.kickoff_utc:
        return "scheduled"

    synced_status = synced_statuses.get(match.match_id)
    if synced_status in {"final", "postponed"}:
        return synced_status

    elapsed = now - match.kickoff_utc
    expected_duration = live_duration(match, group_minutes, knockout_minutes)
    max_poll_duration = timedelta.max if max_poll_minutes <= 0 else timedelta(minutes=max_poll_minutes)
    if elapsed > max_poll_duration:
        return "stale-nonfinal"
    if elapsed < expected_duration:
        return "live"
    return "waiting-final"


def active_matches(
    now: datetime,
    synced_statuses: dict[str, str],
    group_minutes: int,
    knockout_minutes: int,
    max_poll_minutes: int,
) -> list[tuple[MatchWindow, str]]:
    return [
        (match, status)
        for match in MATCH_SCHEDULE
        if (status := match_status(match, now, synced_statuses, group_minutes, knockout_minutes, max_poll_minutes))
        in {"live", "waiting-final"}
    ]


def espn_date_for_match(match: MatchWindow) -> str:
    return match.kickoff_utc.astimezone(ESPN_SCOREBOARD_TZ).strftime("%Y%m%d")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Gate World Cup sync runs to live match windows.")
    parser.add_argument("--now", help="Override current time for testing, for example 2026-06-18T19:15:00Z.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would run without invoking the sync script.")
    parser.add_argument("--quiet", action="store_true", help="Suppress skip messages when no match is active.")
    parser.add_argument("--group-live-minutes", type=int, default=DEFAULT_GROUP_LIVE_MINUTES)
    parser.add_argument("--knockout-live-minutes", type=int, default=DEFAULT_KNOCKOUT_LIVE_MINUTES)
    parser.add_argument("--max-poll-minutes", type=int, default=DEFAULT_MAX_POLL_MINUTES, help="Stop polling a non-final match after this many minutes. Use 0 to poll indefinitely.")
    parser.add_argument("--state-file", default=".worldcup-free-sync-state.json", help="Sync state file used to detect final match status.")
    parser.add_argument(
        "--sync-arg",
        action="append",
        default=[],
        help="Extra argument passed to sync_worldcup_free.py. Repeat for multiple args.",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    now = parse_now(args.now)
    state_path = Path(args.state_file)
    if not state_path.is_absolute():
        state_path = REPO_ROOT / state_path
    synced_statuses = load_synced_statuses(state_path)
    active = active_matches(
        now,
        synced_statuses,
        args.group_live_minutes,
        args.knockout_live_minutes,
        args.max_poll_minutes,
    )

    if not active:
        if not args.quiet:
            print(f"No live match window at {now.isoformat()}. Sync skipped.")
        return 0

    labels = ", ".join(f"{match.label} ({status})" for match, status in active)
    espn_dates = sorted({espn_date_for_match(match) for match, _status in active})
    print(f"Live match window at {now.isoformat()}: {labels}")

    for espn_date in espn_dates:
        command = [sys.executable, str(SYNC_SCRIPT), "--dates", espn_date, *args.sync_arg]
        print(f"Running sync for ESPN date {espn_date}: {' '.join(command)}")
        if args.dry_run:
            continue
        result = subprocess.run(command, cwd=REPO_ROOT)
        if result.returncode != 0:
            return result.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
