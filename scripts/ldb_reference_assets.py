"""Copy explicit reference mappings without changing pixels or source files.

Recovered references are not automatically approved production renders.
"""
import hashlib
import io
import json
from pathlib import Path
from PIL import Image
from scripts.verify_ldb_approval import EXPECTED


def inspect_reference(raw):
    if not raw or len(raw) > 20_000_000:
        raise ValueError('Invalid reference size')
    with Image.open(io.BytesIO(raw)) as probe:
        if probe.format not in {'PNG', 'JPEG'}:
            raise ValueError('PNG or JPEG required')
        width, height = probe.size
        if width < 500 or height < 880 or abs(width / height - 9 / 16) > .002:
            raise ValueError('Portrait 9:16 reference required')
        if width * height > 20_000_000:
            raise ValueError('Reference exceeds pixel budget')
        probe.verify()
    with Image.open(io.BytesIO(raw)) as source:
        source.load()
        if source.getexif().get(274, 1) != 1:
            raise ValueError('Reference requires orientation review')
        rgb = source.convert('RGB')
        channels = rgb.split()
        neutral = channels[0].tobytes() == channels[1].tobytes() == channels[2].tobytes()
        if max(high-low for low, high in rgb.getextrema()) < 8:
            raise ValueError('Uniform reference rejected')
        extension = '.png' if source.format == 'PNG' else '.jpg'
    return {'width': width, 'height': height, 'bytes': len(raw),
            'sha256': hashlib.sha256(raw).hexdigest(),
            'md5': hashlib.md5(raw, usedforsecurity=False).hexdigest(),
            'neutral_grayscale': neutral, 'extension': extension}


def copy_references(sources, destination):
    if set(sources) != set(EXPECTED):
        raise ValueError('Explicit mapping for all 17 scenes required')
    destination = Path(destination)
    if destination.exists():
        raise ValueError('Destination must be new')
    prepared = []
    for scene in EXPECTED:
        source = Path(sources[scene])
        raw = source.read_bytes()
        info = inspect_reference(raw)
        prepared.append((scene, source, raw, info))
    if len({x[3]['sha256'] for x in prepared}) != 17:
        raise ValueError('Duplicate scene references rejected')
    destination.mkdir(parents=True)
    audit = []
    for scene, source, raw, info in prepared:
        filename = scene + info['extension']
        target = destination / filename
        target.write_bytes(raw)
        if hashlib.sha256(target.read_bytes()).hexdigest() != info['sha256']:
            raise ValueError('Copy checksum mismatch')
        audit.append({**info, 'scene': scene, 'filename': filename,
                      'source_filename': source.name,
                      'provenance': 'recovered-reference',
                      'mapping_status': 'CANDIDATE',
                      'structural_check': 'PASS', 'visual_check': 'PENDING',
                      'delivery_ready': False})
    (destination / 'reference_audit.json').write_text(json.dumps(audit, indent=2)+'\n')
    return audit
