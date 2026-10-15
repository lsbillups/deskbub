import sharp from 'sharp';

export function isLocalSandboxStorage(url: URL): boolean {
  return process.env.VERCEL_ENV !== 'production' && process.env.DESKBUB_DATA_ENVIRONMENT === 'sandbox' &&
    url.origin === process.env.NEXT_PUBLIC_SUPABASE_URL && url.origin === process.env.DESKBUB_SANDBOX_SUPABASE_URL &&
    url.origin !== process.env.DESKBUB_PRODUCTION_SUPABASE_URL && url.origin === 'http://127.0.0.1:54321';
}

export async function imageDataUri(bytes: Buffer): Promise<string> {
  const { format } = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
  if (!format || !['jpeg', 'png', 'webp'].includes(format)) throw new Error('Please use a JPG, PNG or WebP photo.');
  return `data:image/${format};base64,${bytes.toString('base64')}`;
}

// Apply the same automatic sizing to every uploaded photo, including high
// resolution phone photos. No cropping, inpainting or per-photo retouching.
export async function preparePhotoInput(bytes: Buffer): Promise<Buffer> {
  if (bytes.length > 10 * 1024 * 1024) throw new Error('Please choose a photo up to 10 MB.');
  const photo = sharp(bytes, { limitInputPixels: 80_000_000 });
  const { format } = await photo.metadata();
  if (!format || !['jpeg', 'png', 'webp'].includes(format)) throw new Error('Please use a JPG, PNG or WebP photo.');
  return photo.rotate().toColourspace('srgb').resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
}

export function storageImageUrl(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Please upload a photo first.');
  const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const url = new URL(value);
  if ((url.protocol !== 'https:' && !isLocalSandboxStorage(url)) || url.origin !== base.origin || url.username || url.password ||
      !url.pathname.startsWith('/storage/v1/object/public/pet-photos/')) {
    throw new Error('Please use a photo uploaded to DeskBub.');
  }
  return url.href;
}

export function replicateMediaUrl(value: unknown): string {
  if (typeof value !== 'string') throw new Error('The media service returned an invalid file.');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || /["'`$\s]/.test(url.href) ||
      !(url.hostname === 'replicate.delivery' || url.hostname.endsWith('.replicate.delivery'))) {
    throw new Error('The media service returned an unexpected file location.');
  }
  return url.href;
}

export async function downloadMedia(url: string, token?: string, fetcher: typeof fetch = fetch): Promise<Buffer> {
  const response = await fetcher(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    redirect: 'error', signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok || !response.body) throw new Error('Could not retrieve the processed file.');
  const max = 50 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > max) throw new Error('The processed file is too large.');
  const reader = response.body.getReader(); const chunks: Buffer[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) throw new Error('The processed file is too large.');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel(); }
  if (!size) throw new Error('The processed file is empty.');
  return Buffer.concat(chunks);
}

// Match the tested automatic alpha>32 box, <=560px subject and 720px green canvas.
export async function prepareGreenInput(image: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(image, { limitInputPixels: 40_000_000 }).rotate().toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * channels + 3] > 32) {
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error('No pet was found in the processed photo. Please choose another photo.');
  const subject = await sharp(data, { raw: info }).extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize({ width: 560, height: 560, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  const size = await sharp(subject).metadata();
  return sharp({ create: { width: 720, height: 720, channels: 3, background: '#12fd10' } })
    .composite([{ input: subject, left: Math.floor((720 - size.width!) / 2), top: Math.floor((720 - size.height!) / 2) }]).png().toBuffer();
}

export async function normalizeCutout(image: Buffer): Promise<Buffer> {
  const normalized = await sharp(image, { limitInputPixels: 40_000_000 }).rotate().toColourspace('srgb').ensureAlpha().png().toBuffer();
  const stats = await sharp(normalized).stats();
  const alpha = stats.channels[3];
  if (!alpha || alpha.min !== 0 || alpha.max <= 32) throw new Error('The processed photo does not contain a usable transparent pet.');
  return normalized;
}
