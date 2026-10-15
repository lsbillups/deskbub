import { downloadMedia, replicateMediaUrl } from './media';

export const MODELS = {
  matting: 'f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7',
  video: '78c1986fecf4df185593bbf148a0ed5b4b18b7e0e0f34cc3e32c68cdfa9536ba',
  chromakey: 'efd0b79b577bcd58ae7d035bce9de5c4659a59e09faafac4d426d61c04249251',
} as const;
export type Prediction = { id: string; status: string; output?: unknown };

export function outputUrl(output: unknown): string {
  if (typeof output === 'string') return replicateMediaUrl(output);
  if (Array.isArray(output)) return outputUrl(output[0]);
  if (output && typeof output === 'object' && 'files' in output) return outputUrl(output.files);
  throw new Error('The media service did not return a usable file.');
}

export function chromakeyInput(url: string) {
  const source = replicateMediaUrl(url);
  const filter = 'format=yuva444p,chromakey=0x12fd10:similarity=0.18:blend=0.08,format=rgba,despill=type=green:mix=0.5:expand=0.05';
  return {
    command: `ffmpeg -y -i "${source}" -an -vf "${filter}" -c:v libvpx-vp9 -pix_fmt yuva420p -crf 25 -b:v 0 -auto-alt-ref 0 -deadline good -cpu-used 4 -threads 2 output.webm`,
    output1: 'output.webm',
  };
}

export class PetMediaService {
  constructor(private token: string, private fetcher: typeof fetch = fetch,
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))) {}

  private async api(path: string, options: RequestInit = {}): Promise<Prediction> {
    const response = await this.fetcher(`https://api.replicate.com/v1${path}`, {
      ...options, headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json', ...options.headers },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error('The media service could not complete the request. No automatic retry was made.');
    return response.json();
  }

  create(version: string, input: Record<string, unknown>, cancelAfter: string): Promise<Prediction> {
    return this.api('/predictions', { method: 'POST', headers: { 'Cancel-After': cancelAfter }, body: JSON.stringify({ version, input }) });
  }

  get(id: string): Promise<Prediction> { return this.api(`/predictions/${encodeURIComponent(id)}`); }

  file(url: string): Promise<Buffer> { return downloadMedia(replicateMediaUrl(url), this.token, this.fetcher); }

  async probe(url: string): Promise<void> {
    const response = await this.fetcher(replicateMediaUrl(url), {
      method: 'HEAD', headers: { Authorization: `Bearer ${this.token}` }, redirect: 'error', signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('The source video is temporarily unavailable.');
  }

}
