"""Offline restart-recovery simulation; not a deployed Cloudflare worker.

Run: python -m unittest discover -s tests -p 'test_ldb_restart_recovery.py' -v
"""
import hashlib
import json
import unittest


def digest(data):
    return hashlib.sha256(data).hexdigest()


def checkpoint(state):
    return json.dumps(state, sort_keys=True)


def recover(serialized, immutable_plan):
    state = json.loads(serialized)
    if state['job_id'] != immutable_plan['job_id']:
        raise ValueError('wrong job')
    if state['plan_sha256'] != digest(json.dumps(immutable_plan, sort_keys=True).encode()):
        raise ValueError('plan changed')
    if not set(state['verified']).issubset(set(immutable_plan['assets'])):
        raise ValueError('unknown asset')
    if state['status'] not in ('RUNNING', 'STOPPED', 'NEEDS_REVIEW'):
        raise ValueError('invalid status')
    return state


class RestartRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.plan = {'job_id': 'lake-nyos-test', 'assets': [f'asset-{i:02d}' for i in range(69)]}
        self.state = {'job_id': self.plan['job_id'],
                      'plan_sha256': digest(json.dumps(self.plan, sort_keys=True).encode()),
                      'verified': self.plan['assets'][:30], 'status': 'RUNNING',
                      'mail_claims': ['30']}

    def test_restart_retains_verified_assets_and_claims(self):
        restored = recover(checkpoint(self.state), self.plan)
        self.assertEqual(len(restored['verified']), 30)
        self.assertEqual(restored['mail_claims'], ['30'])
        self.assertEqual(len(set(restored['verified'])), 30)

    def test_stop_survives_restart(self):
        self.state['status'] = 'STOPPED'
        self.assertEqual(recover(checkpoint(self.state), self.plan)['status'], 'STOPPED')

    def test_review_block_survives_restart(self):
        self.state['status'] = 'NEEDS_REVIEW'
        self.assertEqual(recover(checkpoint(self.state), self.plan)['status'], 'NEEDS_REVIEW')

    def test_changed_plan_rejected(self):
        changed = dict(self.plan, assets=self.plan['assets'][:-1])
        with self.assertRaises(ValueError):
            recover(checkpoint(self.state), changed)

    def test_unknown_asset_rejected(self):
        self.state['verified'].append('foreign-file')
        with self.assertRaises(ValueError):
            recover(checkpoint(self.state), self.plan)

    def test_wrong_job_rejected(self):
        self.state['job_id'] = 'other-job'
        with self.assertRaises(ValueError):
            recover(checkpoint(self.state), self.plan)


if __name__ == '__main__':
    unittest.main()
