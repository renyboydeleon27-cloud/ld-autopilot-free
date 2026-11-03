import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from scripts.ldb_free_packager import make_package_from_bundle, CLIPS
from scripts.ldb_profiles.lake_nyos import expansion, STORYBOARD_SHA256

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / 'ldb-submissions/lake-nyos-1986-test/approved_bundle.json'

class LakeNyosTests(unittest.TestCase):
    def test_real_bundle_complete_narration_timing_and_manifest(self):
        before = BUNDLE.read_bytes()
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / 'package'
            report = make_package_from_bundle(BUNDLE, out)
            self.assertEqual(report['narration_nonempty'], 16)
            self.assertEqual(report['warnings'], [])
            self.assertTrue(report['production_expansion']['applied'])
            self.assertEqual(report['actual_images_rendered'], 0)
            self.assertFalse(report['drive_uploaded'])
            self.assertEqual(len(list((out / 'flow_prompts').glob('*.txt'))), 16)
            motions = set()
            for key in CLIPS:
                prompt = (out / 'flow_prompts' / f'{key}.txt').read_text()
                for marker in ['0–2s:', '2–6s:', '6–10s:', 'PRIMARY ACTION:', 'SFX ONLY:', 'EXACTLY 10 SECONDS']:
                    self.assertIn(marker, prompt)
                narration = (out / 'narration' / f'{key}.txt').read_text().strip()
                self.assertNotIn(narration, prompt)
                self.assertGreaterEqual(len(narration.split()), 18)
                self.assertLessEqual(len(narration.split()), 23)
                motions.add(prompt.split('CAMERA & MOTION:')[1])
            self.assertEqual(len(motions), 16)
            self.assertFalse((out / 'flow_prompts' / 'THUMBNAIL.txt').exists())
            self.assertEqual(hashlib.sha256((out / 'storyboard/approved_storyboard.json').read_bytes()).hexdigest(), STORYBOARD_SHA256)
            for filename, expected in report['file_checksums_sha256'].items():
                self.assertEqual(hashlib.sha256((out / filename).read_bytes()).hexdigest(), expected)
        self.assertEqual(before, BUNDLE.read_bytes())

    def test_profile_never_matches_by_title_or_new_hash(self):
        self.assertEqual(expansion('Lake Nyos'), {})
        self.assertEqual(expansion('0' * 64), {})
