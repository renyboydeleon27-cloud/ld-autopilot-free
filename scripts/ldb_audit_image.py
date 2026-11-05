"""Read-only pixel audit. Never edits images or grants visual approval.

Run: python -m scripts.ldb_audit_image HOOK path/to/image.jpg
Requires Pillow. Exit 2 means structural rejection, 0 means visual review pending.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError

SCENES = ('HOOK', *(f'P{i}' for i in range(1, 15)), 'ENDING', 'THUMBNAIL')
MAX_BYTES = 8_000_000


def audit_image(raw, scene):
    if scene not in SCENES:
        raise ValueError('INVALID_SCENE')
    report = {'scene': scene, 'sha256': hashlib.sha256(raw).hexdigest(),
              'bytes': len(raw), 'structural_check': 'FAIL',
              'visual_check': 'PENDING', 'delivery_ready': False, 'reasons': []}
    if not raw or len(raw) > MAX_BYTES:
        report['reasons'].append('INVALID_BYTE_SIZE')
        return report
    try:
        with Image.open(io.BytesIO(raw)) as probe:
            if probe.format not in ('PNG', 'JPEG') or probe.size != (576, 1024):
                report['reasons'].append('INVALID_FORMAT_OR_DIMENSIONS')
                return report
            if getattr(probe, 'n_frames', 1) != 1:
                report['reasons'].append('ANIMATED_IMAGE')
                return report
            probe.verify()
        with Image.open(io.BytesIO(raw)) as source:
            source.load()
            image = ImageOps.exif_transpose(source)
            if image.size != (576, 1024):
                report['reasons'].append('INVALID_ORIENTED_DIMENSIONS')
                return report
            if image.convert('RGBA').getchannel('A').getextrema() != (255, 255):
                report['reasons'].append('TRANSPARENT_IMAGE')
            rgb = image.convert('RGB')
            data = rgb.tobytes()
            spreads = [max(r, g, b)-min(r, g, b)
                       for r, g, b in zip(data[0::3], data[1::3], data[2::3])]
            maximum = max(spreads)
            report.update(width=576, height=1024, neutral_grayscale=maximum == 0,
                          max_channel_spread=maximum,
                          non_neutral_pixels=sum(s != 0 for s in spreads))
            if scene != 'THUMBNAIL' and maximum:
                report['reasons'].append('NON_NEUTRAL_STORY_IMAGE')
            if scene == 'THUMBNAIL' and maximum == 0:
                report['reasons'].append('THUMBNAIL_REQUIRES_COLOR')
            if max(high-low for low, high in rgb.getextrema()) < 8:
                report['reasons'].append('NEARLY_UNIFORM_IMAGE')
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError):
        report['reasons'].append('DECODE_FAILED')
    if not report['reasons']:
        report['structural_check'] = 'PASS'
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('scene', choices=SCENES)
    parser.add_argument('image', type=Path)
    args = parser.parse_args()
    with args.image.open('rb') as stream:
        raw = stream.read(MAX_BYTES + 1)
    report = audit_image(raw, args.scene)
    print(json.dumps(report, indent=2))
    return 0 if report['structural_check'] == 'PASS' else 2


if __name__ == '__main__':
    raise SystemExit(main())
