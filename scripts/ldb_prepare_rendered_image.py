"""Persist a corrected render and its audit, without granting visual approval.

The source checkpoint and original image remain unchanged. No network calls.
"""
import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path
from scripts.ldb_image_quality import normalize_image, MAX_BYTES


def prepare_rendered_image(source, checkpoint, destination):
    source, destination = Path(source), Path(destination)
    if destination.exists():
        raise ValueError('DESTINATION_ALREADY_EXISTS')
    record = checkpoint.get('output', {})
    if (checkpoint.get('status') != 'HOOK_CLOUD_TEST_PASSED'
            or checkpoint.get('completedScenes') != 1
            or checkpoint.get('checkpointStatus') != 'TEST_PAUSED'
            or record.get('scene') != 'HOOK'):
        raise ValueError('EXPECTED_PAUSED_HOOK_CHECKPOINT')
    job = checkpoint.get('storyboard_sha256', '')
    if len(job) != 64 or any(c not in '0123456789abcdef' for c in job):
        raise ValueError('INVALID_APPROVAL_HASH')
    with source.open('rb') as stream:
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) != record.get('bytes') or hashlib.sha256(raw).hexdigest() != record.get('sha256'):
        raise ValueError('SOURCE_CHECKPOINT_MISMATCH')
    output, audit = normalize_image(raw, 'HOOK')
    report = {'schema': 'ldb-prepared-render-v1', 'jobId': job,
              'scene': 'HOOK', 'filename': 'HOOK.png', 'audit': audit,
              'visual_check': 'PENDING', 'delivery_ready': False}
    destination.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.ldb-preparing-', dir=destination.parent))
    try:
        (staging / 'HOOK.png').write_bytes(output)
        (staging / 'audit.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        # mkdir reserves the output path exclusively, preventing overwrite on retry.
        destination.mkdir()
        try:
            for name in ('HOOK.png', 'audit.json'):
                (staging / name).replace(destination / name)
            (destination / 'READY').write_text(audit['sha256'] + '\n', encoding='ascii')
        except BaseException:
            shutil.rmtree(destination)
            raise
    finally:
        shutil.rmtree(staging)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--checkpoint', required=True, type=Path)
    parser.add_argument('--destination', required=True, type=Path)
    args = parser.parse_args()
    checkpoint = json.loads(args.checkpoint.read_text(encoding='utf-8'))
    print(json.dumps(prepare_rendered_image(args.source, checkpoint, args.destination), indent=2))


if __name__ == '__main__':
    main()
