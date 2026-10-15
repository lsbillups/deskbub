import { createAdminClient } from '@/lib/supabase/admin';
import type { Job, JobStore } from './jobs';

type DB = ReturnType<typeof createAdminClient>;
export class SupabaseJobStore implements JobStore {
  constructor(private db: DB) {}
  async read(userId: string, id: string): Promise<Job | null> {
    const { data, error } = await this.db.from('deskbub_animation_jobs').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) throw new Error('Saved generation unavailable.');
    return data as Job | null;
  }
  async start(userId: string, id: string, kind: Job['kind'], fingerprint: string, payload: Job['payload']): Promise<Job> {
    const { data, error } = await this.db.rpc('deskbub_start_generation', {
      p_user_id: userId, p_id: id, p_kind: kind, p_fingerprint: fingerprint, p_payload: payload,
    });
    if (error || !data) throw new Error('Generation could not be reserved. Check your remaining generations or contact support.');
    return data as Job;
  }
  async lease(userId: string, id: string, token: string): Promise<Job | null> {
    const { data, error } = await this.db.rpc('deskbub_lease_generation', { p_user_id: userId, p_id: id, p_token: token });
    if (error) throw new Error('Saved generation is temporarily unavailable.');
    return data as Job | null;
  }
  async startBatch(userId: string, requests: { id: string; fingerprint: string; payload: Job['payload'] }[]): Promise<Job[]> {
    const { data, error } = await this.db.rpc('deskbub_start_animation_batch', { p_user_id: userId, p_requests: requests });
    if (error || !data) throw new Error('The selected actions could not be reserved. Check your remaining generations.');
    return data as Job[];
  }
  async save(job: Job, token: string, release: boolean): Promise<Job> {
    const { data, error } = await this.db.rpc('deskbub_save_generation', {
      p_user_id: job.user_id, p_id: job.id, p_token: token, p_state: job.state,
      p_status: job.status, p_result: job.result, p_release: release,
    });
    if (error || !data) throw new Error('Generation progress could not be saved.');
    return data as Job;
  }
  async upload(job: Job, bytes: Buffer, contentType: string): Promise<string> {
    const filename = job.kind === 'image' ? `processed/${job.user_id}/${job.id}.png` : `videos/${job.user_id}/${job.id}.webm`;
    // Same job writes the same location after interrupted delivery; it never consumes
    // another generation or creates a second paid model request.
    const { error } = await this.db.storage.from('pet-photos').upload(filename, bytes, { contentType, upsert: true });
    if (error) throw new Error('Generated file could not be saved.');
    const { data } = this.db.storage.from('pet-photos').getPublicUrl(filename);
    return data.publicUrl;
  }
}
