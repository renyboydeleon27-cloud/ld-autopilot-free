"""Decode and normalize actual render files into a new directory, never in place.

Requires Pillow. Structural checks cannot certify anatomy, history, continuity,
text absence or artistic quality; these remain explicitly pending visual review.
"""
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError
from scripts.verify_ldb_approval import EXPECTED

MAX_BYTES = 8_000_000

def normalize_image(raw, scene):
    if scene not in EXPECTED or not raw or len(raw) > MAX_BYTES:
        raise ValueError('Invalid scene or image size')
    try:
        with Image.open(io.BytesIO(raw)) as probe:
            if probe.format not in {'PNG', 'JPEG'} or probe.size != (576, 1024):
                raise ValueError('Expected a 576x1024 PNG or JPEG')
            probe.verify()
        with Image.open(io.BytesIO(raw)) as source:
            source.load()
            image = ImageOps.exif_transpose(source).convert('RGB')
            if image.size != (576, 1024):
                raise ValueError('Orientation changes required dimensions')
            if scene != 'THUMBNAIL':
                image = ImageOps.grayscale(image).convert('RGB')
            channels = image.split()
            equal = channels[0].tobytes() == channels[1].tobytes() == channels[2].tobytes()
            if scene == 'THUMBNAIL' and equal:
                raise ValueError('Thumbnail must contain color')
            if max(high-low for low, high in image.getextrema()) < 8:
                raise ValueError('Image is blank or nearly uniform')
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise ValueError('Image failed full decode') from exc
    normalized = buffer.getvalue()
    return normalized, {
        'scene': scene, 'width': 576, 'height': 1024,
        'source_sha256': hashlib.sha256(raw).hexdigest(),
        'sha256': hashlib.sha256(normalized).hexdigest(),
        'md5': hashlib.md5(normalized, usedforsecurity=False).hexdigest(),
        'bytes': len(normalized), 'neutral_grayscale': equal,
        'structural_check': 'PASS', 'visual_check': 'PENDING',
        'delivery_ready': False,
    }

def prepare_images(sources, destination):
    """sources is an explicit scene-to-path map; originals are only read."""
    if set(sources) != set(EXPECTED):
        raise ValueError('All 17 actual source image paths are required')
    destination = Path(destination)
    if destination.exists():
        raise ValueError('Destination must be new; never overwrite images')
    prepared = [normalize_image(Path(sources[key]).read_bytes(), key) for key in EXPECTED]
    destination.mkdir(parents=True)
    audit = []
    for data, record in prepared:
        filename = record['scene'] + '.png'
        (destination / filename).write_bytes(data)
        audit.append({**record, 'filename': filename})
    (destination / 'image_audit.json').write_text(json.dumps(audit, indent=2) + '\n')
    return audit
