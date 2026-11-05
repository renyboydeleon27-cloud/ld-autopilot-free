import io
import unittest
from PIL import Image
from scripts.ldb_audit_image import audit_image


def sample(color=(70, 70, 70), mode='RGB', size=(576, 1024)):
    im = Image.new(mode, size, color)
    im.paste((200, 200, 200, 255) if mode == 'RGBA' else (200, 200, 200),
             (0, 0, size[0]//2, size[1]))
    out = io.BytesIO()
    im.save(out, format='PNG')
    return out.getvalue()


class AuditTests(unittest.TestCase):
    def test_tint_of_one_is_rejected(self):
        report = audit_image(sample((70, 71, 70)), 'HOOK')
        self.assertEqual(report['max_channel_spread'], 1)
        self.assertIn('NON_NEUTRAL_STORY_IMAGE', report['reasons'])

    def test_story_pass_does_not_grant_delivery(self):
        raw = sample()
        before = bytes(raw)
        for scene in ('HOOK', 'P14', 'ENDING'):
            report = audit_image(raw, scene)
            self.assertEqual(report['structural_check'], 'PASS')
            self.assertEqual(report['visual_check'], 'PENDING')
            self.assertFalse(report['delivery_ready'])
        self.assertEqual(raw, before)

    def test_thumbnail_color_rule(self):
        self.assertEqual(audit_image(sample((30, 70, 110)), 'THUMBNAIL')['structural_check'], 'PASS')
        self.assertIn('THUMBNAIL_REQUIRES_COLOR', audit_image(sample(), 'THUMBNAIL')['reasons'])

    def test_transparent_and_corrupt_rejected(self):
        for raw in (b'not an image', sample()[:100], sample((70, 70, 70, 0), 'RGBA'), sample(size=(1024, 1024))):
            self.assertEqual(audit_image(raw, 'HOOK')['structural_check'], 'FAIL')

    def test_unknown_scene_rejected(self):
        with self.assertRaises(ValueError):
            audit_image(sample(), 'P15')
