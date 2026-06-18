#!/usr/bin/env python3
"""Post a prepared Roast Bot appendRoastBatch payload to Apps Script."""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROAST_BOT_TOKEN = "ROASTTOASTROAST"
DEFAULT_CONFIG_FILE = "config.js"


def load_snapshot_url(config_file: Path) -> str:
    source = config_file.read_text()
    match = re.search(r"snapshotUrl\s*:\s*([\"'])(.*?)\1", source)
    if not match:
        raise RuntimeError(f"No snapshotUrl string found in {config_file}")
    url = match.group(2).strip()
    if not url:
        raise RuntimeError(f"snapshotUrl is empty in {config_file}")
    return url


def with_endpoint(url: str, endpoint: str) -> str:
    parts = urllib.parse.urlsplit(url)
    query = dict(urllib.parse.parse_qsl(parts.query, keep_blank_values=True))
    query["endpoint"] = endpoint
    return urllib.parse.urlunsplit((
        parts.scheme,
        parts.netloc,
        parts.path,
        urllib.parse.urlencode(query),
        parts.fragment,
    ))


def fetch_json(url: str, timeout_seconds: int) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GET {url} failed with HTTP {error.code}: {body}") from error


def post_json(url: str, payload: dict[str, Any], timeout_seconds: int) -> dict[str, Any]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"POST {url} failed with HTTP {error.code}: {body}") from error


def validate_payload(payload: dict[str, Any]) -> None:
    if payload.get("action") != "appendRoastBatch":
        raise RuntimeError("Payload action must be appendRoastBatch.")
    if not str(payload.get("batchId") or "").strip():
        raise RuntimeError("Payload must include batchId.")
    roasts = payload.get("roasts")
    if not isinstance(roasts, list) or not 1 <= len(roasts) <= 3:
        raise RuntimeError("Payload must include 1 to 3 roasts.")
    for index, roast in enumerate(roasts, start=1):
        if not isinstance(roast, dict):
            raise RuntimeError(f"Roast {index} must be an object.")
        if not str(roast.get("text") or "").strip():
            raise RuntimeError(f"Roast {index} must include non-empty text.")
        if not str(roast.get("evidence") or "").strip():
            raise RuntimeError(f"Roast {index} must include non-empty evidence.")


def batch_is_visible(roasts_payload: dict[str, Any], batch_id: str) -> bool:
    rows = list(roasts_payload.get("latestBatch") or []) + list(roasts_payload.get("todayArchive") or [])
    return any(str(row.get("batchId") or "") == batch_id for row in rows if isinstance(row, dict))


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Post a prepared Roast Bot batch to the Apps Script API.")
    parser.add_argument("payload_file", help="Path to an appendRoastBatch JSON payload.")
    parser.add_argument("--config-file", default=DEFAULT_CONFIG_FILE, help="Path to config.js with snapshotUrl.")
    parser.add_argument("--url", default="", help="Override Apps Script Web App URL.")
    parser.add_argument("--timeout-seconds", type=int, default=30)
    parser.add_argument("--dry-run", action="store_true", help="Validate and print payload without posting.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    payload_path = Path(args.payload_file)
    payload = json.loads(payload_path.read_text())
    validate_payload(payload)
    payload["token"] = ROAST_BOT_TOKEN

    url = args.url or load_snapshot_url(Path(args.config_file))
    roasts_url = with_endpoint(url, "roasts")
    batch_id = str(payload["batchId"])

    if args.dry_run:
        print(json.dumps(payload, indent=2))
        print(f"Dry run: would post batchId={batch_id} to {url}")
        return 0

    before = fetch_json(roasts_url, args.timeout_seconds)
    if batch_is_visible(before, batch_id):
        raise RuntimeError(f"Batch already exists before POST: {batch_id}")

    result = post_json(url, payload, args.timeout_seconds)
    if result.get("ok") is not True:
        raise RuntimeError(f"Apps Script rejected roast batch: {result}")

    after = fetch_json(roasts_url, args.timeout_seconds)
    if not batch_is_visible(after, batch_id):
        raise RuntimeError(f"POST returned ok but batch is not visible in endpoint=roasts: {batch_id}")

    print(
        "Posted roast batch "
        f"batchId={batch_id} roasts={len(payload['roasts'])} "
        f"receivedAtUtc={result.get('receivedAtUtc', '')}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
