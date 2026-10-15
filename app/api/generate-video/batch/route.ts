import { startVideoBatch } from '@/lib/generation/job-handlers';
export const runtime = 'nodejs';
export const maxDuration = 60;
export const POST = startVideoBatch;
