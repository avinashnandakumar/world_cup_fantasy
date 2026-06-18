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
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary"
DEFAULT_STATE_FILE = ".worldcup-free-sync-state.json"
DEFAULT_TIMEOUT_SECONDS = 20
DEFAULT_LOCK_STALE_SECONDS = 120

# Edit these values if you want this file to be fully self-contained.
# Environment variables with the same names still override these defaults.
DEFAULT_APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzmuI73ST4DC0NpnVW8_8kHOdl18127DXEX7H6nxZSxq6IOhEjeJr130-DGy7f0pRDpyg/exec"
DEFAULT_APPS_SCRIPT_WEBAPP_URL_2 = "https://script.google.com/macros/s/AKfycbzlaQH0CaUKOO1mVADoKGXaJECF3T-ONOmFwLzayFqy6XxqszUqgvxVkj9TYRYP7PnD/exec"
DEFAULT_APPS_SCRIPT_SYNC_TOKEN = "CLIPPERSGANGORDONTBANG"
DEFAULT_APPS_SCRIPT_SYNC_TOKEN_2 = "CLIPPERSGANGORDONTBANG"
DEFAULT_WORLD_CUP_ESPN_DATES = ""
DEFAULT_WORLD_CUP_GROUP_STAGE_END_DATE = "20260627"
CONFIRMED_RED_CARD_PROVIDER_EVENT_IDS = {"49484043", "49484429", "49484548"}
IGNORED_RED_CARD_PROVIDER_EVENT_IDS = {"49491249"}


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


def local_now_iso() -> str:
    return datetime.now().astimezone().replace(microsecond=0).isoformat()


def today_local_yyyymmdd() -> str:
    return datetime.now().astimezone().strftime("%Y%m%d")


def parse_yyyymmdd(value: str) -> datetime:
    return datetime.strptime(value, "%Y%m%d")


def date_range_yyyymmdd(start: str, end: str) -> list[str]:
    start_date = parse_yyyymmdd(start)
    end_date = parse_yyyymmdd(end)
    if end_date < start_date:
        raise ValueError(f"End date {end} cannot be before start date {start}.")
    dates = []
    current = start_date
    while current <= end_date:
        dates.append(current.strftime("%Y%m%d"))
        current += timedelta(days=1)
    return dates


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
    if is_future_fixture_placeholder(candidate):
        return candidate
    raise ValueError(f"No team alias for provider team name: {name!r}")


def is_future_fixture_placeholder(candidate: str) -> bool:
    return (
        candidate.startswith("group-")
        or candidate.startswith("winner-")
        or candidate.startswith("loser-")
        or candidate.startswith("1")
        or candidate.startswith("2")
        or candidate.startswith("3")
    ) and (
        "place" in candidate
        or "winner" in candidate
        or "runner-up" in candidate
        or "match" in candidate
    )


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


def get_apps_script_endpoint(url: str, endpoint: str, timeout: int) -> Any:
    response = http_json(url, {"endpoint": endpoint}, timeout)
    if isinstance(response, dict) and "payload" in response:
        return response["payload"]
    return response


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
    return bool(re.search(r"\bred[- ]?card\b", text))


def node_text_for_keys(node: dict[str, Any], keys: tuple[str, ...]) -> str:
    return " ".join(str(node.get(key) or "") for key in keys)


def event_type_text(node: dict[str, Any]) -> str:
    values = []
    for key in ("type", "cardType"):
        value = node.get(key)
        if isinstance(value, dict):
            values.extend(str(value.get(inner_key) or "") for inner_key in (
                "name",
                "text",
                "displayName",
                "description",
                "abbreviation",
                "shortName",
            ))
        else:
            values.append(str(value or ""))
    return " ".join(values)


def event_minute_from_node(node: dict[str, Any]) -> str:
    clock = node.get("clock")
    minute = (
        node.get("minute")
        or node.get("time")
        or node.get("displayTime")
        or (clock.get("displayValue") if isinstance(clock, dict) else "")
    )
    return str(minute or "")


