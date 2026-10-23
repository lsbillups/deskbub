'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { clearCustomDraft, loadCustomDraft, saveCustomDraft } from '@/lib/custom-draft';
import type { Plan } from '@/lib/pricing';
import styles from './CustomFlow.module.css';

const CustomPetWorkspace = dynamic(() => import('./CustomPetWorkspace'), {
  loading: () => <p role="status" className="text-center text-text-secondary">Loading your saved pet workspace…</p>,
});

function persist(files: File[], plan: Plan, ownerId: string | null) {
  return saveCustomDraft({ files, plan, savedAt: Date.now(), ownerId });
}
const subscribeLocation = (notify: () => void) => {
  window.addEventListener('popstate', notify);
  return () => window.removeEventListener('popstate', notify);
};
const paymentSnapshot = () => new URLSearchParams(window.location.search).get('upgraded') === 'true';

export default function CustomFlow() {
  const { isLoaded, isSignedIn, user } = useUser();
  return <CustomFlowSession key={isLoaded ? user?.id || 'anonymous' : 'loading'} isLoaded={isLoaded} isSignedIn={!!isSignedIn} userId={user?.id} />;
}

function CustomFlowSession({ isLoaded, isSignedIn, userId }: { isLoaded: boolean; isSignedIn: boolean; userId?: string }) {
  const [plan, setPlan] = useState<Plan>('basic');
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [account, setAccount] = useState<'loading' | 'free' | 'paid' | 'error'>(isSignedIn ? 'loading' : 'free');
  const [attempt, setAttempt] = useState(0);
  const [restored, setRestored] = useState(false);
  const paymentReturn = useSyncExternalStore(subscribeLocation, paymentSnapshot, () => false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const updateFiles = useCallback((next: File[]) => {
    setFiles(next);
    setUrls(next.map(file => URL.createObjectURL(file)));
  }, []);
  useEffect(() => () => urls.forEach(url => URL.revokeObjectURL(url)), [urls]);

  useEffect(() => {
    if (!isLoaded) return;
    let canceled = false;
    loadCustomDraft(userId).then(draft => {
      if (!draft || canceled) return;
      if (!canceled) { setPlan(draft.plan); updateFiles(draft.files); }
    }).catch(err => { if (!canceled) setError(err.message); })
      .finally(() => { if (!canceled) setRestored(true); });
    return () => { canceled = true; };
  }, [isLoaded, userId, updateFiles]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    const controller = new AbortController();
    fetch('/api/check-subscription', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !['free', 'basic', 'plus'].includes(data.tier)) throw new Error('Your account could not be loaded. Please retry.');
      setAccount(data.tier === 'free' ? 'free' : 'paid');
    }).catch(err => { if (!controller.signal.aborted) { setAccount('error'); setError(err.message); } });
    return () => controller.abort();
  }, [isLoaded, isSignedIn, userId, attempt]);

  // A successful checkout redirect can arrive before its verified webhook.
  // Never ask the visitor to pay again while that payment is being confirmed.
  useEffect(() => {
    if (!paymentReturn || !isSignedIn || account !== 'free' || attempt >= 10) return;
    const timer = window.setTimeout(() => { setAccount('loading'); setAttempt(value => value + 1); }, 3000);
    return () => window.clearTimeout(timer);
  }, [paymentReturn, isSignedIn, account, attempt]);

  async function select(selected: File[]) {
    setError('');
    if (!selected.length) return;
    const max = plan === 'basic' ? 1 : 5;
    if (selected.length > max) { setError(`Choose up to ${max} photo${max > 1 ? 's' : ''} for ${plan === 'basic' ? 'Basic' : 'Plus'}.`); return; }
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024 || !file.size)) {
      setError('Choose JPG, PNG or WebP photos, each under 10 MB.'); return;
    }
    try { await persist(selected, plan, userId || null); updateFiles(selected); }
    catch (err) { setError(err instanceof Error ? err.message : 'Please allow browser storage and try again.'); }
  }

  async function choosePlan(next: Plan) {
    if (next === 'basic' && files.length > 1) { setError('Basic uses one photo. Remove the extra photos before switching, or keep Plus.'); return; }
    setError('');
    try { if (files.length) await persist(files, next, userId || null); setPlan(next); }
    catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
  }

  async function continueFlow() {
    if (busy || !files.length || paymentReturn) return;
    setBusy(true); setError('');
    try {
      await persist(files, plan, userId || null);
      if (!isSignedIn) {
        window.location.assign('/sign-in?redirect_url=' + encodeURIComponent('/custom-desktop-pet#custom-create'));
        return;
      }
      const response = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, returnTo: 'custom' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout could not open. Your photo is saved; please try again.');
      const target = new URL(data.checkoutUrl);
      if (target.protocol !== 'https:' || !['www.creem.io', 'creem.io', 'test.creem.io'].includes(target.hostname)) throw new Error('Checkout could not open. Please contact support.');
      window.location.assign(target.href);
    } catch (err) { setError(err instanceof Error ? err.message : 'Checkout could not open. Please try again.'); }
    finally { setBusy(false); }
  }

  if (isSignedIn && account === 'paid' && restored) return <CustomPetWorkspace embedded initialFiles={files} onDraftFilesChange={async (next, workspacePlan) => {
    if (!userId) throw new Error('Please sign in again before changing your saved photos.');
    if (next.length) await persist(next, workspacePlan, userId);
    else await clearCustomDraft(userId);
    setPlan(workspacePlan); updateFiles(next);
  }} />;

  return <section className={styles.form} aria-labelledby="custom-create-title">
    <h2 id="custom-create-title">Start with your pet’s photo</h2>
    <p className={styles.intro}>Choose a photo, pick your plan, then create your desktop companion here.</p>
    <label className={styles.photoPicker} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (restored && !busy) void select(Array.from(event.dataTransfer.files)); }}>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={plan === 'plus'} disabled={!restored || busy}
        onChange={event => { void select(Array.from(event.target.files || [])); event.target.value = ''; }} />
      {urls.length ? <span className={styles.previews}>{urls.map((url, index) => /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt={`Selected photo: ${files[index]?.name || index + 1}`} key={url} />)}</span> : <span className={styles.choose}>Choose a pet photo <span aria-hidden="true">↑</span></span>}
      <span>{files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} selected · Click to change` : 'or drop it here · JPG, PNG, WebP · Up to 10 MB each'}</span>
    </label>
    {files.length > 0 && <button className={styles.remove} type="button" disabled={busy} onClick={async () => {
      try { await clearCustomDraft(userId); updateFiles([]); setError(''); } catch { setError('Could not remove the saved photo. Please retry.'); }
    }}>Remove saved photos</button>}
    <fieldset className={styles.plans} disabled={busy}>
      <legend>Choose your one-time plan</legend>
      {(['basic', 'plus'] as const).map(value => <label key={value} className={styles.plan}>
        <input type="radio" name="custom-plan" value={value} checked={plan === value} onChange={() => void choosePlan(value)} />
        <span><strong>{value === 'basic' ? 'Basic' : 'Plus'}</strong><small>{value === 'basic' ? '1 photo · 1 default action' : '1–5 photos · 8 generations · Keep up to 5'}</small></span>
        <strong>{value === 'basic' ? '$2.99' : '$9.99'}</strong>
      </label>)}
    </fieldset>
    <p className={styles.note}>No subscription. The selected image is an original-photo preview, not a generated result. Your photo stays in this browser until you start processing it.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {paymentReturn && <p className={styles.note} role="status">Confirming your purchase. Your photos are saved. If confirmation is delayed, refresh your balance or contact support before paying again.</p>}
    {account === 'error' || paymentReturn ? <button className={styles.primary} type="button" disabled={account === 'loading'} onClick={() => { setError(''); setAccount('loading'); setAttempt(value => value + 1); }}>Refresh purchase status</button> :
      <button className={styles.primary} type="button" disabled={!isLoaded || !restored || account === 'loading' || !files.length || busy} onClick={() => void continueFlow()}>
        {busy ? 'Opening checkout…' : !isLoaded || !restored || account === 'loading' ? 'Loading…' : !isSignedIn ? 'Sign in to continue' : `Continue with ${plan === 'basic' ? 'Basic · $2.99' : 'Plus · $9.99'}`}
      </button>}
    <p className={styles.note}>Already purchased? Sign in with the same account to continue your saved pet. <Link href="/sign-in?redirect_url=%2Fcustom-desktop-pet%23custom-create">Sign in</Link></p>
  </section>;
}
