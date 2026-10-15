import { continueGeneration } from '@/lib/generation/job-handlers';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return continueGeneration(id, new URL(request.url).searchParams.get('ack') === '1');
}
