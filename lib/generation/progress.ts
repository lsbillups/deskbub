export type ProgressStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'uncertain' | 'paused';
export type ProgressItem = { id: string; label: string; status: ProgressStatus; phase?: string };
export type BatchProgress = { items: ProgressItem[] };
export type ProgressObserver = (progress: BatchProgress) => void;

export function progressCounts(progress: BatchProgress) {
  const completed = progress.items.filter(item => item.status === 'succeeded').length;
  const failed = progress.items.filter(item => item.status === 'failed').length;
  return { total: progress.items.length, completed, failed, unfinished: progress.items.length - completed - failed };
}
export function progressLabel(item: ProgressItem): string {
  if (item.status === 'succeeded') return 'Completed';
  if (item.status === 'failed') return 'Could not finish';
  if (item.status === 'uncertain') return 'Needs support review';
  if (item.status === 'paused') return 'Paused — progress saved';
  if (item.status === 'queued') return 'Queued';
  if (item.phase === 'key_ready' || item.phase?.startsWith('key_')) return 'Removing video background';
  if (item.phase === 'saving') return 'Saving video';
  return 'Generating video';
}
