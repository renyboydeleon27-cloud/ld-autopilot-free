"""Offline contract tests for LDB delivery orchestration; no network or credentials.

Run: python -m unittest discover -s tests -p 'test_ldb_delivery_contract.py'
This is a contract fixture, not a wired production runner.
"""
import hashlib
import unittest
from dataclasses import dataclass, field


@dataclass
class DeliveryJob:
    approved: bool = False
    stopped: bool = False
    needs_review: bool = False
    images: dict = field(default_factory=dict)
    verified_drive: set = field(default_factory=set)
    sent_claims: set = field(default_factory=set)

    def save_image(self, index, payload, expected_sha256):
        if self.stopped or self.needs_review or not self.approved:
            raise ValueError('job not eligible')
        if not 0 <= index < 17 or hashlib.sha256(payload).hexdigest() != expected_sha256:
            self.needs_review = True
            raise ValueError('image invalid')
        self.images[index] = expected_sha256

    def claim_milestone(self, percentage, texts_complete=False, visual_approved=False):
        if self.stopped or self.needs_review or not self.approved:
            return False
        count = len(self.images)
        earned = {30: count >= 6, 50: count >= 12,
                  70: count == 17 and texts_complete and visual_approved,
                  100: count == 17 and texts_complete and visual_approved
                       and len(self.verified_drive) == 69}.get(percentage, False)
        if not earned or percentage in self.sent_claims:
            return False
        self.sent_claims.add(percentage)  # durable storage required in real adapter
        return True


class DeliveryContractTests(unittest.TestCase):
    def setUp(self):
        self.job = DeliveryJob(approved=True)

    def add_images(self, n):
        for i in range(n):
            data = f'image-{i}'.encode()
            self.job.save_image(i, data, hashlib.sha256(data).hexdigest())

    def test_milestone_thresholds_and_no_duplicate_claim(self):
        self.add_images(6)
        self.assertTrue(self.job.claim_milestone(30))
        self.assertFalse(self.job.claim_milestone(30))
        self.assertFalse(self.job.claim_milestone(50))

    def test_stop_blocks_claim(self):
        self.add_images(6)
        self.job.stopped = True
        self.assertFalse(self.job.claim_milestone(30))

    def test_corruption_blocks_resume_and_claim(self):
        with self.assertRaises(ValueError):
            self.job.save_image(0, b'bad', '0' * 64)
        self.assertTrue(self.job.needs_review)
        self.assertFalse(self.job.claim_milestone(30))

    def test_visual_review_required_even_with_all_images(self):
        self.add_images(17)
        self.assertFalse(self.job.claim_milestone(70, texts_complete=True))
        self.assertTrue(self.job.claim_milestone(70, texts_complete=True, visual_approved=True))

    def test_100_requires_all_69_verified(self):
        self.add_images(17)
        self.job.verified_drive = set(range(68))
        self.assertFalse(self.job.claim_milestone(100, True, True))
        self.job.verified_drive.add(68)
        self.assertTrue(self.job.claim_milestone(100, True, True))

    def test_unapproved_job_rejects_assets(self):
        self.job.approved = False
        with self.assertRaises(ValueError):
            self.job.save_image(0, b'a', hashlib.sha256(b'a').hexdigest())


if __name__ == '__main__':
    unittest.main()