def is_red_card_event_node(node: dict[str, Any]) -> bool:
    if not isinstance(node, dict):
        return False

    provider_event_id = str(node.get("id") or node.get("uid") or "")
    if provider_event_id in CONFIRMED_RED_CARD_PROVIDER_EVENT_IDS:
        return True
    if provider_event_id in IGNORED_RED_CARD_PROVIDER_EVENT_IDS:
        return False

    type_text = event_type_text(node)
    has_red_card_type = contains_red_card_text(type_text) or re.search(r"\brc\b", type_text, re.IGNORECASE)
    has_event_time = bool(event_minute_from_node(node))
    has_event_id = bool(node.get("id") or node.get("uid"))

    return bool(has_event_time and has_event_id and has_red_card_type)


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

        provider_event_id = str(node.get("id") or node.get("uid") or "")
        if provider_event_id in IGNORED_RED_CARD_PROVIDER_EVENT_IDS:
            return

        if is_red_card_event_node(node):
            team_id = find_team_near_node(node)
            if team_id:
                minute = event_minute_from_node(node)
                event_id = f"{match['matchId']}::red-card::{team_id}::{provider_event_id or path}"
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
                            "notes": f"Free scoreboard red card; providerEventId={provider_event_id or path}",
                            "source": "espn-free",
                        }
                    )

        for value in node.values():
            if isinstance(value, (dict, list)):
                visit(value, path)

    visit(summary, "summary")
    return events


def fetch_scoreboard_for_date(args: argparse.Namespace, date_value: str) -> list[dict[str, Any]]:
    params = {"limit": str(args.limit)}
    if date_value:
        params["dates"] = date_value

    scoreboard = http_json(args.scoreboard_url, params, args.timeout_seconds)
    return scoreboard.get("events") or []


