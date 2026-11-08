// Fail-closed verification of a same-session, read-only Cloudflare usage report.
// The report is NOT proof that this account is on a Free plan; the operator
// must separately verify today's plan in the dashboard before inference.
const FRESHNESS_MS = 5 * 60 * 1000;
const FUTURE_SKEW_MS = 30 * 1000;

export function verifyOneHookUsageReport(report, {now=Date.now()}={}) {
  if (!report || report.inferenceCalled !== false) throw Error('READ_ONLY_USAGE_REPORT_REQUIRED');
  if (!Number.isFinite(now)) throw Error('CURRENT_TIME_NOT_VERIFIED');
  const timestamp = report.checkedAt;
  if (typeof timestamp !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)) {
    throw Error('FRESH_USAGE_REPORT_REQUIRED');
  }
  const checkedAt = Date.parse(timestamp);
  if (!Number.isFinite(checkedAt) || checkedAt < now - FRESHNESS_MS ||
    checkedAt > now + FUTURE_SKEW_MS) throw Error('FRESH_USAGE_REPORT_REQUIRED');
  if (report.workerListStatus !== 200 || !Array.isArray(report.v5) ||
    report.v5.length > 1 ||
    report.v5.some(worker=>worker?.id !== 'ner-ldb-runner-quality-v5')) {
    throw Error('WORKER_LIST_NOT_VERIFIED');
  }
  if (report.graphqlStatus !== 200 || (report.errors?.length ?? 0) > 0) {
    throw Error('GRAPHQL_SCHEMA_NOT_VERIFIED');
  }
  const usage = report.usage;
  const metric = usage?.metric;
  if (typeof metric !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(metric) || !/neuron/i.test(metric)) {
    throw Error('FREE_USAGE_METRIC_NOT_VERIFIED');
  }
  const accounts = usage?.data?.viewer?.accounts;
  const rows = accounts?.[0]?.aiInferenceAdaptiveGroups;
  if (usage.httpStatus !== 200 || (usage.errors?.length ?? 0) > 0 ||
    !Array.isArray(accounts) || accounts.length !== 1 ||
    !Array.isArray(rows) || rows.length !== 1) {
    throw Error('FREE_USAGE_NOT_VERIFIED');
  }
  const used = rows[0]?.sum?.[metric];
  // The daily 10k-neuron Free allowance and 1k buffer are conservative.
  // A self-asserted plan variable or old screenshot is never billing evidence.
  if (typeof used !== 'number' || !Number.isFinite(used) || used < 0 || used > 9000) {
    throw Error('FREE_USAGE_NOT_VERIFIED');
  }
  return {used, metric};
}
