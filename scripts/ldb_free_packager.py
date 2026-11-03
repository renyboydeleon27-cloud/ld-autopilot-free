"""Free, approval-gated LDB prompt packager. No network, paid APIs, image rendering, or video editing.

Usage:
  python -m scripts.ldb_free_packager <storyboard.json> <approval.json> <output-folder>

A successful run means PROMPT PACKAGE ONLY. It does NOT mean that any image
has been rendered, that Flow produced videos, or that files reached Drive.
"""
import hashlib
import json
import re
import sys
import tempfile
from pathlib import Path
from scripts.verify_ldb_approval import EXPECTED, scene_map, verify
from scripts.ldb_profiles.lake_nyos import expansion, SOURCES, IMAGE_NOTES

CLIPS = EXPECTED[:-1]
STYLE = (
    "Hand-drawn 2D historical anime ONLY, strict TRUE BLACK-AND-WHITE neutral "
    "grayscale, vertical 9:16, historically plausible architecture, clothing, "
    "technology and geography. No sepia, tint, color, selective color, CGI, "
    "3D, photorealism, live-action, chibi, words, text, logos or watermark."
)
THUMB_STYLE = (
    "High-impact historical-disaster YouTube Shorts thumbnail, vertical 9:16. "
    "Full-color illustration permitted for this THUMBNAIL ONLY. Strong focal "
    "subject and dramatic readable composition, historically accurate visual "
    "details. Keep essential visual elements crop-safe. No false historical claims."
)

def text_field(scene, *names):
    if isinstance(scene, str):
        return scene.strip() if "visual" in names else ""
    if not isinstance(scene, dict):
        return ""
    for name in names:
        val = scene.get(name)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""

def slug(value):
    value = re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")
    return value[:70] or "episode"

