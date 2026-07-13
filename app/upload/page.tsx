'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DropZone from '@/components/upload/DropZone';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = 'select' | 'preview' | 'uploading' | 'processing' | 'done' | 'redo' | 'redoGen';
type PetType = 'dog' | 'cat' | 'other';

const petActions: Record<PetType, { label: string; actions: string[] }> = {
  dog: { label: '🐶 Dog', actions: ['Panting & tongue out', 'Head tilting curiously', 'Tail wagging excitedly', 'Lying down relaxed', 'Sitting looking up'] },
  cat: { label: '🐱 Cat', actions: ['Licking paw & grooming', 'Stretching & arching back', 'Curling up sleepy', 'Tail swishing slowly', 'Pouncing playfully'] },
  other: { label: '🐾 Other Pet', actions: ['Casual walk exploring', 'Looking around curiously', 'Sitting calmly', 'Head tilting cute', 'Nibbling delicately'] },
};

export default function UploadPage() {
  const { user } = useUser();
  const router = useRouter();
  const pairingCode = useMemo(() => {
    if (!user) return null;
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) { hash = ((hash << 5) - hash) + user.id.charCodeAt(i); hash |= 0; }
    return String(Math.abs(hash) % 1000000).padStart(6, '0');
  }, [user]);

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
  const [redoFlags, setRedoFlags] = useState<boolean[]>([]);
  const [keepFlags, setKeepFlags] = useState<boolean[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const MAX_ACTIONS = tier === 'plus' ? 5 : 1;
  const FINAL = 5;
  const MAX_TOTAL = 8;
  const gensLeft = Math.max(0, gensMax - gensUsed);
  const totalVideos = videoUrls.length;

  useEffect(() => {
    fetch('/api/check-subscription').then(r => r.json()).then(d => {
      setTier(d.tier === 'plus' ? 'plus' : d.tier === 'basic' ? 'basic' : 'free');
      setGensUsed(d.used || 0); setGensMax(d.max || 0);
    });
  }, []);

  useEffect(() => {
    if (!pairingCode) return;
    fetch(`/api/pairing/${pairingCode}`).then(r => r.json()).then(d => {
      if (d.videos && d.videos.length > 0) {
        setVideoUrls(d.videos.map((v: any) => v.url));
        setVideoLabels(d.videos.map((v: any) => v.label));
        setStage('done');
      }
    }).catch(() => {});
  }, [pairingCode]);

  const syncToDB = async (urls: string[], labels: string[]) => {
    await fetch('/api/sync-pet-data', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairingCode, videos: urls.map((u, i) => ({ url: u, label: labels[i] })) }) }).catch(() => {});
  };

  const refreshSub = () => {
    fetch('/api/check-subscription').then(r => r.json()).then(d => {
      setGensUsed(d.used || 0); setGensMax(d.max || 0);
    });
  };

  // ── Stage 1: Initial generation ──
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

  const handleFileSelected = (fs: File[]) => {
    if (fs.length === 0) return;
    setFiles(fs); setError(null);
    setPreviewUrls(fs.map(f => URL.createObjectURL(f)));
    setStage('preview');
  };

  const handleBGRemove = async () => {
    if (files.length === 0 || tier === 'free') { router.push('/pricing'); return; }
    setStage('uploading'); setProgress(0); setError(null);
    try {
      const supabase = createClient();
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fn = `${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { data: up, error: ue } = await supabase.storage.from('pet-photos').upload(fn, f, { cacheControl: '3600', upsert: false });
        if (ue) throw new Error(`Upload failed: ${f.name}`);
        const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(up.path);
        setProgress(Math.round(((i + 1) / files.length) * 50));
        setStage('processing');
        const res = await fetch('/api/generate-pet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: urlData.publicUrl }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'BG removal failed.');
        urls.push(data.processedUrl);
      }
      setProcessedUrls(urls); setProgress(100);
      if (tier === 'plus') initChecked(urls.length);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.'); setStage('preview');
    }
  };

  const handleGenerate = async () => {
    const pairs: { ai: number; pi: number }[] = [];
    if (tier === 'plus') {
      checked.forEach((row, ai) => row.forEach((v, pi) => { if (v) pairs.push({ ai, pi }); }));
      if (pairs.length > MAX_ACTIONS) pairs.length = MAX_ACTIONS;
    } else pairs.push({ ai: 0, pi: 0 });
    setIsGenerating(true); setError(null);
    try {
      const urls: string[] = []; const labels: string[] = [];
      for (let k = 0; k < pairs.length; k++) {
        const { ai, pi } = pairs[k];
        const res = await fetch('/api/generate-video', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: processedUrls[pi], petType, action: ai, actionLabel: petActions[petType].actions[ai] }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed.');
        urls.push(data.videoUrl); labels.push(petActions[petType].actions[ai]);
      }
      setVideoUrls(urls); setVideoLabels(labels);
      setRedoFlags(Array(urls.length).fill(false));
      setKeepFlags(Array(urls.length).fill(true));
      await syncToDB(urls, labels);
      refreshSub();
    } catch (err) { setError(err instanceof Error ? err.message : 'Generation failed.'); }
    finally { setIsGenerating(false); }
  };

  // ── Stage 2: Redo ── APPEND new videos
  const handleStartRedo = () => {
    const idxs: number[] = [];
    redoFlags.forEach((v, i) => { if (v) idxs.push(i); });
    if (idxs.length === 0 || idxs.length > gensLeft) return;
    setStage('redo');
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]);
  };

  const handleRedoFileSelected = (fs: File[]) => {
    if (fs.length === 0) return;
    setFiles(fs); setError(null);
    setPreviewUrls(fs.map(f => URL.createObjectURL(f)));
  };

  const handleRedoBGRemove = async () => {
    if (files.length === 0) return;
    setStage('uploading'); setProgress(0); setError(null);
    try {
      const supabase = createClient();
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fn = `${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { data: up, error: ue } = await supabase.storage.from('pet-photos').upload(fn, f, { cacheControl: '3600', upsert: false });
        if (ue) throw new Error(`Upload failed: ${f.name}`);
        const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(up.path);
        setProgress(Math.round(((i + 1) / files.length) * 50));
        setStage('processing');
        const res = await fetch('/api/generate-pet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: urlData.publicUrl }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'BG removal failed.');
        urls.push(data.processedUrl);
      }
      setProcessedUrls(urls); setProgress(100);
      setStage('redo');
    } catch (err) { setError(err instanceof Error ? err.message : 'Error.'); setStage('redo'); }
  };

  const handleRedoGenerate = async () => {
    if (processedUrls.length === 0) return;
    const genCount = Math.min(processedUrls.length, gensLeft, MAX_TOTAL - totalVideos);
    setStage('redoGen'); setIsGenerating(true); setError(null);
    try {
      const newUrls: string[] = []; const newLabels: string[] = [];
      for (let k = 0; k < genCount; k++) {
        const ai = 0; // default action, can add selector later
        const pi = Math.min(k, processedUrls.length - 1);
        const res = await fetch('/api/generate-video', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: processedUrls[pi], petType, action: ai, actionLabel: petActions[petType].actions[ai] }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Redo failed.');
        newUrls.push(data.videoUrl); newLabels.push(petActions[petType].actions[ai]);
      }
      // APPEND
      const allUrls = [...videoUrls, ...newUrls];
      const allLabels = [...videoLabels, ...newLabels];
      setVideoUrls(allUrls); setVideoLabels(allLabels);
      setRedoFlags(Array(allUrls.length).fill(false));
      setKeepFlags(allUrls.map((_, i) => i < FINAL));
      setFiles([]); setPreviewUrls([]); setProcessedUrls([]);
      await syncToDB(allUrls, allLabels);
      refreshSub();
      setStage('done');
    } catch (err) { setError(err instanceof Error ? err.message : 'Redo failed.'); }
    finally { setIsGenerating(false); }
  };

  // ── Stage 3: Finalize ── pick FINAL videos
  const handleFinalize = async () => {
    const finalUrls: string[] = []; const finalLabels: string[] = [];
    videoUrls.forEach((url, i) => { if (keepFlags[i]) { finalUrls.push(url); finalLabels.push(videoLabels[i]); } });
    if (finalUrls.length !== FINAL) return;
    await syncToDB(finalUrls, finalLabels);
    setVideoUrls(finalUrls); setVideoLabels(finalLabels);
    setKeepFlags(Array(FINAL).fill(true));
    setRedoFlags(Array(FINAL).fill(false));
  };

  const handleReset = () => {
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]); setVideoUrls([]); setVideoLabels([]);
    setChecked([]); setRedoFlags([]); setKeepFlags([]);
    setError(null); setProgress(0); setStage('select');
  };

  const redoCount = redoFlags.filter(v => v).length;
  const keepCount = keepFlags.filter(v => v).length;
  const canRedo = totalVideos < MAX_TOTAL && gensLeft > 0;

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">Create Your Desktop Pet</h1>
          <p className="mt-2 text-text-secondary">
            {tier === 'plus'
              ? `Plus — Step 1: choose 5 actions · Step 2: redo up to 3 to improve · Step 3: pick your ${FINAL} favorites`
              : tier === 'basic' ? 'Basic — 1 default action' : 'Subscribe to get started'}
          </p>
          {tier === 'plus' && <p className="text-xs text-mint mt-1">{gensLeft} generations remaining · {totalVideos} videos generated</p>}
        </div>

        <AnimatePresence mode="wait">
          {/* ── REDO FLOW ── */}
          {(stage === 'redo' || stage === 'redoGen') ? (
            <motion.div key="redo" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
              <h2 className="text-xl font-display font-bold text-text-primary text-center mb-4">🔄 Add More Videos</h2>
              <p className="text-center text-text-secondary text-sm mb-4">Upload up to {Math.min(gensLeft, MAX_TOTAL - totalVideos)} new photos</p>
              {processedUrls.length === 0 ? (
                <div>
                  <DropZone onFilesSelected={handleRedoFileSelected} maxFiles={Math.min(gensLeft, 3)} title="Drop new photos" subtitle="Upload replacement photos" />
                  {files.length > 0 && (
                    <div className="mt-6">
                      <div className="grid grid-cols-3 gap-3 mb-4">{previewUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden"><img src={url} className="w-full h-full object-cover" /></div>
                      ))}</div>
                      <div className="flex justify-center">
                        <button onClick={handleRedoBGRemove} className="px-6 py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark shadow-lg cursor-pointer">Remove Background ✨</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex gap-3 justify-center flex-wrap mb-4">{processedUrls.map((url, i) => (
                    <div key={i} className="w-32 h-40 rounded-lg overflow-hidden border-2 border-mint/40"><img src={url} className="w-full h-full object-contain" /></div>
                  ))}</div>
                  <div className="flex justify-center gap-3 mb-4">{(Object.keys(petActions) as PetType[]).map(t => (
                    <button key={t} onClick={() => setPetType(t)} className={`px-4 py-2 rounded-full font-semibold text-xs ${petType === t ? 'bg-coral text-white shadow-lg' : 'bg-white border'}`}>{petActions[t].label}</button>
                  ))}</div>
                  <div className="text-center">
                    <button onClick={handleRedoGenerate} disabled={isGenerating} className="px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-xl disabled:opacity-60 text-lg cursor-pointer">
                      {isGenerating ? 'Generating...' : `🎬 Generate ${Math.min(processedUrls.length, gensLeft)} Videos`}
                    </button>
                  </div>
                  <button onClick={() => { setStage('done'); setFiles([]); setPreviewUrls([]); setProcessedUrls([]); }}
                    className="block mx-auto mt-4 text-sm text-text-secondary hover:text-coral underline cursor-pointer">Cancel</button>
                </div>
              )}
            </motion.div>
          ) : stage === 'done' ? (
            /* ── VIDEO LIST ── */
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
              {/* Initial generation UI */}
              {videoUrls.length === 0 && (
                <div className="mb-8">
                  <div className="flex gap-4 mb-4 justify-center flex-wrap">{processedUrls.map((url, i) => (
                    <div key={i} className="bg-white rounded-xl border-2 border-mint/40 p-3">
                      <p className="text-xs text-mint mb-1 text-center font-semibold">Photo #{i + 1}</p>
                      <div className="w-48 h-56 rounded-lg overflow-hidden mx-auto" style={{backgroundImage:'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb)',backgroundSize:'20px 20px',backgroundPosition:'0 0,10px 10px'}}>
                        <img src={url} className="w-full h-full object-contain" /></div>
                    </div>
                  ))}</div>
                  {tier === 'plus' && (<>
                    <div className="flex justify-center gap-3 mb-4">{(Object.keys(petActions) as PetType[]).map(t => (
                      <button key={t} onClick={() => setPetType(t)} className={`px-4 py-2 rounded-full font-semibold text-xs ${petType === t ? 'bg-coral text-white shadow-lg shadow-coral/25' : 'bg-white border border-gray-200 text-text-secondary hover:border-coral/30'}`}>{petActions[t].label}</button>
                    ))}</div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-text-primary">Pick up to {MAX_ACTIONS} action-photo pairs</p><span className="text-xs font-bold text-coral">{checked.flat().filter(v => v).length}/{MAX_ACTIONS}</span></div>
                      <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-100"><th className="text-left py-2 pr-4 text-text-secondary font-medium text-xs">Action</th>{processedUrls.map((_, pi) => <th key={pi} className="text-center py-2 px-3 text-text-secondary font-medium text-xs">Photo {pi + 1}</th>)}</tr></thead>
                        <tbody>{petActions[petType].actions.map((action, ai) => (
                          <tr key={ai} className="border-b border-gray-50 hover:bg-gray-50/50"><td className="py-3 pr-4 font-medium text-text-primary text-sm">{action}</td>
                          {processedUrls.map((_, pi) => (<td key={pi} className="text-center px-3 py-3">
                            <button onClick={() => toggleCheck(ai, pi)} className={`w-10 h-10 rounded-xl text-lg font-bold ${checked[ai]?.[pi] ? 'bg-coral text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{checked[ai]?.[pi] ? '✓' : ''}</button>
                          </td>))}</tr>
                        ))}</tbody>
                      </table></div>
                    </div>
                  </>)}
                  <div className="text-center">
                    <button onClick={handleGenerate} disabled={isGenerating || (tier === 'plus' && checked.flat().filter(v => v).length === 0)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer">
                      {isGenerating ? '🎬 Generating...' : `🎬 Generate ${tier === 'plus' ? checked.flat().filter(v => v).length : 1} Videos`}
                    </button>
                  </div>
                </div>
              )}

              {/* Video results */}
              {videoUrls.length > 0 && (
                <div className="mb-8">
                  <p className="text-center text-mint font-semibold mb-3">{totalVideos} Video{totalVideos !== 1 ? 's' : ''}</p>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {videoUrls.map((url, i) => (
                      <div key={i} className={`bg-black rounded-2xl overflow-hidden shadow-xl ${totalVideos > FINAL && keepFlags[i] ? 'ring-2 ring-mint' : ''}`}>
                        <p className="text-center text-xs text-white/60 py-1 bg-black/80">{videoLabels[i]}</p>
                        <video src={url} autoPlay loop muted playsInline className="w-full" />
                        <div className="flex items-center justify-between px-3 py-2 bg-black/80">
                          <a href={url} download className="text-coral underline text-xs" target="_blank" rel="noopener">Download</a>
                          {totalVideos > FINAL ? (
                            <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer font-semibold select-none">
                              <input type="checkbox" checked={keepFlags[i]} onChange={() => {
                                const f = [...keepFlags]; f[i] = !f[i];
                                if (f.filter(v => v).length <= FINAL) setKeepFlags(f);
                              }} className="w-5 h-5 accent-mint cursor-pointer" /> Keep
                            </label>
                          ) : canRedo && (
                            <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer font-semibold select-none">
                              <input type="checkbox" checked={redoFlags[i] || false} onChange={() => { const f = [...redoFlags]; f[i] = !f[i]; setRedoFlags(f); }} className="w-5 h-5 accent-coral cursor-pointer" /> Redo
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {/* Redo: only when ≤ FINAL and there's room to add */}
                    {totalVideos <= FINAL && canRedo && redoCount > 0 && (
                      <button onClick={handleStartRedo} className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-all text-sm cursor-pointer">
                        🔄 Redo Selected ({redoCount} · {gensLeft} left)
                      </button>
                    )}
                    {totalVideos <= FINAL && canRedo && redoCount === 0 && (
                      <p className="text-xs text-text-secondary/60">Check videos above to redo</p>
                    )}
                    {/* Finalize: only when > FINAL */}
                    {totalVideos > FINAL && (
                      <button onClick={handleFinalize} disabled={keepCount !== FINAL}
                        className="px-6 py-3 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all disabled:opacity-50 text-sm cursor-pointer">
                        ✅ Finalize {keepCount}/{FINAL} Videos
                      </button>
                    )}
                  </div>

                  {pairingCode && (
                    <div className="mt-4 p-4 bg-mint/5 rounded-xl border border-mint/20 text-center">
                      <p className="text-sm font-semibold text-mint mb-1">🔗 Your Pairing Code</p>
                      <code className="text-3xl font-mono font-bold tracking-[0.3em] text-coral select-all">{pairingCode}</code>
                    </div>
                  )}
                </div>
              )}
              {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
            </motion.div>
          ) : (
            /* ── UPLOAD / PREVIEW ── */
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {stage === 'select' && (
                <div className="max-w-xl mx-auto">
                  <DropZone onFilesSelected={handleFileSelected} maxFiles={tier === 'plus' ? 5 : 1}
                    title={tier === 'plus' ? 'Drop 1-5 photos of your pet' : 'Drop a photo of your pet'}
                    subtitle={tier === 'plus' ? 'Plus — 5 actions, redo up to 3, finalize 5' : 'Basic — 1 photo'} />
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                    <h3 className="font-display font-bold text-text-primary mb-5 text-lg">📸 Photo Tips</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[{ icon: '🐾', title: 'Front-facing', desc: 'Your pet looking at the camera works best' },
                        { icon: '🎨', title: 'Contrasting bg', desc: 'Avoid same color pet & background' },
                        { icon: '☀️', title: 'Good lighting', desc: 'Natural daylight gives the best results' },
                        { icon: '📷', title: 'Sharp & clear', desc: 'Blurry photos produce poor quality' },
                      ].map(tip => (
                        <div key={tip.title} className="flex items-start gap-3"><span className="text-2xl shrink-0 mt-0.5">{tip.icon}</span>
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
                    <div className="grid grid-cols-3 gap-3 mb-6">{previewUrls.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden"><img src={url} className="w-full h-full object-cover" /></div>
                    ))}</div>
                    {error && <p className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">Cancel</button>
                      <button onClick={handleBGRemove} className="flex-1 px-4 py-3 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark shadow-lg shadow-coral/25 cursor-pointer">Remove Background ✨</button>
                    </div>
                  </div>
                </div>
              )}
              {(stage === 'uploading' || stage === 'processing') && (
                <div className="max-w-xl mx-auto text-center"><div className="bg-white rounded-2xl border p-12">
                  <div className="text-7xl mb-6 animate-bounce">{stage === 'uploading' ? '📤' : '✨'}</div>
                  <h3 className="text-xl font-bold mb-2">{stage === 'uploading' ? 'Uploading...' : 'Removing background...'}</h3>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-coral rounded-full" style={{width:`${progress}%`,transition:'width 0.5s'}} /></div>
                </div></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
