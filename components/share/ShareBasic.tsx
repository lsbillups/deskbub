'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import type { ShareClaim } from '@/lib/share-claims';
import SharePostComposer from '@/components/share/SharePostComposer';
import styles from './ShareBasic.module.css';

type Info = { claim: ShareClaim | null; eligible: boolean; enabled: boolean; admin: boolean; staging: boolean };
const draftEvent = 'deskbub-share-draft';
const memoryDrafts = new Map<string, string>();
function draftRead(key: string) {
  try { return sessionStorage.getItem(key) ?? memoryDrafts.get(key) ?? sessionStorage.getItem('deskbub-share-guest') ?? ''; }
  catch { return memoryDrafts.get(key) ?? ''; }
}
function draftWrite(key: string, value: string) {
  memoryDrafts.set(key, value);
  try { sessionStorage.setItem(key, value); } catch { /* Preserve input when storage is unavailable. */ }
  window.dispatchEvent(new Event(draftEvent));
}
function subscribeDraft(listener: () => void) {
  window.addEventListener(draftEvent, listener); window.addEventListener('storage', listener);
  return () => { window.removeEventListener(draftEvent, listener); window.removeEventListener('storage', listener); };
}
async function readApplication(): Promise<Info> {
  let response: Response;
  try { response = await fetch('/api/share-claims', { cache: 'no-store', signal: AbortSignal.timeout(10_000) }); }
  catch (error) {
    if ((error as Error).name === 'TimeoutError') throw new Error('The status check timed out. Please try again.');
    throw error;
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load your reward status.');
  return data;
}
export default function ShareBasic({ enabled, staging, compactTrigger = false }: { enabled: boolean; staging: boolean; compactTrigger?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const bodyOverflow = useRef<string | null>(null);
  const [visit, setVisit] = useState(0);
  const show = useCallback(() => {
    if (!dialog.current || dialog.current.open) return;
    bodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setVisit(value => value + 1); dialog.current.showModal();
  }, []);
  useEffect(() => {
    const openHash = () => { if (window.location.hash === '#share-basic') show(); };
    const frame = requestAnimationFrame(openHash);
    window.addEventListener('hashchange', openHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', openHash); if (bodyOverflow.current !== null) document.body.style.overflow = bodyOverflow.current; };
  }, [show]);
  return <div id="share-basic" className={compactTrigger ? styles.buttonHost : styles.entryHost}>
    <button type="button" onClick={show} className={compactTrigger ? styles.compactTrigger : styles.entry} aria-haspopup="dialog" aria-label={compactTrigger ? 'Share DeskBub to Get a Free Custom Pet' : 'Share DeskBub'} aria-describedby={compactTrigger ? 'share-offer-detail' : 'share-offer-copy'}>
      <span id="share-offer-copy" className={styles.entryLabel}>{compactTrigger ? 'Share DeskBub to Get a Free Custom Pet' : 'Want your own pet for free?'}</span>
      {compactTrigger && <span id="share-offer-detail" className={styles.triggerDetail}>Post on X, TikTok or Instagram · After approval</span>}
      {!compactTrigger && <span className={styles.entryButton}>Share DeskBub <span aria-hidden="true">→</span></span>}
    </button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="share-basic-title"
      onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current?.close(); } }}
      onClose={() => { if (bodyOverflow.current !== null) { document.body.style.overflow = bodyOverflow.current; bodyOverflow.current = null; } if (window.location.hash === '#share-basic') history.replaceState(null, '', window.location.pathname + window.location.search); }}>
      <div className={styles.dialogInner}>
        <button type="button" className={styles.close} onClick={() => dialog.current?.close()} aria-label="Close sharing"><svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button>
        <h2 id="share-basic-title">Show DeskBub on your desktop</h2>
        <p className={styles.intro}>We’d love to see DeskBub on your screen. Share a short clip and a few words about your experience.</p>
        <p className={styles.qualification}>Get one free Basic creation after your public post is approved.<br />First-time creators only · One reward per account</p>
        {visit > 0 && <ShareSession key={visit} enabled={enabled} staging={staging} />}
      </div>
    </dialog>
  </div>;
}
function ShareSession(props: { enabled: boolean; staging: boolean }) {
  const { user, isLoaded } = useUser();
  return <SharePanel key={user?.id ?? 'guest'} {...props} userId={user?.id ?? null} authLoaded={isLoaded} />;
}
function SharePanel({ enabled, staging, userId, authLoaded }: { enabled: boolean; staging: boolean; userId: string | null; authLoaded: boolean }) {
  const [info, setInfo] = useState<Info | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const checkInFlight = useRef(false);
  const [checking, setChecking] = useState(false), [checkNotice, setCheckNotice] = useState('');
  const [reveal, setReveal] = useState(false);
  const draftKey = 'deskbub-share-' + (userId ?? 'guest');
  const url = useSyncExternalStore(subscribeDraft, () => draftRead(draftKey), () => '');
  const load = useCallback(async () => {
    try { const data = await readApplication(); setInfo(data); setError(''); }
    catch (e) { setError((e as Error).message); }
  }, []);
  async function checkStatus() {
    if (checkInFlight.current) return;
    checkInFlight.current = true; setChecking(true); setCheckNotice(''); setError('');
    try {
      const data = await readApplication(); setInfo(data);
      if (data.claim?.status === 'pending') setCheckNotice('Checked just now — your post is still waiting for review.');
      if (data.claim?.status === 'changes_requested' && !draftRead(draftKey)) draftWrite(draftKey, data.claim.post_url);
    } catch (e) { setError((e as Error).message); }
    finally { checkInFlight.current = false; setChecking(false); }
  }
  useEffect(() => {
    if (!authLoaded || !userId) return;
    let canceled = false;
    readApplication().then(data => { if (!canceled) { setInfo(data); if (data.claim?.status === 'changes_requested' && !draftRead(draftKey)) draftWrite(draftKey, data.claim.post_url); } })
      .catch(e => { if (!canceled) setError(e.message); });
    return () => { canceled = true; };
  }, [authLoaded, userId, draftKey]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!authLoaded || busy || !enabled) return;
    if (!userId) { draftWrite('deskbub-share-guest', url); window.location.assign('/sign-in?redirect_url=%2Ffree-desktop-pet%23share-basic'); return; }
    if (!info?.enabled || !info.eligible) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/share-claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, confirmed: true }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      draftWrite(draftKey, ''); draftWrite('deskbub-share-guest', ''); await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const claim = info?.claim;
  const offerOpen = enabled && info?.enabled !== false;
  return <>
    {(!claim || claim.status === 'changes_requested') && info?.eligible !== false && <>
      <SharePostComposer enabled={offerOpen} />
      {!reveal && !url && claim?.status !== 'changes_requested' && <button type="button" className={styles.already} onClick={() => setReveal(true)}>Already shared? Submit your link <span aria-hidden="true">→</span></button>}
    </>}
    {claim?.status === 'approved' ? <div className={styles.status}><strong>Your reward was approved.</strong><p>One Basic generation was added to your account.</p><Link className={styles.primary} href="/custom-desktop-pet#custom-create">Open my pet workspace</Link></div>
      : claim?.status === 'pending' ? <div className={styles.status}><strong>Your post is waiting for review.</strong><p>You’re all set. We’ll show your reward here after approval.</p><button type="button" className={styles.secondary} disabled={checking} aria-busy={checking} onClick={() => void checkStatus()}>{checking ? 'Checking…' : 'Check status'}</button><p className={styles.note} role="status" aria-live="polite">{checking ? 'Checking your application…' : checkNotice}</p></div>
        : info?.eligible === false ? <div className={styles.status}><strong>You already have a plan or saved work.</strong><p>This reward is for first-time creators.</p><Link className={styles.link} href="/dashboard">View my Dashboard</Link></div>
          : (reveal || url || claim?.status === 'changes_requested') && <form onSubmit={event => void submit(event)} className={styles.form}>
            <label htmlFor="share-url">{claim ? 'Update your post link' : 'Posted? Paste your link'}</label>
            {claim?.review_note && <p role="status" className={styles.error}>{claim.review_note}</p>}
            <input id="share-url" type="url" value={url} onChange={e => draftWrite(draftKey, e.target.value)} placeholder="https://…" maxLength={2048} required disabled={busy} autoComplete="off" />
            <button type="submit" className={styles.primary} disabled={busy || !enabled || !authLoaded || (!!userId && (!info?.enabled || !info.eligible))}>{busy ? 'Submitting…' : !authLoaded ? 'Loading account…' : !userId ? 'Sign in & submit' : claim ? 'Resubmit link' : 'Submit for my free creation'}</button>
            <p className={styles.note}>By submitting, you confirm this is your public post and it discloses the reward.</p>
          </form>}
    {error && (reveal || url || !!claim) && <p role="alert" className={styles.error}>{error} <button type="button" className={styles.link} disabled={checking} onClick={() => void checkStatus()}>Retry</button></p>}
    <details className={styles.details}><summary>Reward details</summary><ul>
      <li>New accounts with no purchase or previous creation. One reward across all platforms, after manual review.</li>
      <li>Basic: one photo, one default action, one final animation. No payment required.</li>
      <li>Keep your post public and include the DeskBub introduction, website link and reward disclosure listed above. We review each post manually.</li>
      <li>X posts, TikTok videos and Instagram Posts or Reels are accepted. Stories are not supported.</li>
      <li>Use your platform’s paid-partnership or branded-content label for this reward post.</li>
    </ul></details>
    {staging ? <p className={styles.preview}>Local preview · Please don’t publish a post for this test.</p> : !enabled && <p className={styles.preview}>This sharing offer is not open yet.</p>}
    {info?.admin && <p className={styles.note}><Link className={styles.link} href="/dashboard/share-review">Open owner review queue</Link></p>}
  </>;
}
export function ShareStatus() {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return null;
  return <StatusSession key={user.id} />;
}
function StatusSession() {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => { const controller = new AbortController(); fetch('/api/share-claims', { cache: 'no-store', signal: controller.signal })
    .then(async response => { if (response.ok) setInfo(await response.json()); }).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!info?.claim && !info?.admin) return null;
  return <div className={styles.compact}>
    {info.claim && <><strong>{info.claim.status === 'approved' ? 'Sharing reward: 1 Basic generation granted.' : info.claim.status === 'pending' ? 'Sharing application: waiting for review.' : 'Sharing application: changes requested.'}</strong><br /><Link className={styles.link} href={info.claim.status === 'approved' ? '/custom-desktop-pet#custom-create' : '/free-desktop-pet#share-basic'}>{info.claim.status === 'approved' ? 'Open my pet workspace' : 'View application'}</Link></>}
    {info.admin && <Link className={styles.link} href="/dashboard/share-review">Review sharing applications</Link>}
  </div>;
}
