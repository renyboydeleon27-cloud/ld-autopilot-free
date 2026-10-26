"""Verify LDB storyboard approvals without APIs, credentials or paid services.

Usage:
  python scripts/verify_ldb_approval.py storyboard.json LDB_STORYBOARD_APPROVAL.json
Exit 0 only if approval matches the exact original storyboard bytes.
"""
import hashlib
import json
import sys
from pathlib import Path

EXPECTED = ["HOOK", *[f"P{i}" for i in range(1, 15)], "ENDING", "THUMBNAIL"]

def normalize(value):
    return "".join(c for c in str(value).upper() if c.isalnum())

def scene_map(data):
    items = data.get("scenes", data.get("panels", data.get("storyboard", {})))
    out = {}
    if isinstance(items, dict):
        for key, value in items.items():
            match = next((s for s in EXPECTED if normalize(s) == normalize(key)), None)
            if match:
                out[match] = value
    elif isinstance(items, list):
        for i, value in enumerate(items):
            if not isinstance(value, dict):
                continue
            label = normalize(value.get("id") or value.get("panel") or value.get("scene") or value.get("label") or "")
            match = next((s for s in EXPECTED if normalize(s) == label), None)
            if match is None and len(items) == 17:
                match = EXPECTED[i]
            if match:
                out[match] = value
    return out

def verify(storyboard: Path, approval: Path):
    raw = storyboard.read_bytes()
    # Browser File.text() normalizes decoding; require plain UTF-8 for matching.
    decoded = raw.decode("utf-8")
    data = json.loads(decoded)
    approval_data = json.loads(approval.read_text(encoding="utf-8"))
    if approval_data.get("schema") != "ldb-storyboard-approval-v1":
        raise ValueError("Invalid approval schema")
    if approval_data.get("hash_algorithm") != "sha256-utf8-original-json":
        raise ValueError("Unsupported approval hash algorithm")
    expected_hash = hashlib.sha256(decoded.encode("utf-8")).hexdigest()
    if approval_data.get("storyboard_id") != expected_hash:
        raise ValueError("Storyboard approval hash mismatch")
    if set(scene_map(data)) != set(EXPECTED):
        raise ValueError("Storyboard must contain all 17 scenes")
    if approval_data.get("approved_scene_count") != 17:
        raise ValueError("Invalid approved scene count")
    if approval_data.get("requires_backend_verification") is not True:
        raise ValueError("Missing backend verification flag")
    return expected_hash

if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("Usage: verify_ldb_approval.py storyboard.json approval.json")
        print("APPROVED", verify(Path(sys.argv[1]), Path(sys.argv[2])))
    except (OSError, ValueError, UnicodeError, json.JSONDecodeError) as exc:
        print("BLOCKED", str(exc), file=sys.stderr)
        sys.exit(1)
