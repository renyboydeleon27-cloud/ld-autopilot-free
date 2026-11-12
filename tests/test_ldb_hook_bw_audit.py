import json
import hashlib
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw
from scripts.ldb_hook_bw_audit import ReviewError, make_review, neutrality

class HookBlackWhiteReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.raw = self.root / "HOOK-original.jpg"
        self.review = self.root / "review"

    def make_jpeg(self, size=(576, 1024), color=(40, 43, 40)):
        image = Image.new("RGB", size, color)
        painter = ImageDraw.Draw(image)
        painter.rectangle((0, 0, 200, 200), fill=(210, 210, 210))
        image.save(self.raw, format="JPEG", quality=94)

    def test_tinted_render_creates_exact_neutral_rgb_png_but_not_approval(self):
        self.make_jpeg()
        initial = self.raw.read_bytes()
        result = make_review(self.raw, self.review)
        self.assertEqual(self.raw.read_bytes(), initial)
        self.assertFalse(result["originalNeutrality"]["neutralRgbExact"])
        self.assertGreater(result["originalNeutrality"]["nonNeutralPixelFraction"], 0)
        self.assertTrue(result["correctedNeutrality"]["neutralRgbExact"])
        self.assertEqual(result["correctedNeutrality"]["maxRgbChannelSpread"], 0)
        self.assertFalse(result["productionDeliveryAllowed"])
        self.assertEqual(result["humanVisualAudit"], "PENDING")
        self.assertFalse(result["approvedReferenceContinuityVerified"])
        with Image.open(self.review / result["correctedFile"]) as frame:
            self.assertEqual(frame.format, "PNG")
            self.assertEqual(frame.mode, "RGB")
            self.assertEqual(frame.size, (576, 1024))
            self.assertTrue(neutrality(frame)["neutralRgbExact"])
        saved = json.loads((self.review / (Path(result["correctedFile"]).stem.replace(".neutral", "") + ".bw-review.json")).read_text())
        self.assertEqual(saved["originalSha256"], result["originalSha256"])
        self.assertEqual(saved["correctedSha256"], result["correctedSha256"])
        again = make_review(self.raw, self.review)
        self.assertEqual(again, result)

    def test_bad_dimensions_or_truncated_file_rejected_before_output(self):
        self.make_jpeg(size=(1024, 1024))
        with self.assertRaisesRegex(ReviewError, "INVALID_PORTRAIT_DIMENSIONS"):
            make_review(self.raw, self.review)
        self.assertFalse(self.review.exists())
        self.raw.write_bytes(b"\xff\xd8" + b"broken" * 40)
        with self.assertRaisesRegex(ReviewError, "INVALID_IMAGE_DECODE"):
            make_review(self.raw, self.review)
        self.assertFalse(self.review.exists())

    def test_non_image_and_large_bytes_rejected(self):
        self.raw.write_bytes(b"a" * 8_000_001)
        with self.assertRaisesRegex(ReviewError, "INVALID_IMAGE_BYTES"):
            make_review(self.raw, self.review)
        self.raw.write_bytes(b"just not an image" * 100)
        with self.assertRaisesRegex(ReviewError, "INVALID_IMAGE_DECODE"):
            make_review(self.raw, self.review)

    def test_grayscale_source_still_not_production_approved(self):
        self.make_jpeg(color=(80, 80, 80))
        result = make_review(self.raw, self.review)
        self.assertTrue(result["originalNeutrality"]["neutralRgbExact"])
        self.assertTrue(result["correctedNeutrality"]["neutralRgbExact"])
        self.assertEqual(result["status"], "GRAYSCALE_CANDIDATE_ONLY")
        self.assertFalse(result["compositionVerified"])


    def test_isolated_v5_preview_links_review_only_and_preserves_original(self):
        self.raw = self.root / "HOOK.jpg"  # Exact isolated runner output filename
        self.review = self.root / "review-only"
        self.make_jpeg()
        original = self.raw.read_bytes()
        index = self.root / "index.html"
        index.write_text("<h1>Original HOOK</h1>", encoding="utf-8")
        evidence = {
            "worker": "ner-ldb-runner-quality-v5",
            "status": "HOOK_CLOUD_TEST_PASSED",
            "checkpointStatus": "TEST_PAUSED",
            "completedScenes": 1,
            "totalScenes": 17,
            "runtimeCredentialsRemoved": True,
            "fullAutoProduction": False,
            "googleConnected": False,
            "storyboard_sha256": "75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05",
            "output": {
                "scene": "HOOK",
                "sha256": hashlib.sha256(original).hexdigest(),
                "bytes": len(original),
                "width": 576, "height": 1024, "mimeType": "image/jpeg",
            },
        }
        (self.root / "report.json").write_text(json.dumps(evidence), encoding="utf-8")
        report = make_review(self.raw, self.review, preview_compare=True)
        self.assertEqual(original, self.raw.read_bytes())
        comparison = (self.review / "index.html").read_text(encoding="utf-8")
        self.assertIn("NOT APPROVED", comparison)
        self.assertIn("../HOOK.jpg", comparison)
        self.assertIn(report["correctedFile"], comparison)
        self.assertIn("review-only/index.html", index.read_text(encoding="utf-8"))
        self.assertFalse(report["productionDeliveryAllowed"])
        again = make_review(self.raw, self.review, preview_compare=True)
        self.assertEqual(again, report)


    def test_real_runner_status_projection_omits_dimensions_but_checked_jpeg_remains_valid(self):
        """Nov 7 V5 cloud status includes hash and bytes, but omits width/height."""
        self.raw = self.root / "HOOK.jpg"
        self.review = self.root / "review-only"
        self.make_jpeg()
        initial = self.raw.read_bytes()
        (self.root / "index.html").write_text("<h1>HOOK original</h1>", encoding="utf-8")
        evidence = {
            "worker": "ner-ldb-runner-quality-v5",
            "status": "HOOK_CLOUD_TEST_PASSED",
            "checkpointStatus": "TEST_PAUSED",
            "completedScenes": 1,
            "totalScenes": 17,
            "runtimeCredentialsRemoved": True,
            "isolatedWorkerRemoved": True,
            "fullAutoProduction": False,
            "googleConnected": False,
            "storyboard_sha256": "75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05",
            "output": {
                "scene": "HOOK",
                "sha256": hashlib.sha256(initial).hexdigest(),
                "bytes": len(initial),
                "mimeType": "image/jpeg",
                "visualAudit": "PENDING"
            }
        }
        (self.root / "report.json").write_text(json.dumps(evidence), encoding="utf-8")
        result = make_review(self.raw, self.review, preview_compare=True)
        self.assertEqual(self.raw.read_bytes(), initial)
        self.assertEqual(result["humanVisualAudit"], "PENDING")
        self.assertFalse(result["productionDeliveryAllowed"])
        self.assertTrue(result["correctedNeutrality"]["neutralRgbExact"])
        self.assertTrue((self.review / "index.html").exists())
        # Requiring metadata dimensions would have incorrectly rejected the
        # real Nov 7 cloud result. The decoded JPEG remains size-checked.

    def test_optional_status_dimensions_cannot_override_actual_image_dimensions(self):
        self.raw = self.root / "HOOK.jpg"
        self.review = self.root / "review-only"
        self.make_jpeg()
        initial = self.raw.read_bytes()
        (self.root / "index.html").write_text("<h1>HOOK original</h1>", encoding="utf-8")
        record = {
            "worker": "ner-ldb-runner-quality-v5",
            "status": "HOOK_CLOUD_TEST_PASSED",
            "checkpointStatus": "TEST_PAUSED",
            "completedScenes": 1,
            "totalScenes": 17,
            "runtimeCredentialsRemoved": True,
            "fullAutoProduction": False,
            "googleConnected": False,
            "storyboard_sha256": "75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05",
            "output": {
                "scene": "HOOK",
                "sha256": hashlib.sha256(initial).hexdigest(),
                "bytes": len(initial),
                "mimeType": "image/jpeg",
                "visualAudit": "PENDING"
            }
        }
        for extra in (
            {"width": 1024, "height": 576},
            {"width": 576},
            {"height": 1024},
            {"visualAudit": "PASS"},
            {"sha256": "0" * 64}
        ):
            report = {**record, "output": {**record["output"], **extra}}
            (self.root / "report.json").write_text(json.dumps(report), encoding="utf-8")
            with self.assertRaisesRegex(ReviewError, "V5_CLOUD_REPORT_MISMATCH"):
                make_review(self.raw, self.review, preview_compare=True)
            self.assertFalse(self.review.exists())
        self.assertEqual(self.raw.read_bytes(), initial)

    def test_preview_mode_rejects_unrelated_source_without_creating_public_page(self):
        self.make_jpeg()
        with self.assertRaisesRegex(ReviewError, "INVALID_PREVIEW_COMPARISON_LOCATION"):
            make_review(self.raw, self.root / "unrelated", preview_compare=True)
        self.assertFalse((self.root / "unrelated" / "index.html").exists())


    def test_v5_preview_fails_closed_without_a_verified_cloud_report(self):
        self.raw = self.root / "HOOK.jpg"
        self.review = self.root / "review-only"
        self.make_jpeg()
        original = self.raw.read_bytes()
        # The wrong worker, a stale checksum, or a missing report cannot publish
        # a page or even a review-only image. No source bytes are modified.
        valid = {
            "worker": "ner-ldb-runner-quality-v5",
            "status": "HOOK_CLOUD_TEST_PASSED",
            "checkpointStatus": "TEST_PAUSED",
            "completedScenes": 1,
            "totalScenes": 17,
            "runtimeCredentialsRemoved": True,
            "fullAutoProduction": False,
            "googleConnected": False,
            "storyboard_sha256": "75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05",
            "output": {
                "scene": "HOOK",
                "sha256": hashlib.sha256(original).hexdigest(),
                "bytes": len(original), "width": 576,
                "height": 1024, "mimeType": "image/jpeg",
            },
        }
        with self.assertRaisesRegex(ReviewError, "V5_CLOUD_REPORT_REQUIRED"):
            make_review(self.raw, self.review, preview_compare=True)
        self.assertFalse(self.review.exists())
        for changes in (
            {"worker": "ner-ldb-runner-quality-v4"},
            {"completedScenes": 17},
            {"runtimeCredentialsRemoved": False},
            {"checkpointStatus": "QUEUED"},
            {"storyboard_sha256": "0" * 64},
            {"output": {**valid["output"], "sha256": "0" * 64}},
            {"output": {**valid["output"], "width": 1024}},
            {"googleConnected": True},
        ):
            record = {**valid, **changes}
            (self.root / "report.json").write_text(json.dumps(record), encoding="utf-8")
            with self.assertRaisesRegex(ReviewError, "V5_CLOUD_REPORT_MISMATCH"):
                make_review(self.raw, self.review, preview_compare=True)
            self.assertFalse(self.review.exists())
        self.assertEqual(original, self.raw.read_bytes())


    def test_v5_preview_can_audit_real_png_without_relabeling_original(self):
        self.raw = self.root / "HOOK.png"
        self.review = self.root / "review-only"
        Image.new("RGB", (576, 1024), (110, 100, 90)).save(self.raw, format="PNG")
        original = self.raw.read_bytes()
        (self.root / "index.html").write_text("<h1>Original PNG</h1>", encoding="utf-8")
        evidence = {
            "worker": "ner-ldb-runner-quality-v5",
            "status": "HOOK_CLOUD_TEST_PASSED",
            "checkpointStatus": "TEST_PAUSED",
            "completedScenes": 1,
            "totalScenes": 17,
            "runtimeCredentialsRemoved": True,
            "isolatedWorkerRemoved": True,
            "fullAutoProduction": False,
            "googleConnected": False,
            "storyboard_sha256": "75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05",
            "sourceFile": "HOOK.png",
            "output": {
                "scene": "HOOK",
                "sha256": hashlib.sha256(original).hexdigest(),
                "bytes": len(original), "mimeType": "image/png",
                "visualAudit": "PENDING"
            }
        }
        (self.root / "report.json").write_text(json.dumps(evidence), encoding="utf-8")
        result = make_review(self.raw, self.review, preview_compare=True)
        self.assertEqual(self.raw.read_bytes(), original)
        self.assertFalse(result["productionDeliveryAllowed"])
        self.assertIn("../HOOK.png", (self.review / "index.html").read_text(encoding="utf-8"))
        evidence["sourceFile"] = "HOOK.jpg"
        (self.root / "report.json").write_text(json.dumps(evidence), encoding="utf-8")
        with self.assertRaisesRegex(ReviewError, "V5_CLOUD_REPORT_MISMATCH"):
            make_review(self.raw, self.review, preview_compare=True)

if __name__ == "__main__":
    unittest.main()
