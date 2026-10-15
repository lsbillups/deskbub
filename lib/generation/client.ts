type Result = { jobId: string; processedUrl?: string; videoUrl?: string; actionLabel?: string; success?: boolean };
type SavedRequest = { id: string; endpoint: string; body: Record<string, unknown>; done: boolean; result?: Result; serverKnown?: boolean; batchPending?: boolean };
const KEY = 'deskbub-generation-requests-v1';
const inFlight = new Map<string, Promise<Result>>();
const signature = (body: Record<string, unknown>) => JSON.stringify([body.imageUrl, body.actionId || 'image', body.actionCatalogVersion || '']);

function savedRequests(): SavedRequest[] {
  try { const value = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function save(record: SavedRequest) {
  const records = savedRequests().filter((r) => r.id !== record.id);
  // Never discard pending tasks; retain a bounded recent completed history.
  const pending = records.filter((r) => !r.done), done = records.filter((r) => r.done).slice(-40);
  sessionStorage.setItem(KEY, JSON.stringify([...done, ...pending, record]));
}

async function drive(record: SavedRequest): Promise<Result> {
  const start = Date.now(); let started = record.serverKnown || false;
  while (Date.now() - start < 12 * 60_000) {
    const response = await fetch(started ? `/api/generation-jobs/${record.id}` : record.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(started ? {} : { ...record.body, requestId: record.id }),
    });
    const data = await response.json();
    if (response.status === 202) {
      started = true;
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }
    if (!response.ok || !data.success) throw new Error(data.error || 'Generation could not finish. Your saved task is preserved.');
    record.done = true; record.result = data; save(record);
    return data as Result;
  }
  throw new Error('This task is still saved. Refresh the page to resume it without starting another generation.');
}

function run(record: SavedRequest): Promise<Result> {
  const existing = inFlight.get(record.id);
  if (existing) return existing;
  const result = drive(record).finally(() => inFlight.delete(record.id));
  inFlight.set(record.id, result); return result;
}

export function runGeneration(endpoint: string, body: Record<string, unknown>): Promise<Result> {
  const identity = signature(body);
  let record = savedRequests().find((r) => r.endpoint === endpoint && signature(r.body) === identity);
  if (!record) { record = { id: crypto.randomUUID(), endpoint, body, done: false }; save(record); }
  return run(record);
}

export async function runVideoBatch(bodies: Record<string, unknown>[], onComplete: (result: Result) => Promise<void>) {
  const records = bodies.map(body => {
    const existing = savedRequests().find(r => r.endpoint === '/api/generate-video' && signature(r.body) === signature(body));
    const record: SavedRequest = existing || { id: crypto.randomUUID(), endpoint: '/api/generate-video', body, done: false, batchPending: true };
    save(record); return record;
  });
  const response = await fetch('/api/generate-video/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: records.map(r => ({ ...r.body, requestId: r.id })) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Your selected actions could not be saved.');
  for (const record of records) { record.serverKnown = true; record.batchPending = false; save(record); }
  const errors: string[] = [];
  for (const record of records) {
    try { await onComplete(await run(record)); }
    catch (error) { errors.push(error instanceof Error ? error.message : 'A saved action could not finish.'); }
  }
  if (errors.length) throw new Error(errors[0]);
}

export async function resumePendingGenerations(onRecovered?: (item: { endpoint: string; result: Result }) => Promise<void>) {
  // Restore from the account even when a tab was closed and sessionStorage is gone.
  const response = await fetch('/api/generation-jobs');
  if (!response.ok) throw new Error('Saved generations could not be loaded. Please refresh to resume them.');
  const remote = await response.json();
  for (const job of remote.jobs || []) {
    const existing = savedRequests().find((r) => r.id === job.id);
    save({ id: job.id, endpoint: job.kind === 'image' ? '/api/generate-pet' : '/api/generate-video',
      body: existing?.body || job.requestBody || {}, done: false, serverKnown: true });
  }
  const results: { endpoint: string; result: Result }[] = [];
  const errors: string[] = [];
  for (const record of savedRequests().filter((r) => !r.done && !r.batchPending)) {
    try {
      const item = { endpoint: record.endpoint, result: await run(record) };
      results.push(item); await onRecovered?.(item);
    } catch (error) { errors.push(error instanceof Error ? error.message : 'Saved task could not be resumed.'); }
  }
  if (errors.length) throw new Error(errors[0]);
  return results;
}

export async function acknowledgeGeneration(id: string) {
  const response = await fetch(`/api/generation-jobs/${id}?ack=1`, { method: 'POST' });
  if (!response.ok) throw new Error('Your output is saved. Its delivery confirmation will resume on refresh.');
}
