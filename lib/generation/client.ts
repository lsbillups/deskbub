import type { ProgressItem, ProgressObserver, ProgressStatus } from './progress';

type Result = { jobId: string; processedUrl?: string; videoUrl?: string; actionLabel?: string; success?: boolean };
type SavedRequest = { id: string; endpoint: string; body: Record<string, unknown>; done: boolean; result?: Result; serverKnown?: boolean; batchPending?: boolean };
type RemoteJob = { id: string; kind: 'image' | 'video'; status?: string; phase?: string; requestBody?: Record<string, unknown> };
type VideoSummary = { id: string; status: string; phase?: string; actionLabel?: string; imageUrl?: string };
const KEY = 'deskbub-generation-requests-v1';
const inFlight = new Map<string, Promise<Result>>();
const signature = (body: Record<string, unknown>) => JSON.stringify([body.imageUrl, body.actionId || 'image', body.actionCatalogVersion || '']);

class SavedTaskError extends Error {
  constructor(message: string, readonly state: ProgressStatus = 'paused') { super(message); }
}
function savedRequests(): SavedRequest[] {
  try { const value = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function save(record: SavedRequest) {
  const records = savedRequests().filter(r => r.id !== record.id);
  const pending = records.filter(r => !r.done), done = records.filter(r => r.done).slice(-40);
  sessionStorage.setItem(KEY, JSON.stringify([...done, ...pending, record]));
}
async function drive(record: SavedRequest, onPhase?: (phase?: string) => void): Promise<Result> {
  const start = Date.now(); let started = record.serverKnown || false;
  while (Date.now() - start < 12 * 60_000) {
    const response = await fetch(started ? `/api/generation-jobs/${record.id}` : record.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(started ? {} : { ...record.body, requestId: record.id }),
    });
    const data = await response.json();
    if (response.status === 202) {
      started = true; record.serverKnown = true; save(record); onPhase?.(data.phase);
      await new Promise(resolve => setTimeout(resolve, 5000)); continue;
    }
    if (!response.ok || !data.success) {
      const state = data.status === 'failed' ? 'failed' : data.status === 'uncertain' ? 'uncertain' : 'paused';
      if (state === 'failed') { record.done = true; save(record); }
      throw new SavedTaskError(data.error || 'Your saved task could not finish. Resume it instead of generating again.', state);
    }
    record.done = true; record.result = data; save(record); return data as Result;
  }
  throw new SavedTaskError('This task is taking longer than expected. Its progress is saved; resume the same task below.');
}
function run(record: SavedRequest, onPhase?: (phase?: string) => void): Promise<Result> {
  const existing = inFlight.get(record.id); if (existing) return existing;
  const result = drive(record, onPhase).finally(() => inFlight.delete(record.id));
  inFlight.set(record.id, result); return result;
}
function observer(items: ProgressItem[], onProgress?: ProgressObserver) {
  return () => onProgress?.({ items: items.map(item => ({ ...item })) });
}
function itemFor(record: SavedRequest): ProgressItem {
  return { id: record.id, label: String(record.body.actionLabel || record.body.actionId || 'Pet animation'), status: 'queued' };
}
async function finishVideo(record: SavedRequest, item: ProgressItem, notify: () => void, complete: (result: Result) => Promise<void>) {
  item.status = 'running'; notify();
  try {
    const result = await run(record, phase => { item.phase = phase; notify(); });
    item.status = 'succeeded'; notify(); await complete(result);
  } catch (error) {
    item.status = error instanceof SavedTaskError ? error.state : 'paused'; notify(); throw error;
  }
}

export function runGeneration(endpoint: string, body: Record<string, unknown>): Promise<Result> {
  const identity = signature(body);
  let record = savedRequests().find(r => r.endpoint === endpoint && signature(r.body) === identity);
  if (!record) { record = { id: crypto.randomUUID(), endpoint, body, done: false }; save(record); }
  return run(record);
}

export async function runVideoBatch(bodies: Record<string, unknown>[], onComplete: (result: Result) => Promise<void>, onProgress?: ProgressObserver) {
  const records = bodies.map(body => {
    const existing = savedRequests().find(r => r.endpoint === '/api/generate-video' && signature(r.body) === signature(body));
    const record: SavedRequest = existing || { id: crypto.randomUUID(), endpoint: '/api/generate-video', body, done: false, batchPending: true };
    save(record); return record;
  });
  const items = records.map(itemFor), notify = observer(items, onProgress); notify();
  let response: Response;
  try {
    response = await fetch('/api/generate-video/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: records.map(r => ({ ...r.body, requestId: r.id })) }) });
  } catch (error) {
    for (const item of items) item.status = 'paused'; notify(); throw error;
  }
  const data = await response.json();
  if (!response.ok) {
    for (const item of items) item.status = 'failed'; notify();
    throw new Error(data.error || 'Your selected actions could not be saved.');
  }
  for (const record of records) { record.serverKnown = true; record.batchPending = false; save(record); }
  const errors: string[] = [];
  for (const record of records) {
    try { await finishVideo(record, items.find(i => i.id === record.id)!, notify, onComplete); }
    catch (error) { errors.push(error instanceof Error ? error.message : 'A saved action could not finish.'); }
  }
  if (errors.length) throw new Error(errors[0]);
}

export async function resumePendingGenerations(onRecovered?: (item: { endpoint: string; result: Result }) => Promise<void>, onProgress?: ProgressObserver) {
  const response = await fetch('/api/generation-jobs', { cache: 'no-store' });
  if (!response.ok) throw new Error('Saved generations could not be loaded. Resume the saved tasks below.');
  const remote = await response.json() as { jobs?: RemoteJob[]; videoJobs?: VideoSummary[]; usedImageUrls?: string[] };
  for (const job of remote.jobs || []) {
    const existing = savedRequests().find(r => r.id === job.id);
    save({ id: job.id, endpoint: job.kind === 'image' ? '/api/generate-pet' : '/api/generate-video',
      body: existing?.body || job.requestBody || {}, done: false, serverKnown: true });
  }
  // Server inventory is authoritative for the signed-in account. A previous
  // account's sessionStorage must never be driven or shown in this account.
  const remoteIds = new Set((remote.jobs || []).map(job => job.id));
  const records = savedRequests().filter(r => remoteIds.has(r.id) && !r.done && !r.batchPending);
  const videoRecords = records.filter(r => r.endpoint === '/api/generate-video');
  const items: ProgressItem[] = videoRecords.length ? (remote.videoJobs || []).map(job => ({
    id: job.id, label: job.actionLabel || 'Pet animation', phase: job.phase,
    status: job.status === 'succeeded' ? 'succeeded' : job.status === 'failed' ? 'failed' : job.status === 'uncertain' ? 'uncertain' : job.phase === 'new' ? 'queued' : 'running',
  })) : [];
  for (const record of videoRecords) if (!items.some(item => item.id === record.id)) items.push(itemFor(record));
  const notify = observer(items, onProgress); notify();
  const usedImages = new Set([...(remote.usedImageUrls || []), ...videoRecords.map(r => String(r.body.imageUrl || ''))]);
  const results: { endpoint: string; result: Result }[] = [], errors: string[] = [];
  for (const record of records) {
    try {
      const complete = async (result: Result) => {
        if (record.endpoint === '/api/generate-pet' && result.processedUrl && usedImages.has(result.processedUrl)) return;
        const item = { endpoint: record.endpoint, result }; results.push(item); await onRecovered?.(item);
      };
      if (record.endpoint === '/api/generate-video') await finishVideo(record, items.find(i => i.id === record.id)!, notify, complete);
      else await complete(await run(record));
    } catch (error) { errors.push(error instanceof Error ? error.message : 'Saved task could not be resumed.'); }
  }
  if (errors.length) throw new Error(errors[0]); return results;
}

export async function acknowledgeGeneration(id: string) {
  const response = await fetch(`/api/generation-jobs/${id}?ack=1`, { method: 'POST' });
  if (!response.ok) throw new Error('Your output is saved. Its delivery confirmation will resume with the same task.');
}
