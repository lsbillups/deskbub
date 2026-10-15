import { listGenerations } from '@/lib/generation/job-handlers';

export async function GET() { return listGenerations(); }
