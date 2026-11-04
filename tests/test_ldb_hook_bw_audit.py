import json
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

if __name__ == "__main__":
    unittest.main()
