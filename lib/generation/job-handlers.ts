import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { createAdminClient } from '@/lib/supabase/admin';
import { screenPrompt } from '@/lib/creem/moderation';
import { ACTION_CATALOG_VERSION, getAction } from './actions';
import { storageImageUrl } from './media';
import { advanceJob, jobResponse, type Job } from './jobs';
import { SupabaseJobStore } from './job-store';
import { PetMediaService } from './replicate';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class InvalidGeneration extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
async function generationPayload(body: Record<string, unknown>, kind: Job['kind'], userId: string): Promise<Job['payload']> {
  if (typeof body.requestId !== 'string' || !uuid.test(body.requestId)) throw new InvalidGeneration('Please refresh the page before generating.', 400);
  let imageUrl: string;
  try { imageUrl = storageImageUrl(body.imageUrl); }
  catch { throw new InvalidGeneration('Please use a photo uploaded to DeskBub.', 400); }
  const payload: Job['payload'] = { imageUrl };
  const folder = kind === 'image' ? 'original' : 'processed';
  if (!new URL(imageUrl).pathname.startsWith(`/storage/v1/object/public/pet-photos/${folder}/${userId}/`)) {
    throw new InvalidGeneration('Please upload and process your photo again.', 400);
  }
  if (kind === 'video') {
    const action = getAction(body.petType, body.action);
    if (!action || action.id !== body.actionId || body.actionCatalogVersion !== ACTION_CATALOG_VERSION) {
      throw new InvalidGeneration('The action list has changed. Refresh the page and select your action again.', 409);
    }
    Object.assign(payload, { prompt: action.prompt, action_id: action.id, action_index: action.index, action_label: action.label,
      catalog_version: ACTION_CATALOG_VERSION, pet_type: body.petType });
    const moderation = await screenPrompt(action.prompt, userId);
    if (!moderation.passed) throw new InvalidGeneration(moderation.error || 'Content rejected.', 400);
  }
  return payload;
}

export async function startGeneration(request: Request, kind: Job['kind']) {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    const body = await request.json();
    const payload = await generationPayload(body, kind, account.userId);
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return NextResponse.json({ error: 'Pet generation is temporarily unavailable.' }, { status: 503 });
    const store = new SupabaseJobStore(createAdminClient());
    const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    let job: Job;
    try { job = await store.start(account.userId, body.requestId, kind, fingerprint, payload); }
    catch { return NextResponse.json({ error: 'This generation could not be reserved. Check your available generations or contact support.' }, { status: 409 }); }
    // Return the persisted ID before any paid step; a lost response can safely be
    // repeated with the same requestId. Processing is driven by the resume route.
    const response = jobResponse(job);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    if (error instanceof InvalidGeneration) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'The request could not be saved. Your existing tasks are preserved.' }, { status: 503 });
  }
}

export async function startVideoBatch(request: Request) {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    const { requests } = await request.json();
    if (!Array.isArray(requests) || requests.length < 1 || requests.length > 5 ||
        new Set(requests.map(r => r.requestId)).size !== requests.length) {
      return NextResponse.json({ error: 'Choose between one and five actions.' }, { status: 400 });
    }
    const prepared = [];
    for (const body of requests) {
      const payload = await generationPayload(body, 'video', account.userId);
      prepared.push({ id: body.requestId, payload, fingerprint: createHash('sha256').update(JSON.stringify(payload)).digest('hex') });
    }
    if (!process.env.REPLICATE_API_TOKEN) return NextResponse.json({ error: 'Pet generation is temporarily unavailable.' }, { status: 503 });
    let jobs;
    try { jobs = await new SupabaseJobStore(createAdminClient()).startBatch(account.userId, prepared); }
    catch { return NextResponse.json({ error: 'Your actions could not be reserved. Check your remaining generations or saved selection.' }, { status: 409 }); }
    return NextResponse.json({ success: true, jobs: jobs.map(j => ({ id: j.id, status: j.status })) });
  } catch (error) {
    if (error instanceof InvalidGeneration) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Your selected actions could not be saved. Please refresh to check saved tasks.' }, { status: 503 });
  }
}

export async function continueGeneration(id: string, acknowledge = false) {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    if (!uuid.test(id)) return NextResponse.json({ error: 'Generation not found.' }, { status: 404 });
    const db = createAdminClient();
    if (acknowledge) {
      const { data, error } = await db.from('deskbub_animation_jobs').update({ acknowledged_at: new Date().toISOString() })
        .eq('id', id).eq('user_id', account.userId).eq('status', 'succeeded').select('id').maybeSingle();
      if (error || !data) return NextResponse.json({ error: 'Output confirmation is unavailable.' }, { status: 409 });
      return NextResponse.json({ success: true });
    }
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return NextResponse.json({ error: 'Pet generation is temporarily unavailable.' }, { status: 503 });
    const store = new SupabaseJobStore(db);
    const result = await advanceJob(store, new PetMediaService(token), account.userId, id);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'Progress could not be retrieved. Your saved generation is preserved; resume it instead of starting another.' }, { status: 503 });
  }
}

export async function listGenerations() {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    const { data, error } = await createAdminClient().from('deskbub_animation_jobs').select('id,kind,payload')
      .eq('user_id', account.userId).or('status.eq.pending,status.eq.uncertain,and(status.eq.succeeded,acknowledged_at.is.null)')
      .order('created_at', { ascending: true }).limit(50);
    if (error) throw new Error('Jobs unavailable');
    return NextResponse.json({ jobs: (data || []).map((job) => ({ id: job.id, kind: job.kind,
      requestBody: job.kind === 'image' ? { imageUrl: job.payload.imageUrl } : {
        imageUrl: job.payload.imageUrl, petType: job.payload.pet_type, action: job.payload.action_index,
        actionId: job.payload.action_id, actionLabel: job.payload.action_label, actionCatalogVersion: job.payload.catalog_version,
      },
    })) });
  } catch { return NextResponse.json({ error: 'Saved generations are temporarily unavailable.' }, { status: 503 }); }
}
