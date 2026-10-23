'use client';

import { useEffect, useState } from 'react';
import { SHARE_CAPTION, SHARE_PAGE, SHARE_VIDEO, sharePostText, xShareUrl } from '@/lib/share-compose';
import { BASIC_PRICE } from '@/lib/pricing';
import styles from './ShareBasic.module.css';

type Platform = 'x' | 'tiktok' | 'instagram';
const platformLinks = { tiktok: 'https://www.tiktok.com/upload', instagram: 'https://www.instagram.com/' };

function PlatformIcon({ platform }: { platform: Platform }) {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
    {platform === 'x' ? <path d="m5 4 14 16h-4L1 4h4Zm14 0L5 20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" transform="translate(2 0) scale(.9 1)" />
      : platform === 'instagram' ? <><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>
        : <path d="M14 3v12a4 4 0 1 1-4-4m4-8c1 3 3 4 6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>;
}

export default function SharePostComposer({ enabled }: { enabled: boolean }) {
  const [caption, setCaption] = useState(SHARE_CAPTION);
  const [mobile, setMobile] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState(false), [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false), [nativeFailed, setNativeFailed] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
    const controller = new AbortController();
    setVideoError(false);
    fetch(SHARE_VIDEO, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Video unavailable');
      return response.blob();
    }).then(blob => {
      if (!controller.signal.aborted) setFile(new File([blob], 'DeskBub-Kaka.mp4', { type: 'video/mp4' }));
    }).catch(() => { if (!controller.signal.aborted) setVideoError(true); });
    return () => controller.abort();
  }, [attempt]);

  let nativeAvailable = false;
  try { nativeAvailable = mobile && !nativeFailed && !!file && !!navigator.canShare?.({ files: [file] }); } catch { /* Saving the demo remains available. */ }

  function copyText(): Promise<boolean> {
    try { return navigator.clipboard.writeText(sharePostText(caption)).then(() => true, () => false); }
    catch { return Promise.resolve(false); }
  }
  async function copyCaption() {
    setNotice(await copyText() ? 'Caption copied.' : 'Select and copy the caption, then add the website link.');
  }
  async function openX() {
    const copied = await copyText();
    setNotice(copied ? 'Caption copied. If X opens an empty draft, paste it there.' : 'If X opens an empty draft, use Copy caption.');
  }
  async function shareDemoVideo() {
    if (busy || !file || !enabled) return;
    setBusy(true); setNotice('');
    // Begin both operations before awaiting; iOS file sharing needs user activation.
    const copied = copyText();
    try {
      await navigator.share({ files: [file], title: 'DeskBub — Kaka' });
      setNotice(await copied ? 'If you chose Instagram, paste your copied caption there. For TikTok, choose Save Video, then upload it from Photos in the app.' : 'Add your own caption in your app, or copy the sample. For TikTok, save the video to Photos before uploading.');
    } catch (error) {
      await copied;
      if ((error as Error).name === 'AbortError') setNotice('Sharing canceled. You can try again, save the demo, or use your own video.');
      else { setNativeFailed(true); setNotice('File sharing is unavailable. Use Save demo video, then upload it in your app.'); }
    } finally { setBusy(false); }
  }

  return <div className={styles.composer}>
    <div className={styles.platforms} role="group" aria-label="Open a social platform">
      <a href={enabled ? xShareUrl(caption) : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!enabled} className={styles.platformButton} onClick={event => { if (!enabled) event.preventDefault(); else void openX(); }}><PlatformIcon platform="x" />Share on X</a>
      <a href={enabled ? (mobile ? 'https://www.tiktok.com/' : platformLinks.tiktok) : undefined} target={mobile ? undefined : '_blank'} rel="noopener noreferrer" aria-label="Open TikTok" aria-disabled={!enabled} className={styles.platformButton} onClick={event => { if (!enabled) event.preventDefault(); }}><PlatformIcon platform="tiktok" />TikTok</a>
      <a href={enabled ? platformLinks.instagram : undefined} target="_blank" rel="noopener noreferrer" aria-label="Open Instagram" aria-disabled={!enabled} className={styles.platformButton} onClick={event => { if (!enabled) event.preventDefault(); }}><PlatformIcon platform="instagram" />Instagram</a>
    </div>
    <section className={styles.requirements} aria-labelledby="share-requirements-title">
      <h3 id="share-requirements-title">For your free Basic creation</h3>
      <p className={styles.basicValue}>A free creation worth <strong>{BASIC_PRICE}</strong></p>
      <p>Your public post needs these three things:</p>
      <ul>
        <li>Mention DeskBub and explain that it’s a desktop pet.</li>
        <li>Include our website: <span className={styles.requirementsUrl}>{SHARE_PAGE.replace('https://', '')}</span></li>
        <li>Say you’re sharing to earn a free custom-pet creation.</li>
      </ul>
    </section>
    <section className={styles.sampleSection} aria-labelledby="share-sample-title">
      <h3 id="share-sample-title" className={styles.sampleTitle}>Need a starting point?</h3>
      <p className={styles.sampleIntro}>Use our sample caption and demo video, or make them your own.</p>
      <div className={styles.samples}>
        <div className={styles.composeControls}>
          <div className={styles.captionHeading}><label htmlFor="share-caption">Sample caption</label><button type="button" className={styles.link} onClick={() => void copyCaption()} disabled={!enabled || busy}>Copy caption</button></div>
          <textarea id="share-caption" value={caption} rows={6} maxLength={600} disabled={!enabled || busy} onChange={event => setCaption(event.target.value)} aria-describedby="share-caption-help" />
          <p id="share-caption-help" className={styles.captionHelp}>Edit the sample or write your own.</p>
          <p className={styles.includedLink}>Link included when copied: <span>{SHARE_PAGE.replace('https://', '')}</span></p>
        </div>
        <div className={styles.videoPreview}>
          <h4 className={styles.videoHeading}>Sample video</h4>
          <video controls playsInline muted loop preload="metadata" poster="/media/custom-desktop-demo/kaka-windows-clear-v2-poster.jpg" aria-label="Kaka demo video" className={styles.shareVideo}>
            <source src={SHARE_VIDEO} type="video/mp4" />
          </video>
          <div className={styles.videoFooter}>
            <a href={enabled ? SHARE_VIDEO : undefined} download="DeskBub-Kaka.mp4" aria-disabled={!enabled} className={styles.link} onClick={event => { if (!enabled) event.preventDefault(); else setNotice('Demo video download started. When it finishes, upload it in your chosen platform.'); }}>Save demo video</a>
            {nativeAvailable && <button type="button" className={styles.secondary} disabled={!enabled || busy} onClick={() => void shareDemoVideo()}>{busy ? 'Opening sharing…' : 'Share demo video'}</button>}
          </div>
          <p className={styles.captionHelp}>{nativeAvailable ? 'Choose Instagram in the sharing menu, or Save Video to upload it in TikTok.' : 'Save the demo, then upload it on your chosen platform.'}</p>
          {videoError && <p role="alert" className={styles.note}>The demo couldn’t load. <button type="button" className={styles.link} onClick={() => setAttempt(value => value + 1)}>Retry video</button> You can still open a platform above.</p>}
        </div>
      </div>
    </section>
    <p className={styles.composeNotice} role="status" aria-live="polite">{notice}</p>
  </div>;
}

