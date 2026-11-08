// Pure validation of a fresh, read-only Cloudflare usage report.
// This only authorizes the next *preflight step*, not payment or inference.
export function verifyOneHookUsageReport(report) {
  if (!report || report.inferenceCalled !== false) throw Error('READ_ONLY_USAGE_REPORT_REQUIRED');
  if (report.workerListStatus !== 200 || !Array.isArray(report.v5)) throw Error('WORKER_LIST_NOT_VERIFIED');

  const usage = report.usage;
  const metric = usage?.metric;
  if (typeof metric !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(metric) || !/neuron/i.test(metric)) {
    throw Error('FREE_USAGE_METRIC_NOT_VERIFIED');
  }
  const accounts = usage?.data?.viewer?.accounts;
  const rows = accounts?.[0]?.aiInferenceAdaptiveGroups;
  if (usage.httpStatus !== 200 || (usage.errors?.length ?? 0) > 0 || !Array.isArray(accounts) || accounts.length !== 1 || !Array.isArray(rows) || rows.length !== 1) {
    throw Error('FREE_USAGE_NOT_VERIFIED');
  }
  const used = rows[0]?.sum?.[metric];
  // The daily 10k-neuron Free allowance and buffer are intentionally conservative.
  // A self-asserted plan setting is not proof of current billing eligibility.
  if (typeof used !== 'number' || !Number.isFinite(used) || used < 0 || used > 9000) {
    throw Error('FREE_USAGE_NOT_VERIFIED');
  }
  return {used, metric};
}
