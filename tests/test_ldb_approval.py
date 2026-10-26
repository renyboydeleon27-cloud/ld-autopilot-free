"""Offline unit tests for the exact storyboard approval gate."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from scripts.verify_ldb_approval import verify

SCENES = ["HOOK", *[f"P{i}" for i in range(1, 15)], "ENDING", "THUMBNAIL"]

class ApprovalTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.storyboard = self.root / "storyboard.json"
        self.approval = self.root / "approval.json"
        self.storyboard.write_text(json.dumps({"scenes": {s: {"visual": s} for s in SCENES}}), encoding="utf-8")
        self.write_approval()

    def write_approval(self):
        self.approval.write_text(json.dumps({
            "schema": "ldb-storyboard-approval-v1",
            "hash_algorithm": "sha256-utf8-original-json",
            "storyboard_id": hashlib.sha256(self.storyboard.read_bytes()).hexdigest(),
            "approved_scene_count": 17,
            "requires_backend_verification": True
        }), encoding="utf-8")

    def test_matching_approval(self):
        self.assertEqual(len(verify(self.storyboard, self.approval)), 64)

    def test_changed_storyboard_is_rejected(self):
        self.storyboard.write_text(self.storyboard.read_text(encoding="utf-8") + " ", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            verify(self.storyboard, self.approval)

    def test_missing_scene_rejected(self):
        data = json.loads(self.storyboard.read_text(encoding="utf-8"))
        del data["scenes"]["P7"]
        self.storyboard.write_text(json.dumps(data), encoding="utf-8")
        self.write_approval()
        with self.assertRaisesRegex(ValueError, "17 scenes"):
            verify(self.storyboard, self.approval)

    def test_unrecognized_approval_schema_rejected(self):
        data = json.loads(self.approval.read_text(encoding="utf-8"))
        data["schema"] = "invalid"
        self.approval.write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "schema"):
            verify(self.storyboard, self.approval)

if __name__ == "__main__":
    unittest.main()
