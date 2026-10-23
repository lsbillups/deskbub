export const SHARE_CAMPAIGN = 'share-basic-v1';
export const SHARE_SELECT = 'id,platform,post_url,social_handle,status,review_note,created_at,updated_at,reviewed_at';
export type ShareClaim = { id: string; platform: 'x' | 'tiktok' | 'instagram'; post_url: string; social_handle: string;
  status: 'pending' | 'changes_requested' | 'approved'; review_note: string | null; created_at: string; updated_at: string; reviewed_at: string | null };
export function normalizeSharePost(platform: unknown, input: unknown) {
  if (!['x', 'tiktok', 'instagram'].includes(String(platform)) || typeof input !== 'string' || input.length > 2048) throw new Error('Choose a platform and paste the full public post link.');
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error('Paste the full post link, starting with https://.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Use a public HTTPS post link.');
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let match: RegExpMatchArray | null;
  if (platform === 'x' && ['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) {
    match = url.pathname.match(/^\/(?:[a-zA-Z0-9_]{1,15}|i\/web)\/status\/(\d{5,25})\/?$/);
    if (match) return { platform: 'x' as const, postId: match[1], url: 'https://x.com/i/web/status/' + match[1] };
  }
  if (platform === 'tiktok' && host === 'tiktok.com') {
    match = url.pathname.match(/^\/@([a-zA-Z0-9_.]{1,32})\/video\/(\d{5,25})\/?$/);
    if (match) return { platform: 'tiktok' as const, postId: match[2], url: 'https://www.tiktok.com/@' + match[1] + '/video/' + match[2] };
  }
  if (platform === 'instagram' && host === 'instagram.com') {
    match = url.pathname.match(/^\/(?:p|reel|reels)\/([a-zA-Z0-9_-]{5,64})\/?$/);
    if (match) return { platform: 'instagram' as const, postId: match[1], url: 'https://www.instagram.com/p/' + match[1] + '/' };
  }
  throw new Error('Use the direct public post or video link for this platform. Open TikTok short links first and copy the full @name/video link. Instagram Stories are not supported in this review pilot.');
}
export function shareCampaignEnabled(env: NodeJS.ProcessEnv = process.env) { return env.DESKBUB_SHARE_CAMPAIGN_ENABLED === '1'; }

// Link metadata is a routing hint, never proof of ownership.
export function sharePostFromLink(input: unknown) {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('Paste your public post link.');
  let source: URL;
  try { source = new URL(input.trim()); } catch { throw new Error('Paste the full post link, starting with https://.'); }
  const host = source.hostname.toLowerCase().replace(/^www\./, '');
  const platform = ['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host) ? 'x' : host === 'tiktok.com' ? 'tiktok' : host === 'instagram.com' ? 'instagram' : '';
  const post = normalizeSharePost(platform, input);
  const author = post.platform === 'x' ? source.pathname.match(/^\/([a-zA-Z0-9_]{1,15})\/status\//)?.[1]
    : post.platform === 'tiktok' ? source.pathname.match(/^\/@([a-zA-Z0-9_.]{1,32})\/video\//)?.[1] : null;
  return { ...post, handle: author ? '@' + author : 'See post author' };
}
