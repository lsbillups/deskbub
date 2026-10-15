import { startGeneration } from '@/lib/generation/job-handlers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  return startGeneration(request, 'image');
}
