"""Offline quality and safety tests for the FREE LDB prompt package worker."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.ldb_free_packager import CLIPS, EXPECTED, make_package


class FreePackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.storyboard = self.home / "storyboard.json"
        self.approval = self.home / "approval.json"
        self.out = self.home / "package"
        self.data = {
            "topic": "Example historical disaster",
            "scenes": {
                name: {
                    "visual": f"Distinct historically grounded shot for {name} with one strong foreground subject.",
                    "motion": f"Slow vertical camera drift showing the environment of {name}.",
                    "narration": f"Sample voiceover narration for {name}." if name != "THUMBNAIL" else ""
                }
                for name in EXPECTED
            }
        }
        self.save()

    def save(self):
        self.storyboard.write_text(json.dumps(self.data, indent=2), encoding="utf-8")
        self.approval.write_text(json.dumps({
            "schema": "ldb-storyboard-approval-v1",
            "hash_algorithm": "sha256-utf8-original-json",
            "storyboard_id": hashlib.sha256(self.storyboard.read_bytes()).hexdigest(),
            "approved_scene_count": 17,
            "requires_backend_verification": True,
            "source": "local-manual-approval",
            "topic": "Example historical disaster"
        }), encoding="utf-8")

    def test_package_counts_and_no_fake_renders(self):
        report = make_package(self.storyboard, self.approval, self.out)
        self.assertEqual(report["approval_gate"], "PASS")
        self.assertEqual(report["package_status"], "PROMPTS_ONLY")
        self.assertEqual(report["actual_images_rendered"], 0)
        self.assertEqual(report["actual_videos_rendered"], 0)
        self.assertFalse(report["drive_uploaded"])
        self.assertEqual(len(list((self.out / "image_prompts").glob("*.txt"))), 17)
        self.assertEqual(len(list((self.out / "flow_prompts").glob("*.txt"))), 15)
        self.assertEqual(len(list((self.out / "narration").glob("*.txt"))), 16)
        self.assertEqual(len(CLIPS), 15)

    def test_visual_and_video_locks(self):
        make_package(self.storyboard, self.approval, self.out)
        hook = (self.out / "image_prompts" / "HOOK.txt").read_text()
        thumbnail = (self.out / "image_prompts" / "THUMBNAIL.txt").read_text()
        clip = (self.out / "flow_prompts" / "P14.txt").read_text()
        self.assertIn("TRUE BLACK-AND-WHITE", hook)
        self.assertIn("Full-color illustration permitted", thumbnail)
        self.assertIn("EXACTLY 10 SECONDS", clip)
        self.assertIn("NO voice", clip)
        self.assertFalse((self.out / "flow_prompts" / "ENDING.txt").exists())
        self.assertFalse((self.out / "flow_prompts" / "THUMBNAIL.txt").exists())

    def test_no_approval_no_output(self):
        self.approval.unlink()
        with self.assertRaises(OSError):
            make_package(self.storyboard, self.approval, self.out)
        self.assertFalse(self.out.exists())

    def test_change_requires_fresh_approval(self):
        self.data["scenes"]["P7"]["visual"] += " Changed after approval"
        self.storyboard.write_text(json.dumps(self.data), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            make_package(self.storyboard, self.approval, self.out)
        self.assertFalse(self.out.exists())

    def test_short_scene_is_blocked(self):
        self.data["scenes"]["P12"]["visual"] = "Too short"
        self.save()
        with self.assertRaisesRegex(ValueError, "P12"):
            make_package(self.storyboard, self.approval, self.out)
        self.assertFalse(self.out.exists())

    def test_repeat_output_cannot_overwrite(self):
        make_package(self.storyboard, self.approval, self.out)
        with self.assertRaisesRegex(ValueError, "must not contain"):
            make_package(self.storyboard, self.approval, self.out)

    def test_exact_adjacent_visuals_blocked(self):
        self.data["scenes"]["P7"]["visual"] = self.data["scenes"]["P6"]["visual"]
        self.save()
        with self.assertRaisesRegex(ValueError, "P6/P7"):
            make_package(self.storyboard, self.approval, self.out)
        self.assertFalse(self.out.exists())

    def test_rejects_no_manual_approval_source(self):
        self.save()
        approval = json.loads(self.approval.read_text())
        approval["source"] = "auto-approved"
        self.approval.write_text(json.dumps(approval), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "explicit storyboard approval"):
            make_package(self.storyboard, self.approval, self.out)

if __name__ == "__main__":
    unittest.main()
