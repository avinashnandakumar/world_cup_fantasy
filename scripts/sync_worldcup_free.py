#!/usr/bin/env python3
"""Sync World Cup match data from free public scoreboards into Apps Script.

The script is built for cron/launchd. It fetches a small free scoreboard,
merges it with locally cached match history, hashes the canonical payload, and
POSTs to Apps Script only when match/event data changed.
"""

from __future__ import annotations

import argparse
import contextlib
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary"
DEFAULT_STATE_FILE = ".worldcup-free-sync-state.json"
DEFAULT_TIMEOUT_SECONDS = 20
DEFAULT_LOCK_STALE_SECONDS = 120

# Edit these three values if you want this file to be fully self-contained.
# Environment variables with the same names still override these defaults.
DEFAULT_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzmuI73ST4DC0NpnVW8_8kHOdl18127DXEX7H6nxZSxq6IOhEjeJr130-DGy7f0pRDpyg/exec"
DEFAULT_APPS_SCRIPT_SYNC_TOKEN = "CLIPPERSGANGORDONTBANG"
DEFAULT_WORLD_CUP_ESPN_DATES = ""


TEAM_ALIASES = {
    "arg": "argentina",
    "argentina": "argentina",
    "bra": "brazil",
    "brazil": "brazil",
    "eng": "england",
    "england": "england",
    "fra": "france",
    "france": "france",
    "esp": "spain",
    "spain": "spain",
    "por": "portugal",
    "portugal": "portugal",
    "ger": "germany",
    "germany": "germany",
    "ned": "netherlands",
    "netherlands": "netherlands",
    "bel": "belgium",
    "belgium": "belgium",
    "col": "colombia",
    "colombia": "colombia",
    "mex": "mexico",
    "mexico": "mexico",
    "usa": "usa",
    "united-states": "usa",
    "united-states-of-america": "usa",
    "us": "usa",
    "jpn": "japan",
    "japan": "japan",
    "mar": "morocco",
    "morocco": "morocco",
    "uru": "uruguay",
    "uruguay": "uruguay",
    "sui": "switzerland",
    "switzerland-sui": "switzerland",
    "switzerland": "switzerland",
    "cro": "croatia",
    "croatia": "croatia",
    "nor": "norway",
    "norway": "norway",
    "ecu": "ecuador",
    "ecuador": "ecuador",
    "sen": "senegal",
    "senegal": "senegal",
    "aut": "austria",
    "austria": "austria",
    "tur": "turkey",
    "turkey": "turkey",
    "turkiye": "turkey",
    "türkiye": "turkey",
    "irn": "iran",
    "iran": "iran",
    "egy": "egypt",
    "egypt": "egypt",
    "kor": "south-korea",
    "south-korea": "south-korea",
    "korea-republic": "south-korea",
    "republic-of-korea": "south-korea",
    "korea": "south-korea",
    "swe": "sweden",
    "sweden": "sweden",
    "alg": "algeria",
    "algeria": "algeria",
    "civ": "ivory-coast",
    "ivory-coast": "ivory-coast",
    "cote-d-ivoire": "ivory-coast",
    "côte-d-ivoire": "ivory-coast",
    "par": "paraguay",
    "paraguay": "paraguay",
    "aus": "australia",
    "australia": "australia",
    "can": "canada",
    "canada": "canada",
    "sco": "scotland",
    "scotland": "scotland",
    "cze": "czech-republic",
    "czech-republic": "czech-republic",
    "czechia": "czech-republic",
    "gha": "ghana",
    "ghana": "ghana",
    "tun": "tunisia",
    "tunisia": "tunisia",
    "rsa": "south-africa",
    "south-africa": "south-africa",
    "ksa": "saudi-arabia",
    "saudi-arabia": "saudi-arabia",
    "qat": "qatar",
    "qatar": "qatar",
    "uzb": "uzbekistan",
    "uzbekistan": "uzbekistan",
    "jor": "jordan",
    "jordan": "jordan",
    "irq": "iraq",
    "iraq": "iraq",
    "cod": "dr-congo",
    "dr-congo": "dr-congo",
    "congo-dr": "dr-congo",
    "congo-d-r": "dr-congo",
    "democratic-republic-of-the-congo": "dr-congo",
    "bih": "bosnia-herzegovina",
    "bosnia-herzegovina": "bosnia-herzegovina",
    "bosnia-and-herzegovina": "bosnia-herzegovina",
    "nzl": "new-zealand",
    "new-zealand": "new-zealand",
    "pan": "panama",
    "panama": "panama",
    "hai": "haiti",
    "haiti": "haiti",
    "cuw": "curacao",
    "curacao": "curacao",
    "curaçao": "curacao",
    "cpv": "cape-verde",
    "cape-verde": "cape-verde",
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today_utc_yyyymmdd() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d")


def slug(value: str) -> str:
    normalized = value.strip().lower().replace("&", "and")
    chars: list[str] = []
    previous_dash = False
    for char in normalized:
        if char.isalnum():
            chars.append(char)
            previous_dash = False
        elif not previous_dash:
            chars.append("-")
            previous_dash = True
    return "".join(chars).strip("-")


def team_id_from_name(name: str) -> str:
    candidate = slug(name)
    if candidate in TEAM_ALIASES:
        return TEAM_ALIASES[candidate]
    raise ValueError(f"No team alias for provider team name: {name!r}")


def team_id_from_object(value: Any) -> str:
    if isinstance(value, str):
        return team_id_from_name(value)
    if not isinstance(value, dict):
        raise ValueError(f"Cannot read team from provider value: {value!r}")
    for key in ("displayName", "name", "shortDisplayName", "location", "abbreviation"):
        if value.get(key):
            try:
                return team_id_from_name(str(value[key]))
            except ValueError:
                continue
    raise ValueError(f"No team alias for provider team object: {value!r}")


def http_json(url: str, params: dict[str, str] | None, timeout: int) -> dict[str, Any]:
    query = f"?{urllib.parse.urlencode(params or {})}" if params else ""
    full_url = f"{url}{query}"
    request = urllib.request.Request(
        full_url,
        headers={"User-Agent": "world-cup-fantasy-local-sync/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="replace")
            try:
                return json.loads(body)
            except json.JSONDecodeError as error:
                raise RuntimeError(f"Non-JSON response from {full_url}: {preview_body(body)}") from error
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} from {url}: {body}") from error


def post_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response_body = response.read().decode("utf-8", errors="replace")
            try:
                return json.loads(response_body)
            except json.JSONDecodeError as error:
                raise RuntimeError(
                    "Non-JSON response from Apps Script. Check the Web App URL, deployment access, "
                    f"and that doPost is deployed. Body preview: {preview_body(response_body)}"
                ) from error
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Apps Script HTTP {error.code}: {body}") from error


def preview_body(body: str, limit: int = 1200) -> str:
    compact = " ".join(str(body or "").split())
    return compact[:limit] if compact else "<empty response>"


def normalize_status(status: dict[str, Any]) -> str:
    type_info = status.get("type") or {}
    name = str(type_info.get("name") or "").upper()
    state = str(type_info.get("state") or "").lower()
    completed = type_info.get("completed") is True
    if completed or name in {"STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FINAL_PEN"}:
        return "final"
    if state == "in" or name in {"STATUS_IN_PROGRESS", "STATUS_HALFTIME"}:
        return "live"
    if "POSTPONED" in name or "CANCELED" in name or "CANCELLED" in name:
        return "postponed"
    return "scheduled"


def normalize_stage(event: dict[str, Any]) -> str:
    text = " ".join(
        str(value or "")
        for value in (
            event.get("season", {}).get("type"),
            event.get("season", {}).get("name"),
            event.get("name"),
            event.get("shortName"),
        )
    ).lower()
    if "round of 32" in text:
        return "round_of_32"
    if "round of 16" in text:
        return "round_of_16"
    if "quarter" in text:
        return "quarterfinal"
    if "semi" in text:
        return "semifinal"
    if "final" in text:
        return "final"
    return "group"


def competitor_team_id(competitor: dict[str, Any]) -> str:
    return team_id_from_object(competitor.get("team") or competitor)


def normalize_espn_event(event: dict[str, Any]) -> dict[str, Any]:
    competition = (event.get("competitions") or [{}])[0]
    competitors = competition.get("competitors") or []
    home = next((item for item in competitors if item.get("homeAway") == "home"), None)
    away = next((item for item in competitors if item.get("homeAway") == "away"), None)
    if not home or not away:
        raise ValueError(f"ESPN event is missing home/away competitors: {event.get('id')}")

    home_id = competitor_team_id(home)
    away_id = competitor_team_id(away)
    winner = ""
    if home.get("winner") is True:
        winner = home_id
    elif away.get("winner") is True:
        winner = away_id

    return {
        "matchId": f"espn-{event.get('id')}",
        "stage": normalize_stage(event),
        "group": "",
        "homeTeamId": home_id,
        "awayTeamId": away_id,
        "homeScore": parse_score(home.get("score")),
        "awayScore": parse_score(away.get("score")),
        "status": normalize_status(competition.get("status") or event.get("status") or {}),
        "winnerTeamId": winner,
        "decidedByPens": bool(competition.get("shootout") or competition.get("penaltyShootout")),
        "kickoffUtc": event.get("date") or competition.get("date") or "",
        "lastUpdatedUtc": utc_now_iso(),
        "manualOverride": False,
        "_providerEventId": str(event.get("id") or ""),
    }


def parse_score(value: Any) -> int | str:
    if value is None or value == "":
        return ""
    try:
        return int(value)
    except (TypeError, ValueError):
        return ""


def event_status_needs_details(match: dict[str, Any]) -> bool:
    return match.get("status") in {"live", "final"}


def contains_red_card_text(value: Any) -> bool:
    text = str(value or "").lower()
    return "red card" in text or "red-card" in text or text == "redcard"


def find_team_near_node(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    candidates = []
    for key in ("team", "club", "competitor"):
        if key in node:
            candidates.append(node[key])
    for key in ("teamName", "displayName", "shortDisplayName", "name", "abbreviation"):
        if key in node:
            candidates.append(node[key])
    for candidate in candidates:
        try:
            return team_id_from_object(candidate)
        except ValueError:
            continue
    return ""


def extract_red_card_events(summary: dict[str, Any], match: dict[str, Any]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    seen: set[str] = set()

    def visit(node: Any, path: str) -> None:
        if isinstance(node, list):
            for index, item in enumerate(node):
                visit(item, f"{path}.{index}")
            return
        if not isinstance(node, dict):
            return

        haystack = " ".join(
            str(node.get(key) or "")
            for key in ("type", "text", "description", "displayValue", "detail", "shortDetail", "cardType")
        )
        if contains_red_card_text(haystack):
            team_id = find_team_near_node(node)
            if team_id:
                clock = node.get("clock")
                minute = node.get("minute") or (clock.get("displayValue") if isinstance(clock, dict) else "")
                event_id = f"{match['matchId']}::red-card::{team_id}::{node.get('id') or path}"
                if event_id not in seen:
                    seen.add(event_id)
                    events.append(
                        {
                            "eventId": event_id,
                            "matchId": match["matchId"],
                            "teamId": team_id,
                            "eventType": "red_card",
                            "minute": minute or "",
                            "count": 1,
                            "notes": "Free scoreboard red card",
                            "source": "espn-free",
                        }
                    )

        for value in node.values():
            if isinstance(value, (dict, list)):
                visit(value, path)

    visit(summary, "summary")
    return events


def fetch_espn_payload(args: argparse.Namespace, previous: dict[str, Any]) -> dict[str, Any]:
    params = {"limit": str(args.limit)}
    if args.dates:
        params["dates"] = args.dates

    scoreboard = http_json(args.scoreboard_url, params, args.timeout_seconds)
    current_matches = []
    current_events = []
    for event in scoreboard.get("events") or []:
        match = normalize_espn_event(event)
        current_matches.append(match)
        if args.fetch_details and event_status_needs_details(match) and match.get("_providerEventId"):
            with contextlib.suppress(Exception):
                summary = http_json(
                    args.summary_url,
                    {"event": str(match["_providerEventId"])},
                    args.timeout_seconds,
                )
                current_events.extend(extract_red_card_events(summary, match))
                if args.detail_sleep_seconds > 0:
                    time.sleep(args.detail_sleep_seconds)

    known_matches = dict(previous.get("knownMatches") or {})
    for match in current_matches:
        cleaned = dict(match)
        cleaned.pop("_providerEventId", None)
        known_matches[cleaned["matchId"]] = cleaned

    known_events = dict(previous.get("knownEvents") or {})
    for event in current_events:
        known_events[event["eventId"]] = event

    return {
        "source": "espn-free",
        "fetchedAtUtc": utc_now_iso(),
        "matches": sorted(known_matches.values(), key=lambda row: (row.get("kickoffUtc") or "", row.get("matchId") or "")),
        "events": sorted(known_events.values(), key=lambda row: (row.get("matchId") or "", row.get("eventId") or "")),
        "_knownMatches": known_matches,
        "_knownEvents": known_events,
        "_currentMatches": len(current_matches),
        "_currentEvents": len(current_events),
    }


def canonical_hash(payload: dict[str, Any]) -> str:
    comparable = {
        "source": payload.get("source"),
        "matches": payload.get("matches") or [],
        "events": payload.get("events") or [],
    }
    encoded = json.dumps(comparable, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")


class SingleRunLock:
    def __init__(self, path: Path, stale_seconds: int) -> None:
        self.path = path
        self.stale_seconds = stale_seconds
        self.acquired = False

    def __enter__(self) -> "SingleRunLock":
        if self.path.exists() and time.time() - self.path.stat().st_mtime > self.stale_seconds:
            self.path.unlink()
        try:
            fd = os.open(str(self.path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            with os.fdopen(fd, "w") as handle:
                handle.write(f"{os.getpid()} {utc_now_iso()}\n")
            self.acquired = True
            return self
        except FileExistsError as exc:
            raise RuntimeError(f"Another sync run is still active: {self.path}") from exc

    def __exit__(self, exc_type: Any, exc: Any, traceback: Any) -> None:
        if self.acquired:
            with contextlib.suppress(FileNotFoundError):
                self.path.unlink()


def config_value(name: str, default: str) -> str:
    value = os.environ.get(name) or default
    if not value:
        raise RuntimeError(f"Missing required config value: {name}")
    if "DEPLOYMENT_ID" in value or value == "same-long-random-secret":
        raise RuntimeError(f"Replace placeholder config value for: {name}")
    return value


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync free World Cup match data into Google Sheets via Apps Script.")
    parser.add_argument("--dates", default=os.environ.get("WORLD_CUP_ESPN_DATES") or DEFAULT_WORLD_CUP_ESPN_DATES or today_utc_yyyymmdd())
    parser.add_argument("--limit", type=int, default=int(os.environ.get("WORLD_CUP_ESPN_LIMIT", "100")))
    parser.add_argument("--state-file", default=os.environ.get("WORLD_CUP_SYNC_STATE_FILE", DEFAULT_STATE_FILE))
    parser.add_argument("--lock-file", default=os.environ.get("WORLD_CUP_SYNC_LOCK_FILE", ".worldcup-free-sync.lock"))
    parser.add_argument("--scoreboard-url", default=os.environ.get("WORLD_CUP_ESPN_SCOREBOARD_URL", ESPN_SCOREBOARD_URL))
    parser.add_argument("--summary-url", default=os.environ.get("WORLD_CUP_ESPN_SUMMARY_URL", ESPN_SUMMARY_URL))
    parser.add_argument("--timeout-seconds", type=int, default=int(os.environ.get("WORLD_CUP_SYNC_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))))
    parser.add_argument("--lock-stale-seconds", type=int, default=int(os.environ.get("WORLD_CUP_SYNC_LOCK_STALE_SECONDS", str(DEFAULT_LOCK_STALE_SECONDS))))
    parser.add_argument("--detail-sleep-seconds", type=float, default=float(os.environ.get("WORLD_CUP_SYNC_DETAIL_SLEEP_SECONDS", "0.2")))
    parser.add_argument("--force", action="store_true", help="POST even when the normalized payload hash did not change.")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and normalize but do not POST.")
    parser.add_argument("--allow-empty-post", action="store_true", help="Allow posting an empty Matches table.")
    parser.add_argument("--no-fetch-details", action="store_false", dest="fetch_details", help="Skip ESPN summary calls for red-card detection.")
    parser.set_defaults(fetch_details=os.environ.get("WORLD_CUP_FETCH_DETAILS", "1") != "0")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    state_path = Path(args.state_file)
    lock_path = Path(args.lock_file)

    with SingleRunLock(lock_path, args.lock_stale_seconds):
        state = load_state(state_path)
        payload = fetch_espn_payload(args, state)
        if not payload["matches"] and not args.allow_empty_post:
            print("No matches found and no cached matches exist. Skipping post.")
            return 0

        payload_hash = canonical_hash(payload)
        if not args.force and state.get("lastHash") == payload_hash:
            print(
                "No data change. "
                f"known_matches={len(payload['matches'])} known_events={len(payload['events'])} "
                f"current_matches={payload['_currentMatches']} hash={payload_hash}"
            )
            return 0

        postable = {
            "source": payload["source"],
            "fetchedAtUtc": payload["fetchedAtUtc"],
            "matches": payload["matches"],
            "events": payload["events"],
        }

        if args.dry_run:
            print(json.dumps({k: v for k, v in postable.items() if k not in {"matches", "events"}}, indent=2))
            print(
                f"Dry run: known_matches={len(payload['matches'])} known_events={len(payload['events'])} "
                f"current_matches={payload['_currentMatches']} current_events={payload['_currentEvents']} "
                f"hash={payload_hash}"
            )
            return 0

        app_script_url = config_value("APPS_SCRIPT_WEBAPP_URL", DEFAULT_APPS_SCRIPT_WEBAPP_URL)
        sync_token = config_value("APPS_SCRIPT_SYNC_TOKEN", DEFAULT_APPS_SCRIPT_SYNC_TOKEN)
        postable["token"] = sync_token
        result = post_json(app_script_url, postable, args.timeout_seconds)
        if not result.get("ok"):
            raise RuntimeError(f"Apps Script rejected sync: {result}")

        save_state(
            state_path,
            {
                "lastHash": payload_hash,
                "lastPostedAtUtc": utc_now_iso(),
                "lastFetchedAtUtc": payload["fetchedAtUtc"],
                "knownMatches": payload["_knownMatches"],
                "knownEvents": payload["_knownEvents"],
                "matches": len(payload["matches"]),
                "events": len(payload["events"]),
                "appsScriptResult": result,
            },
        )
        print(
            f"Posted changed data. known_matches={len(payload['matches'])} known_events={len(payload['events'])} "
            f"current_matches={payload['_currentMatches']} hash={payload_hash}"
        )
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
