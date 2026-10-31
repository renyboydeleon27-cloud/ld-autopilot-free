import io
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from scripts.ldb_reference_assets import inspect_reference, copy_references
from scripts.verify_ldb_approval import EXPECTED


def picture(size=(941, 1672), shade=30):
    image = Image.new('RGB', size, (shade, shade, shade))
    image.putpixel((0, 0), (255, 255, 255))
    out = io.BytesIO()
    image.save(out, format='PNG')
    return out.getvalue()


class References(unittest.TestCase):
    def test_recovered_dimensions_and_full_decode(self):
        raw = picture()
        info = inspect_reference(raw)
        self.assertEqual((info['width'], info['height']), (941, 1672))
        self.assertTrue(info['neutral_grayscale'])
        with self.assertRaises(Exception):
            inspect_reference(raw[:100])
        with self.assertRaises(ValueError):
            inspect_reference(picture((600, 600)))

    def test_copy_keeps_original_bytes_and_never_marks_visual_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sources = {}
            for i, scene in enumerate(EXPECTED):
                sources[scene] = root / (scene + '.png')
                sources[scene].write_bytes(picture(shade=i))
            before = {k: v.read_bytes() for k, v in sources.items()}
            audit = copy_references(sources, root / 'copied')
            self.assertEqual(len(audit), 17)
            for row in audit:
                self.assertEqual((root / 'copied' / row['filename']).read_bytes(), before[row['scene']])
                self.assertEqual(sources[row['scene']].read_bytes(), before[row['scene']])
                self.assertFalse(row['delivery_ready'])
                self.assertEqual(row['visual_check'], 'PENDING')
            with self.assertRaises(ValueError):
                copy_references(sources, root / 'copied')

    def test_duplicate_mapping_fails_before_output_creation(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'one.png'
            source.write_bytes(picture())
            with self.assertRaises(ValueError):
                copy_references(dict.fromkeys(EXPECTED, source), Path(tmp)/'out')
            self.assertFalse((Path(tmp)/'out').exists())
