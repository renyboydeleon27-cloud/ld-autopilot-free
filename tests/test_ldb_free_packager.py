"""Offline quality and safety tests for the FREE LDB prompt package worker."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.ldb_free_packager import CLIPS, EXPECTED, make_package, make_package_from_bundle


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

    def write_bundle(self, *, override_story=None, override_approval=None):
        raw = override_story if override_story is not None else self.storyboard.read_text(encoding="utf-8")
        approval = override_approval if override_approval is not None else json.loads(self.approval.read_text(encoding="utf-8"))
        bundle = self.home / "approved_bundle.json"
        bundle.write_text(json.dumps({
            "schema": "ldb-approved-bundle-v1",
            "storyboard_utf8": raw,
            "approval": approval
        }, ensure_ascii=False), encoding="utf-8")
        return bundle

    def test_one_file_approved_bundle_generates_prompts(self):
        report = make_package_from_bundle(self.write_bundle(), self.out)
        self.assertEqual(report["package_status"], "PROMPTS_ONLY")
        self.assertEqual(len(list((self.out / "image_prompts").glob("*.txt"))), 17)
        self.assertEqual(report["actual_images_rendered"], 0)

    def test_one_file_approval_hash_mismatch_is_blocked(self):
        bundle = self.write_bundle(override_story=self.storyboard.read_text() + " ")
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            make_package_from_bundle(bundle, self.out)
        self.assertFalse(self.out.exists())

    def test_invalid_bundle_schema_blocked(self):
        bundle = self.write_bundle()
        data = json.loads(bundle.read_text())
        data["schema"] = "other"
        bundle.write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "schema"):
            make_package_from_bundle(bundle, self.out)

    def test_unapproved_bundle_blocked(self):
        approval = json.loads(self.approval.read_text())
        approval["source"] = "automatically-approved"
        bundle = self.write_bundle(override_approval=approval)
        with self.assertRaisesRegex(ValueError, "manually approved"):
            make_package_from_bundle(bundle, self.out)

    def test_package_counts_and_no_fake_renders(self):
        report = make_package(self.storyboard, self.approval, self.out)
        self.assertEqual(report["approval_gate"], "PASS")
        self.assertEqual(report["package_status"], "PROMPTS_ONLY")
        self.assertEqual(report["actual_images_rendered"], 0)
        self.assertEqual(report["actual_videos_rendered"], 0)
        self.assertFalse(report["drive_uploaded"])
        self.assertEqual(len(list((self.out / "image_prompts").glob("*.txt"))), 17)
        self.assertEqual(len(list((self.out / "flow_prompts").glob("*.txt"))), 16)
        self.assertEqual(len(list((self.out / "narration").glob("*.txt"))), 16)
        self.assertEqual(len(CLIPS), 16)

    def test_visual_and_video_locks(self):
        make_package(self.storyboard, self.approval, self.out)
        hook = (self.out / "image_prompts" / "HOOK.txt").read_text()
        thumbnail = (self.out / "image_prompts" / "THUMBNAIL.txt").read_text()
        clip = (self.out / "flow_prompts" / "P14.txt").read_text()
        self.assertIn("TRUE BLACK-AND-WHITE", hook)
        self.assertIn("Full-color illustration permitted", thumbnail)
        self.assertIn("EXACTLY 10 SECONDS", clip)
        self.assertIn("NO voice", clip)
        self.assertTrue((self.out / "flow_prompts" / "ENDING.txt").exists())
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