def make_package(storyboard_path, approval_path, destination):
    storyboard_path = Path(storyboard_path)
    approval_path = Path(approval_path)
    destination = Path(destination)
    verified_sha = verify(storyboard_path, approval_path)
    approved = json.loads(approval_path.read_text(encoding="utf-8"))
    if approved.get("source") != "local-manual-approval":
        raise ValueError("Approval must originate from explicit storyboard approval")
    data = json.loads(storyboard_path.read_text(encoding="utf-8"))
    scenes = scene_map(data)
    additions = expansion(verified_sha)
    topic = (text_field(data, "topic", "title", "episode_topic")
             or approved.get("topic") or "Untitled disaster")
    if not isinstance(topic, str) or len(topic) > 240:
        raise ValueError("Invalid episode topic")
    scene_descriptions = {}
    for key in EXPECTED:
        scene = scenes[key]
        visual = text_field(scene, "visual", "image_prompt", "description", "prompt", "title")
        if len(visual) < 12:
            raise ValueError(f"{key}: visual description must be at least 12 characters")
        scene_descriptions[key] = visual
    # Neighboring scenes must not be literal duplicates. Flag near-duplicates
    # for the director without silently rewriting approved compositions.
    quality_warnings = []
    for left, right in zip(EXPECTED[:-2], EXPECTED[1:-1]):
        a = " ".join(scene_descriptions[left].lower().split())
        b = " ".join(scene_descriptions[right].lower().split())
        if a == b:
            raise ValueError(f"{left}/{right}: adjacent visuals must differ")
        from difflib import SequenceMatcher
        if SequenceMatcher(None, a, b).ratio() > 0.94:
            quality_warnings.append({"scene": right, "issue": f"Neighbor scene too visually similar in text to {left}; director should review"})
    # Complete validation before any output is written.
    if destination.exists() and any(destination.iterdir()):
        raise ValueError("Output folder must not contain existing files")
    destination.mkdir(parents=True, exist_ok=True)
    for folder in ("image_prompts", "flow_prompts", "narration"):
        (destination / folder).mkdir()
    gaps = quality_warnings
    for key in EXPECTED:
        item = scenes[key]
        visual = scene_descriptions[key]
        image_style = THUMB_STYLE if key == "THUMBNAIL" else STYLE
        image_prompt = (
            f"LIVING DISASTER BOOK — {topic} — {key}\n\n"
            f"IMAGE ONLY — STATIC REFERENCE STILL\n{image_style}\n\n"
            f"SPECIFIC DIRECTOR'S STORYBOARD VISUAL:\n{visual}\n\n"
            f"{IMAGE_NOTES.get(key, '') if additions else ''}\n\n"
            "This is a STILL IMAGE, not a video. Keep historical continuity "
            "and avoid repeating a neighboring panel's camera composition.\n"
        )
        (destination / "image_prompts" / f"{key}.txt").write_text(image_prompt, encoding="utf-8")
        if key in CLIPS:
            motion = text_field(item, "flow_prompt", "video_prompt", "motion_prompt", "motion")
            motion = motion or additions.get(key, {}).get("motion", "")
            if not motion:
                motion = (
                    "Preserve the approved storyboard composition. Use physically "
                    "plausible, subtle-to-strong continuous camera and environment "
                    "motion appropriate to the documented moment. Avoid inventing "
                    "specific casualties, movements or chronology."
                )
                gaps.append({"scene": key, "issue": "Flow motion derived from generic safety template; director motion not supplied"})
            flow = (
                f"LIVING DISASTER BOOK — {topic} — {key}\n\n"
                "VIDEO PROMPT — EXACTLY 10 SECONDS\n"
                f"{STYLE}\n"
                "ONE continuous cinematic shot, NO cuts, montage, split-screen, "
                "scene swaps, generated transitions or synthesized dialogue. "
                "NO voice, narration, spoken words, music or subtitles inside clip. "
                "Natural period-appropriate environment SFX only.\n\n"
                f"STORYBOARD COMPOSITION:\n{visual}\n\n"
                f"CAMERA & MOTION:\n{motion}\n"
            )
            (destination / "flow_prompts" / f"{key}.txt").write_text(flow, encoding="utf-8")
        if key != "THUMBNAIL":
            narration = text_field(item, "narration", "voiceover", "voice_over", "voice_over_text")
            narration = narration or additions.get(key, {}).get("narration", "")
            if not narration:
                gaps.append({"scene": key, "issue": "Narration not supplied; left blank, no historical facts fabricated"})
            (destination / "narration" / f"{key}.txt").write_text(narration + ("\n" if narration else ""), encoding="utf-8")
    # This audit reports what exists, never labels unrendered imagery complete.
    manifest = {
        "schema": "ldb-free-production-package-v1",
        "topic": topic,
        "slug": slug(topic),
        "storyboard_sha256": verified_sha,
        "approved_scene_count": 17,
        "approval_gate": "PASS",
        "package_status": "PROMPTS_ONLY",
        "actual_images_rendered": 0,
        "actual_videos_rendered": 0,
        "drive_uploaded": False,
        "free_only": True,
        "pending": [
            "Historical fact/chronology verification by a trusted reviewer",
            "Render 17 individual static images using an authorized image generation provider",
            "Externally render 16 ten-second clips in Flow if desired",
            "Inspect actual images and rendered clips before final release",
            "Upload actual assets and package to authorized Google Drive destination"
        ],
        "files_generated": {
            "image_prompts": 17,
            "flow_prompts": len(CLIPS),
            "narration_files": 16
        },
        "warnings": gaps,
    }
    manifest["production_expansion"] = {
        "applied": bool(additions), "bound_to_original_hash": verified_sha if additions else None,
        "sources": SOURCES if additions else [],
        "note": "Authored representative dramatization; characters are not identified historical witnesses. Narration duration is estimated, not recorded."
    }
    manifest["narration_nonempty"] = sum(bool(p.read_text().strip()) for p in (destination / "narration").glob("*.txt"))
    manifest["narration_timing"] = {
        p.stem: {"words": len(p.read_text().split()), "estimated_seconds_at_150_wpm": round(len(p.read_text().split()) / 2.5, 1)}
        for p in sorted((destination / "narration").glob("*.txt"))
    }
    (destination / "storyboard").mkdir()
    (destination / "storyboard" / "approved_storyboard.json").write_bytes(storyboard_path.read_bytes())
    (destination / "storyboard" / "approval.json").write_bytes(approval_path.read_bytes())
    if additions:
        # Server-only submission, authenticated by the runner's bearer credential.
        # Expansion does not change the original storyboard or its approval hash.
        render_scenes = []
        for key in EXPECTED:
            render_scenes.append({
                "id": key,
                "image_prompt": (destination / "image_prompts" / f"{key}.txt").read_text(encoding="utf-8"),
                "flow_prompt": (destination / "flow_prompts" / f"{key}.txt").read_text(encoding="utf-8") if key in CLIPS else "",
                "narration": (destination / "narration" / f"{key}.txt").read_text(encoding="utf-8") if key in CLIPS else ""
            })
        (destination / "render_job.json").write_text(json.dumps({
            "schema": "ldb-approved-render-job-v1",
            "storyboard_utf8": storyboard_path.read_text(encoding="utf-8"),
            "approval": approved,
            "render_scenes": render_scenes
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest["file_checksums_sha256"] = {
        p.relative_to(destination).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in sorted(destination.rglob("*")) if p.is_file()
    }
    (destination / "production_audit.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (destination / "README.txt").write_text(
        "LDB AUTO STUDIO — FREE PRODUCTION PROMPT PACKAGE\n\n"
        "PASS: approved 17-scene storyboard verified byte-for-byte.\n"
        "NOT COMPLETE: no images or videos were generated.\n"
        "No Drive upload or notification email was sent.\n"
        "Images: image_prompts/HOOK, P1-P14, ENDING, THUMBNAIL.\n"
        "Flow prompts: flow_prompts/HOOK, P1-P14 and ENDING, each exactly 10 seconds.\n"
        "Narration: narration/HOOK, P1-P14, ENDING. Empty files need manual content.\n"
        "Review production_audit.json before declaring final delivery.\n",
        encoding="utf-8"
    )
    return manifest


def make_package_from_bundle(bundle_path, destination):
    """Unpack one atomic submission locally and validate its original approval."""
    bundle_path = Path(bundle_path)
    if bundle_path.stat().st_size > 5_000_000:
        raise ValueError("Approved submission exceeds 5 MB")
    payload = json.loads(bundle_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or payload.get("schema") != "ldb-approved-bundle-v1":
        raise ValueError("Unsupported approved bundle schema")
    raw = payload.get("storyboard_utf8")
    approval = payload.get("approval")
    if not isinstance(raw, str) or not isinstance(approval, dict):
        raise ValueError("Bundle requires storyboard_utf8 text and approval object")
    if len(raw.encode("utf-8")) > 4_000_000:
        raise ValueError("Story text too long")
    if approval.get("source") != "local-manual-approval":
        raise ValueError("Only manually approved storyboards can be packaged")
    with tempfile.TemporaryDirectory(prefix="ldb-approved-") as folder:
        original = Path(folder) / "storyboard.json"
        approved = Path(folder) / "approval.json"
        original.write_bytes(raw.encode("utf-8"))
        approved.write_text(json.dumps(approval, ensure_ascii=False), encoding="utf-8")
        return make_package(original, approved, destination)


def main():
    if len(sys.argv) == 4 and sys.argv[1] == "--bundle":
        report = make_package_from_bundle(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 4:
        report = make_package(*sys.argv[1:])
    else:
        raise ValueError("Usage: python -m scripts.ldb_free_packager [--bundle bundle.json output | storyboard.json approval.json output]")
    print(json.dumps({"status": report["package_status"], "topic": report["topic"],
                      "approval_gate": report["approval_gate"], "warnings": len(report["warnings"])}))

if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, UnicodeError, json.JSONDecodeError) as exc:
        print("BLOCKED:", str(exc), file=sys.stderr)
        sys.exit(1)
