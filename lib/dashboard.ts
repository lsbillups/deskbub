export const CUSTOM_WORKSPACE = '/custom-desktop-pet#custom-create';
type SavedVideo = { url: string; label?: string };
type SavedJob = { kind: string; status: string; created_at: string; payload?: { imageUrl?: string; action_label?: string };
  result?: { processedUrl?: string; videoUrl?: string; actionLabel?: string } | null };
export type PetVideo = { url: string; downloadUrl: string; label: string; createdAt: string | null; photoUrl: string | null;
  status: 'confirmed' | 'draft' | 'unselected' };
export type PetDashboard = { tier: string; used: number; max: number; pairingCode: string; finalized: boolean;
  activeTasks: number; reviewTasks: number; failedTasks: number; hasProcessedPhotos: boolean; videos: PetVideo[]; staging: boolean; truncated: boolean };

export function buildPetDashboard(input: { subscription: { tier: string; generations_used: number; max_generations: number };
  collection: { status: string; videos: SavedVideo[] } | null; jobs: SavedJob[]; legacy: { video_url: string; action_label?: string }[];
  pairingCode: string; storageOrigin: string; staging: boolean; truncated: boolean }): PetDashboard {
  const { subscription: sub, collection, jobs } = input;
  if (!['free', 'basic', 'plus'].includes(sub.tier) || !Number.isSafeInteger(sub.generations_used) || !Number.isSafeInteger(sub.max_generations) ||
      sub.generations_used < 0 || sub.max_generations < sub.generations_used || !/^\d{6}$/.test(input.pairingCode)) throw new Error('Invalid account data');
  function media(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      const local = input.staging && ['http://127.0.0.1:54321', 'http://127.0.0.1:15421'].includes(url.origin);
      return url.origin === input.storageOrigin && (url.protocol === 'https:' || local) && !url.username && !url.password &&
        url.pathname.startsWith('/storage/v1/object/public/pet-photos/') ? url.href : null;
    } catch { return null; }
  }
  const selected = collection?.videos || input.legacy.map(v => ({ url: v.video_url, label: v.action_label }));
  const finalized = collection ? collection.status === 'finalized' : selected.length > 0;
  const selectedUrls = new Set(selected.map(v => v.url));
  const originals = new Map(jobs.filter(j => j.kind === 'image' && j.status === 'succeeded').map(j => [j.result?.processedUrl, media(j.payload?.imageUrl)]));
  const videos = new Map<string, PetVideo>();
  const add = (value: string, label: string | undefined, job?: SavedJob) => {
    const url = media(value); if (!url) return;
    const download = new URL(url); download.searchParams.set('download', 'deskbub-pet.webm');
    videos.set(url, { url, downloadUrl: download.href, label: label || 'Pet animation',
      createdAt: job && Number.isFinite(Date.parse(job.created_at)) ? job.created_at : null,
      photoUrl: originals.get(job?.payload?.imageUrl) || null,
      status: finalized ? selectedUrls.has(url) ? 'confirmed' : 'unselected' : 'draft' });
  };
  // Confirmed selection remains authoritative; older candidates stay unselected.
  for (const item of selected) add(item.url, item.label);
  for (const job of jobs) if (job.kind === 'video' && job.status === 'succeeded' && job.result?.videoUrl) {
    const selectedVideo = selected.find(v => v.url === job.result!.videoUrl);
    add(job.result.videoUrl, selectedVideo?.label || job.result.actionLabel || job.payload?.action_label, job);
  }
  const rank = { confirmed: 0, draft: 1, unselected: 2 };
  return { tier: sub.tier, used: sub.generations_used, max: sub.max_generations, pairingCode: input.pairingCode, finalized,
    videos: [...videos.values()].sort((a, b) => rank[a.status] - rank[b.status]),
    activeTasks: jobs.filter(j => j.status === 'pending').length, reviewTasks: jobs.filter(j => j.status === 'uncertain').length,
    failedTasks: jobs.filter(j => j.status === 'failed').length,
    hasProcessedPhotos: jobs.some(j => j.kind === 'image' && j.status === 'succeeded'), staging: input.staging, truncated: input.truncated };
}
