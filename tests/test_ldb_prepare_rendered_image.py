import hashlib
import io
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from scripts.ldb_prepare_rendered_image import prepare_rendered_image
from scripts.ldb_audit_image import audit_image


class PersistTests(unittest.TestCase):
    def fixture(self, folder):
        image = Image.new('RGB', (576,1024), (25,26,27))
        image.paste((200,190,180), (0,0,288,1024))
        buf=io.BytesIO(); image.save(buf,format='JPEG'); raw=buf.getvalue()
        source=Path(folder)/'original.jpg'; source.write_bytes(raw)
        checkpoint={'status':'HOOK_CLOUD_TEST_PASSED','completedScenes':1,
                    'checkpointStatus':'TEST_PAUSED','storyboard_sha256':'a'*64,
                    'output':{'scene':'HOOK','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}}
        return source, raw, checkpoint, Path(folder)/'prepared'

    def test_persisted_corrected_bytes_keep_original_and_require_visual_review(self):
        with tempfile.TemporaryDirectory() as folder:
            source, raw, checkpoint, dest=self.fixture(folder)
            report=prepare_rendered_image(source,checkpoint,dest)
            final=(dest/'HOOK.png').read_bytes()
            self.assertEqual(source.read_bytes(),raw)
            self.assertEqual(audit_image(final,'HOOK')['max_channel_spread'],0)
            self.assertEqual(report['audit']['sha256'],hashlib.sha256(final).hexdigest())
            self.assertEqual((dest/'READY').read_text().strip(),report['audit']['sha256'])
            self.assertEqual(report['visual_check'],'PENDING')
            self.assertFalse(report['delivery_ready'])
            with self.assertRaises(ValueError): prepare_rendered_image(source,checkpoint,dest)
            self.assertEqual((dest/'HOOK.png').read_bytes(),final)

    def test_wrong_checkpoint_hash_creates_no_output(self):
        with tempfile.TemporaryDirectory() as folder:
            source,raw,checkpoint,dest=self.fixture(folder)
            checkpoint['output']['sha256']='b'*64
            with self.assertRaises(ValueError): prepare_rendered_image(source,checkpoint,dest)
            self.assertFalse(dest.exists())

    def test_incomplete_or_unpaused_checkpoint_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            source,raw,checkpoint,dest=self.fixture(folder)
            checkpoint['checkpointStatus']='RUNNING'
            with self.assertRaises(ValueError): prepare_rendered_image(source,checkpoint,dest)
            self.assertFalse(dest.exists())
