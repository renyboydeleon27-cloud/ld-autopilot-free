"""Offline HOOK B/W review artifact. No inference, Drive, Gmail, or automatic acceptance.

Produces a new neutral RGB PNG, leaving the provider-rendered source unchanged.
It fixes color-channel inequality ONLY, never pose, objects, anatomy or continuity.
"""
import argparse
import hashlib
import io
import json
import re
from pathlib import Path
from PIL import Image, ImageChops, ImageOps, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 1_000_000
MAX_BYTES = 8_000_000
EXPECTED_SIZE = (576, 1024)

class ReviewError(ValueError):
    pass

def digest(payload):
    return hashlib.sha256(payload).hexdigest()

def neutrality(image):
    rgb = image.convert("RGB")
    red, green, blue = rgb.split()
    delta = ImageChops.lighter(
        ImageChops.difference(red, green),
        ImageChops.lighter(ImageChops.difference(red, blue),
                            ImageChops.difference(green, blue)))
    total = rgb.width * rgb.height
    nonneutral = total - delta.histogram()[0]
    return {
        "neutralRgbExact": nonneutral == 0,
        "nonNeutralPixelCount": nonneutral,
        "nonNeutralPixelFraction": nonneutral / total,
        "maxRgbChannelSpread": delta.getextrema()[1],
        "pixelCount": total,
    }

def load_source(source):
    source = Path(source)
    raw = source.read_bytes()
    if not 100 <= len(raw) <= MAX_BYTES:
        raise ReviewError("INVALID_IMAGE_BYTES")
    try:
        with Image.open(io.BytesIO(raw)) as opened:
            if opened.format not in ("JPEG", "PNG"):
                raise ReviewError("UNSUPPORTED_IMAGE_FORMAT")
            if getattr(opened, "n_frames", 1) != 1:
                raise ReviewError("ANIMATED_IMAGE_NOT_ALLOWED")
            if opened.getexif().get(274, 1) != 1:
                raise ReviewError("NONSTANDARD_ORIENTATION")
            if opened.size != EXPECTED_SIZE:
                raise ReviewError("INVALID_PORTRAIT_DIMENSIONS")
            opened.load()
            pixels = opened.convert("RGB")
    except (OSError, UnidentifiedImageError, Image.DecompressionBombError) as exc:
        raise ReviewError("INVALID_IMAGE_DECODE") from exc
    return source, raw, pixels

def write_immutable(path, content):
    try:
        with path.open("xb") as fp:
            fp.write(content)
    except FileExistsError:
        if path.read_bytes() != content:
            raise ReviewError("EXISTING_OUTPUT_DIFFERS")

def make_review(source, output_dir):
    source, raw, rgb = load_source(source)
    before = neutrality(rgb)
    # Grayscale luminance is the ONLY transformation. RGB PNG ensures
    # exact R=G=B even after the candidate is saved and reopened.
    neutral = ImageOps.grayscale(rgb).convert("RGB")
    output = io.BytesIO()
    neutral.save(output, format="PNG", optimize=False, compress_level=9)
    normalized = output.getvalue()
    with Image.open(io.BytesIO(normalized)) as checked:
        checked.load()
        if checked.format != "PNG" or checked.size != EXPECTED_SIZE:
            raise ReviewError("NORMALIZED_OUTPUT_INVALID")
        after = neutrality(checked)
    if not after["neutralRgbExact"]:
        raise ReviewError("NORMALIZED_OUTPUT_NOT_NEUTRAL")
    root = Path(output_dir)
    root.mkdir(parents=True, exist_ok=True)
    prefix = re.sub(r"[^a-zA-Z0-9_-]", "-", source.stem).strip("-") or "HOOK"
    base = prefix + "." + digest(raw)[:12]
    candidate_name = base + ".neutral.png"
    report_name = base + ".bw-review.json"
    report = {
        "status": "GRAYSCALE_CANDIDATE_ONLY",
        "originalFile": source.name,
        "originalSha256": digest(raw),
        "originalBytes": len(raw),
        "originalNeutrality": before,
        "correctedFile": candidate_name,
        "correctedSha256": digest(normalized),
        "correctedBytes": len(normalized),
        "correctedNeutrality": after,
        "pixelChange": "GRAYSCALE_LUMINANCE_ONLY",
        "compositionVerified": False,
        "anatomyVerified": False,
        "historicalAccuracyVerified": False,
        "approvedReferenceContinuityVerified": False,
        "humanVisualAudit": "PENDING",
        "productionDeliveryAllowed": False,
        "note": "This is not an approved reference image and must not auto-enter the 69-file delivery plan.",
    }
    # Check output collision before writing either file; the source remains untouched.
    candidate_path = root / candidate_name
    report_path = root / report_name
    rendered_report = (json.dumps(report, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    for path, content in ((candidate_path, normalized), (report_path, rendered_report)):
        if path.exists() and path.read_bytes() != content:
            raise ReviewError("EXISTING_OUTPUT_DIFFERS")
    write_immutable(candidate_path, normalized)
    write_immutable(report_path, rendered_report)
    return report

def main():
    parser = argparse.ArgumentParser(description="Prepare an offline exact-grayscale review candidate; never approves production")
    parser.add_argument("--input", required=True, type=Path, help="Existing raw provider HOOK JPG/PNG")
    parser.add_argument("--output-dir", required=True, type=Path, help="Separate review-only output folder")
    args = parser.parse_args()
    report = make_review(args.input, args.output_dir)
    print(json.dumps(report, ensure_ascii=False))

if __name__ == "__main__":
    main()
