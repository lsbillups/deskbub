'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { track } from '@vercel/analytics';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DropZone from '@/components/upload/DropZone';
import GenerationProgress from '@/components/upload/GenerationProgress';
import { motion, AnimatePresence } from 'framer-motion';
import { petActions, actionRequest, type PetType } from '@/lib/generation/actions';
import { runGeneration, runVideoBatch, resumePendingGenerations, acknowledgeGeneration } from '@/lib/generation/client';
import { progressCounts, type BatchProgress } from '@/lib/generation/progress';

type Stage = 'select' | 'preview' | 'uploading' | 'processing' | 'done' | 'append' | 'appendActions' | 'finalized';

export default function UploadPage() {
  const router = useRouter();
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const [tier, setTier] = useState('free');
  const [gensUsed, setGensUsed] = useState(0);
  const [gensMax, setGensMax] = useState(0);
  const [stage, setStage] = useState<Stage>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [processedUrls, setProcessedUrls] = useState<string[]>([]);
  const [petType, setPetType] = useState<PetType>('dog');
  const [checked, setChecked] = useState<boolean[][]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoLabels, setVideoLabels] = useState<string[]>([]);
  const [keepFlags, setKeepFlags] = useState<boolean[]>([]);
  const [appendActions, setAppendActions] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [accountAttempt, setAccountAttempt] = useState(0);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const generationBusy = useRef(false);
  const photoBusy = useRef(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const batchProgressRef = useRef<BatchProgress | null>(null);
  const updateBatchProgress = useCallback((value: BatchProgress) => {
    batchProgressRef.current = value.items.length ? value : null;
    setBatchProgress(value.items.length ? value : null);
  }, []);
  const finishBatchPresentation = useCallback(() => {
    if (batchProgressRef.current && progressCounts(batchProgressRef.current).unfinished === 0) {
      const { completed, total, failed } = progressCounts(batchProgressRef.current);
      if (failed) setError(`${completed} of ${total} videos completed. ${failed} could not finish. Your completed videos are saved; no automatic new generation was made.`);
      batchProgressRef.current = null; setBatchProgress(null);
    }
  }, []);

  const MAX_ACTIONS = tier === 'plus' ? 5 : 1;
  const FINAL = 5;
  const MAX_TOTAL = 8;
  const gensLeft = Math.max(0, gensMax - gensUsed);
  const totalVideos = videoUrls.length;

  const refreshSub = useCallback(async () => {
    await fetch('/api/check-subscription', { cache: 'no-store' }).then(async r => {
      if (!r.ok) throw new Error('Your generation balance could not be refreshed. Please refresh before continuing.');
      const d = await r.json();
      if (!Number.isSafeInteger(d.used) || !Number.isSafeInteger(d.max)) throw new Error('Your generation balance could not be loaded.');
      setGensUsed(d.used); setGensMax(d.max);
    }).catch(err => setError(err instanceof Error ? err.message : 'Your generation balance could not be refreshed.'));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/check-subscription', { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Your account could not be loaded. Please try again.');
      if (!['free', 'basic', 'plus'].includes(data.tier) || !Number.isSafeInteger(data.used) || !Number.isSafeInteger(data.max) ||
          typeof data.pairingCode !== 'string' || !/^\d{6}$/.test(data.pairingCode)) throw new Error('Your account could not be loaded. Please try again.');
      return data;
    }).then(data => {
      if (controller.signal.aborted) return;
      setTier(data.tier); setGensUsed(data.used); setGensMax(data.max); setPairingCode(data.pairingCode);
      if (data.tier === 'free') setAccountStatus('ready');
      else setRestoreAttempt(attempt => attempt + 1);
    }).catch(err => {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Your account could not be loaded. Please try again.');
      setAccountStatus('error');
    });
    return () => controller.abort();
  }, [accountAttempt]);

  // Restore saved outputs and resume the same pending jobs after a refresh.
  useEffect(() => {
    if (!pairingCode || !['basic', 'plus'].includes(tier)) return;
    let canceled = false;
    let selectionLoaded = false;
    const restore = async () => {
      generationBusy.current = true; setIsGenerating(true);
      const urls: string[] = [], labels: string[] = [], photos: string[] = [];
      let alreadyFinalized = false;
      let recoveryChecked = false;
      {
        const response = await fetch('/api/animation-selection');
        if (!response.ok) throw new Error('Your saved pets could not be loaded. Please refresh before continuing.');
        const data = await response.json();
        if (!Array.isArray(data.videos) || !['draft', 'finalized'].includes(data.status)) throw new Error('Your saved pets could not be loaded. Please try again.');
        selectionLoaded = true;
        alreadyFinalized = data.status === 'finalized';
        if (response.ok && Array.isArray(data.videos)) {
          for (const video of data.videos) { urls.push(video.url); labels.push(video.label); }
          if (!canceled && urls.length) {
            setVideoUrls([...urls]); setVideoLabels([...labels]); setKeepFlags(urls.map((_, i) => i < 5));
            setStage(data.status === 'finalized' ? 'finalized' : 'done');
          }
        }
      }
      try { await resumePendingGenerations(async ({ endpoint, result }) => {
        if (canceled) return;
        // A lost acknowledgement must not restore discarded candidates or unlock
        // a selection that was already confirmed in another tab.
        if (alreadyFinalized) {
          await acknowledgeGeneration(result.jobId);
          return;
        }
        if (endpoint === '/api/generate-pet' && result.processedUrl) {
          if (!photos.includes(result.processedUrl)) photos.push(result.processedUrl);
        }
        if (result.videoUrl) {
          if (!urls.includes(result.videoUrl)) { urls.push(result.videoUrl); labels.push(result.actionLabel || 'Pet animation'); }
          if (tier === 'basic') { const sync = await fetch('/api/sync-pet-data', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pairingCode, finalize: tier === 'basic', videos: urls.map((url, i) => ({ url, label: labels[i] })) }) });
          if (!sync.ok) throw new Error('Your video is saved. Desktop sync will resume after refresh.');
          }
          await refreshSub();
        }
        if (result.videoUrl) await acknowledgeGeneration(result.jobId);
      }, value => { if (!canceled) { updateBatchProgress(value); if (value.items.length) setAccountStatus('ready'); } });
        recoveryChecked = true;
      }
      finally {
        if (!canceled) {
          setVideoUrls([...urls]); setVideoLabels([...labels]); setKeepFlags(urls.map((_, i) => i < 5));
          if (urls.length) {
            setProcessedUrls([]); setStage(alreadyFinalized || tier === 'basic' ? 'finalized' : 'done');
          } else if (photos.length) {
            setProcessedUrls(photos); setChecked(petActions.dog.actions.map(() => photos.map(() => false))); setStage('done');
          }
          if (recoveryChecked || batchProgressRef.current) setAccountStatus('ready');
        }
      }
    };
    restore().catch(err => { if (!canceled) { setError(err instanceof Error ? err.message : 'Saved tasks could not be restored.'); if (!selectionLoaded || !batchProgressRef.current) setAccountStatus('error'); } })
      .finally(() => { if (!canceled) { generationBusy.current = false; setIsGenerating(false); finishBatchPresentation(); void refreshSub(); } });
    return () => { canceled = true; };
  }, [pairingCode, tier, restoreAttempt, finishBatchPresentation, refreshSub, updateBatchProgress]);

  const syncToDB = async (urls: string[], labels: string[], finalize = false) => {
    const response = await fetch('/api/sync-pet-data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairingCode, finalize, videos: urls.map((u, i) => ({ url: u, label: labels[i] })) }),
    });
    if (!response.ok) throw new Error('Your videos are saved, but desktop sync could not finish. Resume the saved task instead of generating again.');
  };

  // ── Init checked matrix (Plus only) ──
  const initChecked = (nPhotos: number) => {
    if (tier === 'plus') setChecked(petActions[petType].actions.map(() => Array(nPhotos).fill(false)));
  };

  const toggleCheck = (ai: number, pi: number) => {
    if (tier !== 'plus') return;
    const c = checked.map((row, i) => (i === ai ? [...row] : row));
    c[ai][pi] = !c[ai][pi];
    if (c.flat().filter(v => v).length > MAX_ACTIONS) return;
    setChecked(c);
  };

  // ── File selection ──
  const handleFileSelected = (fs: File[]) => {
    if (fs.length === 0) return;
    setFiles(fs); setError(null);
    setPreviewUrls(fs.map(f => URL.createObjectURL(f)));
    setStage('preview');
  };

  // ── Upload + BG removal (shared by initial & append) ──
  const runBGRemoval = async (filesList: File[]) => {
    if (photoBusy.current) return null;
    photoBusy.current = true;
    setStage('uploading'); setProgress(0); setError(null);
    track('photo_upload_started', { plan: tier, photos: filesList.length });
    const urls: string[] = [];
    try {
      const supabase = createClient();
      for (let i = 0; i < filesList.length; i++) {
        const f = filesList[i];
        const authorization = await fetch('/api/upload-photo', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: f.type, size: f.size }) });
        const upload = await authorization.json();
        if (!authorization.ok) throw new Error(upload.error || 'Photo upload could not be prepared.');
        const { error: ue } = await supabase.storage.from('pet-photos').uploadToSignedUrl(upload.path, upload.token, f, { cacheControl: '3600', contentType: f.type });
        if (ue) throw new Error(`Upload failed: ${f.name}`);
        setProgress(Math.round(((i + 1) / filesList.length) * 50));
        setStage('processing');
        const data = await runGeneration('/api/generate-pet', { imageUrl: upload.publicUrl });
        if (!data.processedUrl) throw new Error('The processed photo is unavailable.');
        urls.push(data.processedUrl);
        setProcessedUrls([...urls]);
        if (tier === 'plus') setChecked(petActions[petType].actions.map(() => urls.map(() => false)));
        // Image delivery is finalized by the database after video completion.
      }
      setProcessedUrls(urls); setProgress(100);
      return urls;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.');
      setStage(urls.length ? 'done' : 'preview');
      return null;
    } finally { photoBusy.current = false; }
  };

  // ── Initial BG removal ──
  const handleBGRemove = async () => {
    if (files.length === 0 || tier === 'free') { router.push('/pricing'); return; }
    const urls = await runBGRemoval(files);
    if (urls) {
      if (tier === 'plus') initChecked(urls.length);
      setStage('done');
    }
  };

  // ── Generate videos (shared) ──
  const handleGenerate = async () => {
    if (generationBusy.current) return;
    generationBusy.current = true;
    const pairs: { ai: number; pi: number }[] = [];
    if (tier === 'plus') {
      checked.forEach((row, ai) => row.forEach((v, pi) => { if (v) pairs.push({ ai, pi }); }));
      if (pairs.length > MAX_ACTIONS) pairs.length = MAX_ACTIONS;
    } else {
      pairs.push({ ai: 0, pi: 0 });
    }
    setIsGenerating(true); setError(null);
    const urls: string[] = [...videoUrls]; const labels: string[] = [...videoLabels];
    try {
      await runVideoBatch(pairs.map(({ ai, pi }) => ({ imageUrl: processedUrls[pi], ...actionRequest(petType, ai) })), async data => {
        if (!data.videoUrl) throw new Error('The generated video is unavailable.');
        if (!urls.includes(data.videoUrl)) { urls.push(data.videoUrl); labels.push(data.actionLabel || 'Pet animation'); }
        if (tier === 'basic') await syncToDB([...urls], [...labels], true);
        await acknowledgeGeneration(data.jobId);
        await refreshSub();
      }, updateBatchProgress);
    } catch (err) { setError(err instanceof Error ? err.message : 'Generation failed.'); }
    finally {
      setVideoUrls(urls); setVideoLabels(labels); setKeepFlags(Array(urls.length).fill(true));
      if (urls.length) { setProcessedUrls([]); setStage(tier === 'basic' ? 'finalized' : 'done'); }
      generationBusy.current = false; setIsGenerating(false); finishBatchPresentation(); void refreshSub();
    }
  };

  // ═══════════════════════════════════════════════
  // APPEND FLOW — add more videos
  // ═══════════════════════════════════════════════

  const handleStartAppend = () => {
    if (totalVideos >= MAX_TOTAL || gensLeft <= 0) return;
    setStage('append');
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]);
    setError(null);
  };

  const handleAppendFileSelected = (fs: File[]) => {
    if (fs.length === 0) return;
    setFiles(fs); setError(null);
    setPreviewUrls(fs.map(f => URL.createObjectURL(f)));
  };

  const handleAppendBGRemove = async () => {
    if (files.length === 0) return;
    const urls = await runBGRemoval(files);
    if (urls) {
      // Init action selectors with default (0)
      setAppendActions(Array(urls.length).fill(0));
      setStage('appendActions');
    }
  };

  const handleAppendGenerate = async () => {
    if (processedUrls.length === 0 || generationBusy.current) return;
    generationBusy.current = true;
    const genCount = Math.min(processedUrls.length, gensLeft, MAX_TOTAL - totalVideos);
    if (genCount <= 0) { generationBusy.current = false; return; }
    setIsGenerating(true); setError(null);
    const newUrls: string[] = []; const newLabels: string[] = [];
    try {
      const requests = Array.from({ length: genCount }, (_, k) => {
        const ai = appendActions[k] ?? 0;
        const pi = Math.min(k, processedUrls.length - 1);
        return { imageUrl: processedUrls[pi], ...actionRequest(petType, ai) };
      });
      await runVideoBatch(requests, async data => {
        if (!data.videoUrl) throw new Error('The generated video is unavailable.');
        if (!videoUrls.includes(data.videoUrl) && !newUrls.includes(data.videoUrl)) {
          newUrls.push(data.videoUrl); newLabels.push(data.actionLabel || 'Pet animation');
        }
        await acknowledgeGeneration(data.jobId);
        await refreshSub();
      }, updateBatchProgress);
    } catch (err) { setError(err instanceof Error ? err.message : 'Append failed.'); }
    finally {
      const allUrls = [...videoUrls, ...newUrls];
      const allLabels = [...videoLabels, ...newLabels];
      setVideoUrls(allUrls); setVideoLabels(allLabels);
      setKeepFlags(allUrls.map((_, i) => i < FINAL ? true : false));
      setFiles([]); setPreviewUrls([]); setProcessedUrls([]);
      setStage('done');
      generationBusy.current = false; setIsGenerating(false); finishBatchPresentation(); void refreshSub();
    }
  };

  // ═══════════════════════════════════════════════
  // FINALIZE — confirm & lock
  // ═══════════════════════════════════════════════

  const handleFinalizeClick = () => {
    setShowFinalizeConfirm(true);
  };

  const handleFinalizeConfirm = async () => {
    if (generationBusy.current) return;
    generationBusy.current = true; setIsGenerating(true); setError(null);
    try {
      setShowFinalizeConfirm(false);
      const finalUrls: string[] = []; const finalLabels: string[] = [];
      videoUrls.forEach((url, i) => {
        if (totalVideos <= FINAL || keepFlags[i]) {
          finalUrls.push(url); finalLabels.push(videoLabels[i]);
        }
      });
      const keptUrls = finalUrls.slice(0, FINAL);
      const keptLabels = finalLabels.slice(0, FINAL);
      await syncToDB(keptUrls, keptLabels, true);
      setVideoUrls(keptUrls); setVideoLabels(keptLabels);
      setKeepFlags(Array(keptUrls.length).fill(true));
      setStage('finalized');
    } catch (err) { setError(err instanceof Error ? err.message : 'Your selection could not be confirmed. Please try saving again.'); }
    finally { generationBusy.current = false; setIsGenerating(false); }
  };

  // ── Reset ──
  const handleReset = () => {
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]); setVideoUrls([]); setVideoLabels([]);
    setChecked([]); setKeepFlags([]);
    setError(null); setProgress(0); setStage('select');
  };

  const keepCount = keepFlags.filter(v => v).length;
  const checkedCount = checked.flat().filter(v => v).length;

  // This must be visible in the first HTML response, before hydration or account
  // requests finish. An unknown or failed account is never treated as Free.
  if (accountStatus !== 'ready') {
    return (
      <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">Create Your Desktop Pet</h1>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8" role={accountStatus === 'error' ? 'alert' : 'status'}>
            <p className="text-text-secondary">{accountStatus === 'error' ? error : 'Loading your account and saved pets…'}</p>
            {accountStatus === 'error' && <button onClick={() => { setAccountStatus('loading'); setError(null); setAccountAttempt(attempt => attempt + 1); }}
              className="mt-5 rounded-full border border-coral px-5 py-2.5 font-semibold text-text-primary hover:bg-cream cursor-pointer">Try loading again</button>}
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">Create Your Desktop Pet</h1>
          <p className="mt-2 text-text-secondary">
            {tier === 'plus'
              ? `Plus — Step 1: pick up to 5 actions · Step 2: add more videos if needed · Step 3: pick your ${FINAL} favorites`
              : tier === 'basic' ? 'Basic — 1 default action' : 'Choose a custom pet option to generate animations'}
          </p>
          {(tier === 'plus' || tier === 'basic') && <p className="text-sm text-text-secondary mt-2">{gensLeft} generations left{batchProgress ? ` · ${progressCounts(batchProgress).unfinished} in this batch` : ` · ${totalVideos} videos so far`}</p>}
          {tier === 'free' && <p className="text-xs text-text-secondary/60 mt-1">Upload your photo first; choose a one-time custom pet option when you&apos;re ready to generate.</p>}
        </div>

        {(stage === 'select' || stage === 'preview' || stage === 'append') && (
          <p className="text-sm text-text-secondary text-center mb-6">
            Choose a clear photo where your pet stands out from the background, with paws visible where possible.
          </p>
        )}
        {tier === 'plus' && (petType === 'dog' || petType === 'cat') && (stage === 'done' || stage === 'appendActions') && (
          <p className="text-sm text-text-secondary text-center mb-6">
            For tail actions, choose a photo with the tail clearly visible. If it is hidden, choose another action.
          </p>
        )}

        <AnimatePresence mode="wait">

          {batchProgress ? (
            <GenerationProgress key="batch-progress" progress={batchProgress} working={isGenerating} error={error}
              onResume={() => { if (!generationBusy.current) { setError(null); setRestoreAttempt(attempt => attempt + 1); } }} />
          ) : <>

          {/* ═══════════════════════ FINALIZED ═══════════════════════ */}
          {stage === 'finalized' ? (
            <motion.div key="finalized" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="mb-6">
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-mint/10 border border-mint/30 text-mint font-semibold text-sm">
                  ✅ Your Desktop Pet is Ready!
                </span>
              </motion.div>

              {tier === 'plus' && <p className="text-text-secondary text-sm mb-6">{totalVideos === 1 ? 'This video is' : `These ${totalVideos} videos are`} locked and cannot be changed.</p>}

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
                {videoUrls.map((url, i) => (
                  <div key={i} className="bg-black rounded-2xl overflow-hidden shadow-xl">
                    <p className="text-center text-xs text-white/60 py-1 bg-black/80">{videoLabels[i]}</p>
                    <video src={url} autoPlay loop muted playsInline className="w-full" />
                    <div className="flex items-center justify-between px-3 py-2 bg-black/80">
                      <a href={url} download className="text-coral underline text-xs" target="_blank" rel="noopener">Download</a>
                    </div>
                  </div>
                ))}
              </div>

              {pairingCode && (
                <div className="p-4 bg-mint/5 rounded-xl border border-mint/20 text-center">
                  <p className="text-sm font-semibold text-mint mb-1">🔗 Your Pairing Code</p>
                  <code className="text-3xl font-mono font-bold tracking-[0.3em] text-coral select-all">{pairingCode}</code>
                  <p className="text-xs text-text-secondary/60 mt-2">Enter this code in the DeskBub desktop app to sync your pet.</p>
                </div>
              )}

              {/* ── Download guide ── */}
              <div className="mt-6 bg-gradient-to-b from-mint/5 to-white rounded-2xl border border-mint/20 p-6 text-center">
                <h3 className="font-display font-bold text-text-primary text-lg mb-4">📥 How to see your pet on your desktop</h3>
                <div className="grid sm:grid-cols-3 gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center">1</span>
                    <div><p className="text-sm font-semibold text-text-primary">Download the App</p><p className="text-xs text-text-secondary mt-0.5">Get DeskBub for Windows or Mac</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center">2</span>
                    <div><p className="text-sm font-semibold text-text-primary">Enter Pairing Code</p><p className="text-xs text-text-secondary mt-0.5">Open the app and enter the code below</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center">3</span>
                    <div><p className="text-sm font-semibold text-text-primary">Pet Appears!</p><p className="text-xs text-text-secondary mt-0.5">Your furry friend lives on your desktop</p></div>
                  </div>
                </div>
                <a href="/download" className="inline-block mt-5 px-6 py-3 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all shadow-lg text-sm">
                  ⬇ Download DeskBub
                </a>
              </div>
            </motion.div>
          ) : stage === 'append' || stage === 'appendActions' ? (
            /* ═══════════════════════ APPEND FLOW ═══════════════════════ */
            <motion.div key="append" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
              <h2 className="text-xl font-display font-bold text-text-primary text-center mb-2">➕ Add More Videos</h2>
              <p className="text-center text-text-secondary text-sm mb-6">
                You can add up to {Math.min(gensLeft, MAX_TOTAL - totalVideos)} more video{Math.min(gensLeft, MAX_TOTAL - totalVideos) !== 1 ? 's' : ''}
                &nbsp;({totalVideos}/{MAX_TOTAL} used)
              </p>

              {stage === 'append' && processedUrls.length === 0 && (
                <div>
                  <DropZone onFilesSelected={handleAppendFileSelected} maxFiles={Math.min(gensLeft, 3)}
                    title="Drop new photos" subtitle="Upload additional photos to generate more videos" />
                  {files.length > 0 && (
                    <div className="mt-6">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {previewUrls.map((url, i) => (
                          <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden"><img src={url} className="w-full h-full object-cover" /></div>
                        ))}
                      </div>
                      <div className="flex justify-center gap-3">
                        <button onClick={() => { setStage('done'); setFiles([]); setPreviewUrls([]); }}
                          className="px-4 py-3 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">Cancel</button>
                        <button onClick={handleAppendBGRemove}
                          className="px-6 py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark shadow-lg cursor-pointer">Remove Background ✨</button>
                      </div>
                    </div>
                  )}
                  {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
                </div>
              )}

              {stage === 'appendActions' && processedUrls.length > 0 && (
                <div>
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    {processedUrls.map((url, i) => (
                      <div key={i} className="w-32 h-40 rounded-lg overflow-hidden border-2 border-mint/40"><img src={url} className="w-full h-full object-contain" /></div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-3 mb-4">
                    {(Object.keys(petActions) as PetType[]).map(t => (
                      <button key={t} onClick={() => { setPetType(t); setChecked(petActions[t].actions.map(() => Array(processedUrls.length).fill(false))); setAppendActions(processedUrls.map(() => 0)); }}
                        className={`px-4 py-2 rounded-full font-semibold text-xs cursor-pointer ${petType === t ? 'bg-coral text-white shadow-lg' : 'bg-white border'}`}>
                        {petActions[t].label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 mb-6">
                    {processedUrls.map((_, k) => (
                      <div key={k} className="flex items-center gap-3 bg-white rounded-xl border p-3">
                        <span className="text-xs font-mono w-5">#{totalVideos + k + 1}</span>
                        <span className="text-sm text-text-secondary flex-1">New video {k + 1}</span>
                        <select value={appendActions[k] ?? 0} onChange={e => { const a = [...appendActions]; a[k] = parseInt(e.target.value); setAppendActions(a); }}
                          className="text-sm border rounded-lg p-2 cursor-pointer">
                          {petActions[petType].actions.map((act, ai) => <option key={ai} value={ai}>{act}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <button onClick={handleAppendGenerate} disabled={isGenerating || gensLeft <= 0}
                      className="px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-xl disabled:opacity-60 text-lg cursor-pointer">
                      {isGenerating ? 'Generating...' : `🎬 Generate ${Math.min(processedUrls.length, gensLeft, MAX_TOTAL - totalVideos)} Video${Math.min(processedUrls.length, gensLeft, MAX_TOTAL - totalVideos) !== 1 ? 's' : ''}`}
                    </button>
                    {isGenerating && <p className="text-xs text-text-secondary/60 mt-3">About 1 minute per video. Please wait...</p>}
                  </div>

                  <button onClick={() => { setStage('done'); setFiles([]); setPreviewUrls([]); setProcessedUrls([]); }}
                    className="block mx-auto mt-4 text-sm text-text-secondary hover:text-coral underline cursor-pointer">Cancel</button>
                </div>
              )}
            </motion.div>
          ) : stage === 'done' ? (
            /* ═══════════════════════ DONE ═══════════════════════ */
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">

              {/* ── No videos yet: show initial generation UI ── */}
              {videoUrls.length === 0 && (
                <div className="mb-8">
                  <div className="flex gap-4 mb-4 justify-center flex-wrap">
                    {processedUrls.map((url, i) => (
                      <div key={i} className="bg-white rounded-xl border-2 border-mint/40 p-3">
                        <p className="text-xs text-mint mb-1 text-center font-semibold">Photo #{i + 1}</p>
                        <div className="w-48 h-56 rounded-lg overflow-hidden mx-auto" style={{ backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb)', backgroundSize: '20px 20px', backgroundPosition: '0 0,10px 10px' }}>
                          <img src={url} className="w-full h-full object-contain" /></div>
                      </div>
                    ))}
                  </div>

                  {/* Pet type selector */}
                  <div className="flex justify-center gap-3 mb-4">
                    {(Object.keys(petActions) as PetType[]).map(t => (
                      <button key={t} onClick={() => { setPetType(t); setChecked(petActions[t].actions.map(() => Array(processedUrls.length).fill(false))); setAppendActions(processedUrls.map(() => 0)); }}
                        className={`px-4 py-2 rounded-full font-semibold text-xs cursor-pointer ${petType === t ? 'bg-coral text-white shadow-lg shadow-coral/25' : 'bg-white border border-gray-200 text-text-secondary hover:border-coral/30'}`}>
                        {petActions[t].label}
                      </button>
                    ))}
                  </div>

                  {/* Action grid — Plus only */}
                  {tier === 'plus' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-text-primary">Pick up to {MAX_ACTIONS} action-photo pairs</p>
                        <span className="text-xs font-bold text-coral">{checkedCount}/{MAX_ACTIONS}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-gray-100"><th className="text-left py-2 pr-4 text-text-secondary font-medium text-xs">Action</th>{processedUrls.map((_, pi) => <th key={pi} className="text-center py-2 px-3 text-text-secondary font-medium text-xs">Photo {pi + 1}</th>)}</tr></thead>
                          <tbody>
                            {petActions[petType].actions.map((action, ai) => (
                              <tr key={ai} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="py-3 pr-4 font-medium text-text-primary text-sm">{action}</td>
                                {processedUrls.map((_, pi) => (
                                  <td key={pi} className="text-center px-3 py-3">
                                    <button onClick={() => toggleCheck(ai, pi)} aria-label={`${action}, photo ${pi + 1}`} aria-pressed={checked[ai]?.[pi] || false}
                                      className={`w-10 h-10 rounded-xl text-lg font-bold cursor-pointer ${checked[ai]?.[pi] ? 'bg-coral text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                      {checked[ai]?.[pi] ? '✓' : ''}
                                    </button>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <button onClick={handleGenerate}
                      disabled={isGenerating || gensLeft <= 0 || (tier === 'plus' && checkedCount === 0)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer">
                      {isGenerating ? '🎬 Generating...' : `🎬 Generate ${tier === 'plus' ? checkedCount : 1} Video${(tier === 'plus' ? checkedCount : 1) !== 1 ? 's' : ''}`}
                    </button>
                    {isGenerating && <p className="text-xs text-text-secondary/60 mt-3">About 1 minute per video. Please wait...</p>}
                  </div>
                </div>
              )}

              {/* ── Has videos: show list ── */}
              {videoUrls.length > 0 && (
                <div className="mb-8">
                  <p className="text-center text-mint font-semibold mb-3">{totalVideos} Video{totalVideos !== 1 ? 's' : ''} Generated</p>
                  {isGenerating && <p role="status" className="text-center text-sm text-text-secondary mb-4">Finishing your saved actions. Your completed videos are safe.</p>}

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {videoUrls.map((url, i) => (
                      <div key={i} className={`bg-black rounded-2xl overflow-hidden shadow-xl ${totalVideos > FINAL && keepFlags[i] ? 'ring-2 ring-mint' : ''}`}>
                        <p className="text-center text-xs text-white/60 py-1 bg-black/80">#{i + 1} — {videoLabels[i]}</p>
                        <video src={url} autoPlay loop muted playsInline className="w-full" />
                        <div className="flex items-center justify-between px-3 py-2 bg-black/80">
                          <a href={url} download className="text-coral underline text-xs" target="_blank" rel="noopener">Download</a>
                          {totalVideos > FINAL && (
                            <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer font-semibold select-none">
                              <input type="checkbox" checked={keepFlags[i] || false} disabled={isGenerating}
                                onChange={() => {
                                  const f = [...keepFlags]; f[i] = !f[i];
                                  if (f.filter(v => v).length <= FINAL || !f[i]) setKeepFlags(f);
                                }}
                                className="w-5 h-5 accent-mint cursor-pointer" /> Keep
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Action buttons (Plus only) ── */}
                  {tier === 'plus' && (
                  <div className="flex justify-center gap-4 mt-6 flex-wrap">

                    {/* Add More Videos */}
                    {totalVideos < MAX_TOTAL && gensLeft > 0 && (
                      <button onClick={handleStartAppend} disabled={isGenerating}
                        className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-all text-sm cursor-pointer">
                        ➕ Add More Videos ({gensLeft} left · {totalVideos}/{MAX_TOTAL})
                      </button>
                    )}

                    {/* Finalize */}
                    {totalVideos > FINAL && (
                      <button onClick={handleFinalizeClick} disabled={isGenerating || keepCount !== FINAL}
                        className="px-6 py-3 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all disabled:opacity-50 text-sm cursor-pointer">
                        ✅ Finalize {keepCount}/{FINAL} Videos
                      </button>
                    )}

                    {/* Confirm when exactly FINAL */}
                    {totalVideos > 0 && totalVideos <= FINAL && (
                      <button onClick={handleFinalizeClick} disabled={isGenerating}
                        className="px-6 py-3 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all text-sm cursor-pointer">
                        ✅ Confirm & Lock Videos
                      </button>
                    )}
                  </div>
                  )}

                  {/* ── Download guide ── */}
                  {videoUrls.length > 0 && (
                  <div className="mt-8 bg-gradient-to-b from-mint/5 to-white rounded-2xl border border-mint/20 p-6 text-center">
                    <h3 className="font-display font-bold text-text-primary text-lg mb-4">📥 After confirming your videos</h3>
                    <div className="grid sm:grid-cols-3 gap-4 text-left">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center">1</span>
                        <div><p className="text-sm font-semibold text-text-primary">Download the App</p><p className="text-xs text-text-secondary mt-0.5">Get DeskBub for Windows or Mac</p></div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center">2</span>
                        <div><p className="text-sm font-semibold text-text-primary">Enter Pairing Code</p><p className="text-xs text-text-secondary mt-0.5">Your code appears after you confirm your videos</p></div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center">3</span>
                        <div><p className="text-sm font-semibold text-text-primary">Pet Appears!</p><p className="text-xs text-text-secondary mt-0.5">Your furry friend lives on your desktop</p></div>
                      </div>
                    </div>
                    <a href="/download" className="inline-block mt-5 px-6 py-3 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all shadow-lg text-sm">
                      ⬇ Download DeskBub
                    </a>
                  </div>
                  )}

                  <p className="mt-6 text-sm text-text-secondary text-center">Your candidate videos are saved. Confirm your selection above to sync them to the desktop app.</p>
                </div>
              )}

              {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
            </motion.div>
          ) : (
            /* ═══════════════════════ UPLOAD / PREVIEW / PROGRESS ═══════════════════════ */
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {stage === 'select' && (
                <div className="max-w-xl mx-auto">
                  <DropZone onFilesSelected={handleFileSelected} maxFiles={tier === 'plus' ? 5 : 1}
                    title={tier === 'plus' ? 'Drop 1–5 photos of your pet' : 'Drop a photo of your pet'}
                    subtitle={tier === 'plus' ? 'Plus — 5 actions, add more later, finalize 5' : 'Basic — 1 photo'} />
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                    <h3 className="font-display font-bold text-text-primary mb-5 text-lg">📸 Photo Tips</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[{ icon: '🐾', title: 'Front-facing', desc: 'Your pet looking at the camera works best' },
                        { icon: '🎨', title: 'Contrasting bg', desc: 'Avoid same color pet & background' },
                        { icon: '☀️', title: 'Good lighting', desc: 'Natural daylight gives the best results' },
                        { icon: '📷', title: 'Sharp & clear', desc: 'Blurry photos produce poor quality' },
                      ].map(tip => (
                        <div key={tip.title} className="flex items-start gap-3">
                          <span className="text-2xl shrink-0 mt-0.5">{tip.icon}</span>
                          <div><p className="text-sm font-semibold text-text-primary">{tip.title}</p><p className="text-xs text-text-secondary mt-0.5">{tip.desc}</p></div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {stage === 'preview' && files.length > 0 && (
                <div className="max-w-xl mx-auto">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden"><img src={url} className="w-full h-full object-cover" /></div>
                      ))}
                    </div>
                    {error && <p className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">Cancel</button>
                      <button onClick={handleBGRemove} className="flex-1 px-4 py-3 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark shadow-lg shadow-coral/25 cursor-pointer">Remove Background ✨</button>
                    </div>
                  </div>
                </div>
              )}

              {(stage === 'uploading' || stage === 'processing') && (
                <div className="max-w-xl mx-auto text-center">
                  <div className="bg-white rounded-2xl border p-12">
                    <div className="text-7xl mb-6 animate-bounce">{stage === 'uploading' ? '📤' : '✨'}</div>
                    <h3 className="text-xl font-bold mb-2">{stage === 'uploading' ? 'Uploading...' : 'Removing background...'}</h3>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-coral rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          </>}
        </AnimatePresence>

        {/* ═══════════════════════ FINALIZE CONFIRMATION DIALOG ═══════════════════════ */}
        {showFinalizeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-xl font-display font-bold text-text-primary mb-2">Confirm Final Selection</h2>
              <p className="text-text-secondary text-sm mb-6">
                Once confirmed, your final {totalVideos > FINAL ? FINAL : totalVideos} video{totalVideos > FINAL || totalVideos !== 1 ? 's' : ''} will be locked.
                You <strong className="text-coral">cannot</strong> add more videos or make changes after this.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowFinalizeConfirm(false)}
                  className="px-6 py-2.5 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleFinalizeConfirm}
                  className="px-6 py-2.5 text-sm font-semibold bg-mint text-white rounded-full hover:bg-mint-dark shadow-lg cursor-pointer">
                  ✅ Confirm & Lock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
