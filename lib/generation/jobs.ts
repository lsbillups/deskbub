import { randomUUID } from 'node:crypto';
import { PetMediaService, MODELS, chromakeyInput, outputUrl } from './replicate';
import { downloadMedia, normalizeCutout, prepareGreenInput, preparePhotoInput, imageDataUri } from './media';

export type JobState = { phase: string; predictionId?: string; videoId?: string; transientErrors?: number };
export type Job = {
  id: string; user_id: string; kind: 'image' | 'video'; status: 'pending' | 'succeeded' | 'failed' | 'uncertain';
  payload: { imageUrl: string; prompt?: string; action_id?: string; action_index?: number; action_label?: string; catalog_version?: string; pet_type?: string };
  state: JobState; result: Record<string, unknown> | null;
};
export interface JobStore {
  read(userId: string, id: string): Promise<Job | null>;
  lease(userId: string, id: string, token: string): Promise<Job | null>;
  save(job: Job, token: string, release: boolean): Promise<Job>;
  upload(job: Job, bytes: Buffer, contentType: string): Promise<string>;
}
export type MediaProvider = Pick<PetMediaService, 'create' | 'get' | 'file'> & Partial<Pick<PetMediaService, 'probe'>>;

export function jobResponse(job: Job) {
  if (job.status === 'succeeded') return { status: 200, body: { success: true, jobId: job.id, ...job.result } };
  if (job.status === 'failed' || job.status === 'uncertain') return { status: 409, body: {
    jobId: job.id, status: job.status, error: job.status === 'uncertain'
      ? 'This generation needs support review before another attempt. Your saved task has been preserved.'
      : 'Processing failed. No automatic new generation was made.',
  } };
  return { status: 202, body: { jobId: job.id, status: 'processing', phase: job.state.phase, retryAfterMs: 5000 } };
}

// One resumable step per request. A persisted *_submitting phase without an ID
// is deliberately held for review rather than risking a second paid POST.
export async function advanceJob(store: JobStore, provider: MediaProvider, userId: string, id: string,
  images: { download: typeof downloadMedia; green: typeof prepareGreenInput; cutout: typeof normalizeCutout; photo: typeof preparePhotoInput } = {
    download: downloadMedia, green: prepareGreenInput, cutout: normalizeCutout, photo: preparePhotoInput,
  }) {
  const existing = await store.read(userId, id);
  if (!existing) return { status: 404, body: { error: 'This saved generation could not be found.' } };
  if (existing.status !== 'pending') return jobResponse(existing);
  const token = randomUUID(); let job = await store.lease(userId, id, token);
  if (!job) return jobResponse(existing);
  const save = async (release = false) => { job = await store.save(job!, token, release); };
  const stop = async (status: 'failed' | 'uncertain') => { job!.status = status; await save(true); };
  try {
    const phase = job.state.phase;
    if (phase.endsWith('_submitting')) {
      await stop('uncertain');
    } else if (phase === 'new' || phase === 'key_ready') {
      let version: string, input: Record<string, unknown>, next: string, cancel: string;
      if (phase === 'key_ready') {
        const source = await provider.get(job.state.videoId!);
        if (source.status !== 'succeeded') throw new Error('Source video is unavailable.');
        const url = outputUrl(source.output); await provider.probe?.(url);
        version = MODELS.chromakey; input = chromakeyInput(url); next = 'key'; cancel = '180s';
      } else if (job.kind === 'image') {
        const source = await imageDataUri(await images.photo(await images.download(job.payload.imageUrl)));
        version = MODELS.matting; input = { image: source, resolution: '' }; next = 'image'; cancel = '120s';
      } else {
        const green = await images.green(await images.download(job.payload.imageUrl));
        version = MODELS.video; input = { image: `data:image/png;base64,${green.toString('base64')}`,
          prompt: job.payload.prompt, duration: 5, resolution: '720p', fps: 24, seed: 73113, camera_fixed: true, aspect_ratio: '1:1', generate_audio: false };
        next = 'video'; cancel = '600s';
      }
      job.state = { ...job.state, phase: `${next}_submitting`, transientErrors: 0 }; await save();
      const prediction = await provider.create(version, input, cancel);
      if (!prediction.id) throw new Error('Submission has no prediction ID.');
      job.state = { ...job.state, phase: `${next}_running`, predictionId: prediction.id }; await save(true);
    } else if (phase.endsWith('_running') || phase === 'saving') {
      const prediction = await provider.get(job.state.predictionId!);
      if (['failed', 'canceled', 'aborted'].includes(prediction.status)) {
        await stop('failed');
      } else if (prediction.status !== 'succeeded') {
        job.state.transientErrors = 0; await save(true);
      } else if (phase === 'video_running') {
        job.state = { phase: 'key_ready', videoId: prediction.id }; await save(true);
      } else {
        job.state.phase = 'saving'; await save();
        const output = await provider.file(outputUrl(prediction.output));
        let bytes: Buffer, contentType: string;
        if (job.kind === 'image') { bytes = await images.cutout(output); contentType = 'image/png'; }
        else {
          if (!output.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) throw new Error('Invalid transparent-video container.');
          bytes = output; contentType = 'video/webm';
        }
        const url = await store.upload(job, bytes, contentType);
        job.result = job.kind === 'image' ? { processedUrl: url } : {
          videoUrl: url, actionId: job.payload.action_id, actionLabel: job.payload.action_label,
        };
        job.status = 'succeeded'; await save(true);
      }
    } else { await stop('uncertain'); }
  } catch {
    // POST may have reached the provider: never retry it, even after a timeout.
    if (job!.state.phase.endsWith('_submitting')) await stop('uncertain');
    else {
      job!.state.transientErrors = (job!.state.transientErrors || 0) + 1;
      if (job!.state.transientErrors >= 6) job!.status = 'uncertain';
      await save(true);
    }
  }
  return jobResponse(job!);
}