def fetch_espn_payload(args: argparse.Namespace, previous: dict[str, Any]) -> dict[str, Any]:
    fetch_dates = date_range_yyyymmdd(args.dates, args.tournament_end_date) if args.fetch_all_matches else [args.dates]
    if args.fetch_all_matches:
        print(f"Fetch-all-matches mode: {fetch_dates[0]} through {fetch_dates[-1]} ({len(fetch_dates)} days)")

    current_matches = []
    current_events = []
    seen_provider_events = set()
    for fetch_date in fetch_dates:
        events = fetch_scoreboard_for_date(args, fetch_date)
        if args.fetch_all_matches and events:
            print(f"- {fetch_date}: found {len(events)} match(es)")
        for event in events:
            provider_event_id = str(event.get("id") or "")
            if provider_event_id and provider_event_id in seen_provider_events:
                continue
            seen_provider_events.add(provider_event_id)
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

    known_events = {
        event_id: event
        for event_id, event in dict(previous.get("knownEvents") or {}).items()
        if not ignored_red_card_event(event_id, event)
    }
    for event in current_events:
        if not ignored_red_card_event(event["eventId"], event):
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
        "matches": [comparable_match(row) for row in payload.get("matches") or []],
        "events": payload.get("events") or [],
    }
    encoded = json.dumps(comparable, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def comparable_match(match: dict[str, Any]) -> dict[str, Any]:
    ignored = {"lastUpdatedUtc"}
    return {key: value for key, value in match.items() if key not in ignored}


def comparable_event(event: dict[str, Any]) -> dict[str, Any]:
    return {
        "eventId": str(event.get("eventId") or ""),
        "matchId": str(event.get("matchId") or ""),
        "teamId": str(event.get("teamId") or ""),
        "eventType": str(event.get("eventType") or ""),
        "minute": str(event.get("minute") or ""),
        "count": int(float(event.get("count") or 0)) if str(event.get("count") or "").strip() else 1,
        "notes": str(event.get("notes") or ""),
        "source": str(event.get("source") or ""),
    }


def rows_by_key(rows: list[dict[str, Any]], key: str, comparable_fn: Any) -> dict[str, dict[str, Any]]:
    mapped = {}
    for row in rows or []:
        row_key = str(row.get(key) or "")
        if row_key:
            mapped[row_key] = comparable_fn(row)
    return mapped


def describe_row_mismatches(
    label: str,
    key: str,
    expected_rows: list[dict[str, Any]],
    actual_rows: list[dict[str, Any]],
    comparable_fn: Any,
    include_extra_rows: bool,
    limit: int = 20,
) -> list[str]:
    expected = rows_by_key(expected_rows, key, comparable_fn)
    actual = rows_by_key(actual_rows, key, comparable_fn)
    lines = []

    for row_key in sorted(expected.keys() - actual.keys()):
        lines.append(f"{label} missing in sheet: {row_key}")
    if include_extra_rows:
        for row_key in sorted(actual.keys() - expected.keys()):
            lines.append(f"{label} extra in sheet: {row_key}")
    for row_key in sorted(expected.keys() & actual.keys()):
        if expected[row_key] == actual[row_key]:
            continue
        changed_fields = [
            field for field in sorted(expected[row_key].keys())
            if expected[row_key].get(field) != actual[row_key].get(field)
        ]
        details = ", ".join(
            f"{field}: sheet={actual[row_key].get(field)!r} expected={expected[row_key].get(field)!r}"
            for field in changed_fields
        )
        lines.append(f"{label} changed in sheet: {row_key} | {details}")

    if len(lines) > limit:
        return lines[:limit] + [f"... {len(lines) - limit} more {label.lower()} mismatch(es)"]
    return lines


def verify_destination_against_payload(destination: dict[str, str], payload: dict[str, Any], timeout: int, strict: bool) -> list[str]:
    sheet_matches = get_apps_script_endpoint(destination["url"], "matches", timeout)
    sheet_events = get_apps_script_endpoint(destination["url"], "events", timeout)
    if not isinstance(sheet_matches, list):
        raise RuntimeError(f"Expected matches endpoint to return a list for {destination['name']}.")
    if not isinstance(sheet_events, list):
        raise RuntimeError(f"Expected events endpoint to return a list for {destination['name']}.")

    return (
        describe_row_mismatches("MATCH", "matchId", payload.get("matches") or [], sheet_matches, comparable_match, strict)
        + describe_row_mismatches("EVENT", "eventId", payload.get("events") or [], sheet_events, comparable_event, strict)
    )


def describe_match(match: dict[str, Any]) -> str:
    home = match.get("homeTeamId") or "home"
    away = match.get("awayTeamId") or "away"
    home_score = match.get("homeScore")
    away_score = match.get("awayScore")
    score = f"{home_score}-{away_score}" if home_score != "" or away_score != "" else "no score"
    return f"{match.get('matchId')}: {home} vs {away}, {score}, status={match.get('status')}, kickoffUtc={match.get('kickoffUtc')}"


def describe_event(event: dict[str, Any]) -> str:
    return (
        f"{event.get('eventId')}: match={event.get('matchId')}, team={event.get('teamId')}, "
        f"type={event.get('eventType')}, minute={event.get('minute')}, count={event.get('count')}"
    )


def ignored_red_card_event(event_id: str, event: dict[str, Any]) -> bool:
    if event.get("eventType") != "red_card":
        return False
    event_text = " ".join(str(value or "") for value in (event_id, event.get("notes"), event.get("source")))
    return any(provider_id in event_text for provider_id in IGNORED_RED_CARD_PROVIDER_EVENT_IDS)


def describe_payload_changes(previous: dict[str, Any], payload: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    previous_matches = previous.get("knownMatches") or {}
    previous_events = previous.get("knownEvents") or {}

    for match in payload.get("matches") or []:
        match_id = match.get("matchId")
        previous_match = previous_matches.get(match_id)
        if not previous_match:
            lines.append(f"NEW MATCH: {describe_match(match)}")
            continue
        before = comparable_match(previous_match)
        after = comparable_match(match)
        changed_fields = [key for key in sorted(after.keys()) if before.get(key) != after.get(key)]
        if changed_fields:
            details = ", ".join(f"{key}: {before.get(key)!r} -> {after.get(key)!r}" for key in changed_fields)
            lines.append(f"UPDATED MATCH: {describe_match(match)} | {details}")

    for event in payload.get("events") or []:
        event_id = event.get("eventId")
        previous_event = previous_events.get(event_id)
        if not previous_event:
            lines.append(f"NEW EVENT: {describe_event(event)}")
            continue
        changed_fields = [key for key in sorted(event.keys()) if previous_event.get(key) != event.get(key)]
        if changed_fields:
            details = ", ".join(f"{key}: {previous_event.get(key)!r} -> {event.get(key)!r}" for key in changed_fields)
            lines.append(f"UPDATED EVENT: {describe_event(event)} | {details}")

    return lines


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")


def split_config_list(value: str) -> list[str]:
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def validate_config_value(name: str, value: str) -> str:
    if not value:
        raise RuntimeError(f"Missing required config value: {name}")
    if "DEPLOYMENT_ID" in value or value == "same-long-random-secret":
        raise RuntimeError(f"Replace placeholder config value for: {name}")
    return value


def configured_destinations() -> list[dict[str, str]]:
    env_urls = split_config_list(os.environ.get("APPS_SCRIPT_WEBAPP_URLS", ""))
    urls = env_urls or [
        os.environ.get("APPS_SCRIPT_WEBAPP_URL") or DEFAULT_APPS_SCRIPT_WEBAPP_URL,
        os.environ.get("APPS_SCRIPT_WEBAPP_URL_2") or DEFAULT_APPS_SCRIPT_WEBAPP_URL_2,
    ]
    urls = [url for url in urls if url]

    env_tokens = split_config_list(os.environ.get("APPS_SCRIPT_SYNC_TOKENS", ""))
    tokens = env_tokens or [
        os.environ.get("APPS_SCRIPT_SYNC_TOKEN") or DEFAULT_APPS_SCRIPT_SYNC_TOKEN,
        os.environ.get("APPS_SCRIPT_SYNC_TOKEN_2") or DEFAULT_APPS_SCRIPT_SYNC_TOKEN_2,
    ]

    if not urls:
        raise RuntimeError("At least one Apps Script Web App URL is required.")

    destinations = []
    for index, url in enumerate(urls):
        token = tokens[index] if index < len(tokens) and tokens[index] else tokens[0] if tokens else ""
        validate_config_value(f"APPS_SCRIPT_WEBAPP_URL destination {index + 1}", url)
        validate_config_value(f"APPS_SCRIPT_SYNC_TOKEN destination {index + 1}", token)
        destinations.append({
            "name": f"League {index + 1}",
            "url": url,
            "token": token,
            "key": hashlib.sha256(url.encode("utf-8")).hexdigest()[:16],
        })
    return destinations


def destination_state_map(state: dict[str, Any], destinations: list[dict[str, str]]) -> dict[str, Any]:
    destination_states = dict(state.get("destinations") or {})
    if not destination_states and state.get("lastHash") and destinations:
        destination_states[destinations[0]["key"]] = {
            "lastHash": state.get("lastHash"),
            "lastPostedAtUtc": state.get("lastPostedAtUtc", ""),
            "appsScriptResult": state.get("appsScriptResult", {}),
        }
    return destination_states


def save_sync_state(
    state_path: Path,
    payload: dict[str, Any],
    destinations: dict[str, Any],
    payload_hash: str,
) -> None:
    save_state(
        state_path,
        {
            "lastHash": payload_hash,
            "lastFetchedAtUtc": payload["fetchedAtUtc"],
            "knownMatches": payload["_knownMatches"],
            "knownEvents": payload["_knownEvents"],
            "matches": len(payload["matches"]),
            "events": len(payload["events"]),
            "destinations": destinations,
        },
    )


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


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync free World Cup match data into Google Sheets via Apps Script.")
    parser.add_argument("--dates", default=os.environ.get("WORLD_CUP_ESPN_DATES") or DEFAULT_WORLD_CUP_ESPN_DATES or today_local_yyyymmdd())
    parser.add_argument("--fetch-all-matches", action="store_true", help="Fetch every scoreboard date from --dates through --tournament-end-date.")
    parser.add_argument("--tournament-end-date", default=os.environ.get("WORLD_CUP_TOURNAMENT_END_DATE", DEFAULT_WORLD_CUP_GROUP_STAGE_END_DATE), help="YYYYMMDD end date used with --fetch-all-matches. Defaults to the group stage end date.")
    parser.add_argument("--limit", type=int, default=int(os.environ.get("WORLD_CUP_ESPN_LIMIT", "100")))
    parser.add_argument("--state-file", default=os.environ.get("WORLD_CUP_SYNC_STATE_FILE", DEFAULT_STATE_FILE))
    parser.add_argument("--lock-file", default=os.environ.get("WORLD_CUP_SYNC_LOCK_FILE", ".worldcup-free-sync.lock"))
    parser.add_argument("--scoreboard-url", default=os.environ.get("WORLD_CUP_ESPN_SCOREBOARD_URL", ESPN_SCOREBOARD_URL))
    parser.add_argument("--summary-url", default=os.environ.get("WORLD_CUP_ESPN_SUMMARY_URL", ESPN_SUMMARY_URL))
    parser.add_argument("--timeout-seconds", type=int, default=int(os.environ.get("WORLD_CUP_SYNC_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))))
    parser.add_argument("--lock-stale-seconds", type=int, default=int(os.environ.get("WORLD_CUP_SYNC_LOCK_STALE_SECONDS", str(DEFAULT_LOCK_STALE_SECONDS))))
    parser.add_argument("--detail-sleep-seconds", type=float, default=float(os.environ.get("WORLD_CUP_SYNC_DETAIL_SLEEP_SECONDS", "0.2")))
    parser.add_argument("--force", action="store_true", help="POST even when the normalized payload hash did not change.")
    parser.add_argument("--verify-sheets", action="store_true", help="Fetch each Apps Script sheet backend and compare Matches/MatchEvents against the normalized payload.")
    parser.add_argument("--strict-verify-sheets", action="store_true", help="When verifying sheets, also flag rows that exist in sheets but not in the normalized payload.")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and normalize but do not POST.")
    parser.add_argument("--allow-empty-post", action="store_true", help="Allow posting an empty Matches table.")
    parser.add_argument("--fetch-details", action="store_true", dest="fetch_details", help="Fetch ESPN summary detail data for experimental red-card detection.")
    parser.add_argument("--no-fetch-details", action="store_false", dest="fetch_details", help="Skip ESPN summary calls for red-card detection.")
    parser.set_defaults(fetch_details=os.environ.get("WORLD_CUP_FETCH_DETAILS", "1") != "0")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    state_path = Path(args.state_file)
    lock_path = Path(args.lock_file)

    with SingleRunLock(lock_path, args.lock_stale_seconds):
        state = load_state(state_path)
        if args.fetch_all_matches:
            print(f"Fetch date range for ESPN scoreboard: {args.dates} through {args.tournament_end_date}")
        else:
            print(f"Fetch date for ESPN scoreboard: {args.dates}")
        print(f"Local now: {local_now_iso()}")
        print(f"UTC now: {utc_now_iso()}")
        payload = fetch_espn_payload(args, state)
        if not payload["matches"] and not args.allow_empty_post:
            print("No matches found and no cached matches exist. Skipping post.")
            return 0

        payload_hash = canonical_hash(payload)
        changes = describe_payload_changes(state, payload)
        destinations = configured_destinations()
        destination_states = destination_state_map(state, destinations)
        sheet_mismatches: dict[str, list[str]] = {}
        mismatch_destination_keys: set[str] = set()

        if args.verify_sheets:
            print("Verifying Google Sheets backends against normalized payload...")
            for destination in destinations:
                try:
                    mismatches = verify_destination_against_payload(destination, payload, args.timeout_seconds, args.strict_verify_sheets)
                except Exception as exc:
                    print(f"- {destination['name']}: verification skipped ({exc})")
                    continue
                sheet_mismatches[destination["key"]] = mismatches
                if mismatches:
                    mismatch_destination_keys.add(destination["key"])
                    print(f"- {destination['name']}: {len(mismatches)} mismatch(es)")
                    for line in mismatches:
                        print(f"  - {line}")
                else:
                    print(f"- {destination['name']}: sheet data matches payload")

        pending_destinations = [
            destination for destination in destinations
            if (
                args.force
                or destination["key"] in mismatch_destination_keys
                or (destination_states.get(destination["key"]) or {}).get("lastHash") != payload_hash
            )
        ]

        print(f"Configured destinations: {len(destinations)}")
        for destination in destinations:
            action = "will post" if destination in pending_destinations else "no new data"
            print(f"- {destination['name']}: {action} ({destination['key']})")

        if not pending_destinations:
            print(
                "No new data to post for any destination. "
                f"known_matches={len(payload['matches'])} known_events={len(payload['events'])} "
                f"current_matches={payload['_currentMatches']} hash={payload_hash}"
            )
            return 0

        if changes:
            print("New/changed data detected:")
            for line in changes:
                print(f"- {line}")
        elif mismatch_destination_keys:
            print("No ESPN/local payload field changes detected, but sheet mismatches require posting.")
        elif args.force:
            print("No substantive match/event changes detected, but --force will post the current payload.")
        else:
            print("Hash changed, but no field-level changes were detected.")

        postable = {
            "source": payload["source"],
            "fetchedAtUtc": payload["fetchedAtUtc"],
            "redCardScrapingEnabled": args.fetch_details,
            "matches": payload["matches"],
            "events": payload["events"],
        }

        if args.dry_run:
            print(json.dumps({k: v for k, v in postable.items() if k not in {"matches", "events"}}, indent=2))
            print(
                f"Dry run: would post to {len(pending_destinations)} destination(s). "
                f"known_matches={len(payload['matches'])} known_events={len(payload['events'])} "
                f"current_matches={payload['_currentMatches']} current_events={payload['_currentEvents']} "
                f"sheet_mismatch_destinations={len(mismatch_destination_keys)} hash={payload_hash}"
            )
            return 0

        posted = 0
        for destination in pending_destinations:
            destination_payload = dict(postable)
            destination_payload["token"] = destination["token"]
            print(f"Posting changed data to {destination['name']} ({destination['key']})...")
            result = post_json(destination["url"], destination_payload, args.timeout_seconds)
            if not result.get("ok"):
                save_sync_state(state_path, payload, destination_states, payload_hash)
                raise RuntimeError(f"Apps Script rejected sync for {destination['name']}: {result}")

            destination_states[destination["key"]] = {
                "lastHash": payload_hash,
                "lastPostedAtUtc": utc_now_iso(),
                "matches": len(payload["matches"]),
                "events": len(payload["events"]),
                "appsScriptResult": result,
            }
            save_sync_state(state_path, payload, destination_states, payload_hash)
            posted += 1
            print(
                f"Posted changed data to {destination['name']}. "
                f"syncVersion={result.get('syncVersion')} "
                f"apps_script_matches={result.get('matches')} apps_script_events={result.get('events')} "
                f"ledgerRows={result.get('ledgerRows')} standingsRows={result.get('standingsRows')}"
            )

        print(
            f"Sync complete. posted_destinations={posted} skipped_destinations={len(destinations) - posted} "
            f"known_matches={len(payload['matches'])} known_events={len(payload['events'])} "
            f"current_matches={payload['_currentMatches']} hash={payload_hash}"
        )
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
