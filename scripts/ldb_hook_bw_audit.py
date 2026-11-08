"""Offline HOOK B/W review artifact. No inference, Drive, Gmail, or automatic acceptance.

Produces a new neutral RGB PNG, leaving the provider-rendered source unchanged.
It fixes color-channel inequality ONLY, never pose, objects, anatomy or continuity.
"""
import argparse
from html import escape
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

def verify_v5_execution(source, raw):
    """Fail before any review artifact is written if the preview is not real V5."""
    try:
        report = json.loads((source.parent / "report.json").read_text(encoding="utf-8"))
    except (OSError, ValueError, UnicodeDecodeError) as exc:
        raise ReviewError("V5_CLOUD_REPORT_REQUIRED") from exc
    out = report.get("output") if isinstance(report, dict) else None
    source_file = report.get("sourceFile", "HOOK.jpg" if isinstance(out, dict) and out.get("mimeType") == "image/jpeg" else None)
    if source_file not in ("HOOK.jpg", "HOOK.png") or source.name != source_file:
        raise ReviewError("V5_CLOUD_REPORT_MISMATCH")
    expected_mime = "image/png" if source_file == "HOOK.png" else "image/jpeg"
    if not isinstance(out, dict) or out.get("mimeType") != expected_mime:
        raise ReviewError("V5_CLOUD_REPORT_MISMATCH")
    if source_file == "HOOK.png" and not raw.startswith(bytes.fromhex("89504e470d0a1a0a")):
        raise ReviewError("V5_CLOUD_REPORT_MISMATCH")
    if source_file == "HOOK.jpg" and not raw.startswith(bytes.fromhex("ffd8")):
        raise ReviewError("V5_CLOUD_REPORT_MISMATCH")
    if any((
        report.get("worker") != "ner-ldb-runner-quality-v5",
        report.get("status") != "HOOK_CLOUD_TEST_PASSED",
        report.get("checkpointStatus") != "TEST_PAUSED",
        report.get("completedScenes") != 1,
        report.get("totalScenes") != 17,
        report.get("runtimeCredentialsRemoved") is not True,
        report.get("fullAutoProduction") is not False,
        report.get("googleConnected") is not False,
        report.get("storyboard_sha256") != "75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05",
        out.get("scene") != "HOOK",
        out.get("sha256") != digest(raw),
        out.get("bytes") != len(raw),
        # The authenticated Runner /status projection deliberately omits
        # width/height, unlike its internal durable image metadata. The JPEG
        # itself is decoded and checked for 576x1024 in load_source().
        # If both dimensions ARE supplied, they must still match; a partial
        # or contradictory dimension pair is an invalid report.
        (("width" in out or "height" in out) and
         (out.get("width") != EXPECTED_SIZE[0] or out.get("height") != EXPECTED_SIZE[1])),
        out.get("mimeType") != expected_mime,
        out.get("visualAudit") not in (None, "PENDING"),
    )):
        raise ReviewError("V5_CLOUD_REPORT_MISMATCH")
    return report


def make_review(source, output_dir, *, preview_compare=False):
    source, raw, rgb = load_source(source)
    # Validate the full isolated V5 report BEFORE creating even a review folder.
    # A synthetic or mislabeled image must not produce a misleading cloud preview.
    root = Path(output_dir)
    if preview_compare:
        if source.name not in ("HOOK.jpg", "HOOK.png") or root.resolve() != (source.parent / "review-only").resolve():
            raise ReviewError("INVALID_PREVIEW_COMPARISON_LOCATION")
        verify_v5_execution(source, raw)
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
    if preview_compare:
        # Only a single isolated HOOK preview may expose a comparison page.
        # This NEVER changes image bytes or grants visual approval.
        comparison = (
            '<!doctype html><html lang="en"><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>HOOK V5 — not approved</title>'
            '<style>body{font:16px system-ui;max-width:820px;margin:20px auto;padding:0 16px}'
            'figure{width:min(44%,340px);display:inline-block;vertical-align:top;margin:0 2% 20px 0}'
            'img{width:100%;height:auto}strong{color:#982d17}</style>'
            '<h1>HOOK V5: original vs strict grayscale</h1>'
            '<p><strong>NOT APPROVED</strong> — grayscale correction does not verify pose, '
            'anatomy, history, or approved reference continuity.</p>'
            '<figure><img src="../' + escape(source.name, quote=True) + '" alt="Original HOOK image"><figcaption>Original (unchanged)</figcaption></figure>'
            '<figure><img src="' + escape(candidate_name, quote=True) + '" alt="Exact B/W review candidate">'
            '<figcaption>Neutral RGB PNG (review only)</figcaption></figure>'
            '<p><a href="' + escape(report_name, quote=True) + '">Pixel audit and SHA-256 (JSON)</a></p></html>'
        ).encode("utf-8")
        write_immutable(root / "index.html", comparison)
        root_index = source.parent / "index.html"
        existing = root_index.read_text(encoding="utf-8")
        marker = '<p><a href="review-only/index.html">Compare original and grayscale candidate (NOT APPROVED)</a></p>'
        if marker not in existing:
            # Keep the original image/report links and status statement.
            root_index.write_text(existing + marker, encoding="utf-8")
    return report

def main():
    parser = argparse.ArgumentParser(description="Prepare an offline exact-grayscale review candidate; never approves production")
    parser.add_argument("--input", required=True, type=Path, help="Existing raw provider HOOK JPG/PNG")
    parser.add_argument("--output-dir", required=True, type=Path, help="Separate review-only output folder")
    parser.add_argument("--preview-compare", action="store_true", help="Create isolated V5 comparison page, never production approval")
    args = parser.parse_args()
    report = make_review(args.input, args.output_dir, preview_compare=args.preview_compare)
    print(json.dumps(report, ensure_ascii=False))

if __name__ == "__main__":
    main()
