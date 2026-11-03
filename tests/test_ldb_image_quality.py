import io
import unittest
from PIL import Image
from scripts.ldb_image_quality import normalize_image

def sample(size=(576,1024), color=True):
    image = Image.new('RGB', size, (25,26,27) if color else (25,25,25))
    image.paste((200,180,160) if color else (200,200,200), (0,0,size[0]//2,size[1]))
    out=io.BytesIO(); image.save(out,format='PNG'); return out.getvalue()

class ImageQualityTests(unittest.TestCase):
    def test_story_neutral_grayscale_and_thumbnail_color(self):
        original=sample()
        story,audit=normalize_image(original,'HOOK')
        thumb,ta=normalize_image(original,'THUMBNAIL')
        self.assertTrue(audit['neutral_grayscale'])
        self.assertFalse(ta['neutral_grayscale'])
        self.assertEqual(audit['visual_check'],'PENDING')
        self.assertFalse(audit['delivery_ready'])
        self.assertNotEqual(story,thumb)
        self.assertNotEqual(audit['sha256'],audit['source_sha256'])

    def test_corrupt_square_blank_and_gray_thumbnail_rejected(self):
        blank=io.BytesIO(); Image.new('RGB',(576,1024)).save(blank,format='PNG')
        for data,scene in [(b'not an image','P1'),(sample((1024,1024)),'P2'),(sample()[:100],'P3'),(blank.getvalue(),'P4'),(sample(color=False),'THUMBNAIL')]:
            with self.assertRaises(ValueError): normalize_image(data,scene)
