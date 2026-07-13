'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DropZone from '@/components/upload/DropZone';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = 'select' | 'preview' | 'uploading' | 'processing' | 'done' | 'redo' | 'redoGenerate';
type Tier = 'basic' | 'plus' | 'free';
type PetType = 'dog' | 'cat' | 'other';

const MAX_ACTIONS = 5;
const MAX_TOTAL = 8;

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

  const [tier, setTier] = useState<Tier>('free');
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
  const [finalFlags, setFinalFlags] = useState<boolean[]>([]);
  const [redoFlags, setRedoFlags] = useState<boolean[]>([]);
  const [redoIndices, setRedoIndices] = useState<number[]>([]);
  const [redoActions, setRedoActions] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

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

  const FINAL_COUNT = tier === 'plus' ? MAX_ACTIONS : 1;
  const gensLeft = Math.max(0, gensMax - gensUsed);
  const totalVideos = videoUrls.length;
  const selectedCount = finalFlags.filter(v => v).length;
  const canRedo = totalVideos < MAX_TOTAL && gensLeft > 0;

  const syncToDB = async (urls: string[], labels: string[]) => {
    try {
      await fetch('/api/sync-pet-data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode, videos: urls.map((u, i) => ({ url: u, label: labels[i] })) }),
      });
    } catch {}
  };

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

  const totalSelected = checked.flat().filter(v => v).length;

  const handleFileSelected = (fs: File[]) => {
    if (fs.length === 0) return;
    setFiles(fs); setError(null);
    setPreviewUrls(fs.map(f => URL.createObjectURL(f)));
    setStage('preview');
  };

  const handleBGRemove = async () => {
    if (files.length === 0) return;
    if (tier === 'free') { router.push('/pricing'); return; }
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
    } else {
      pairs.push({ ai: 0, pi: 0 });
    }
    setIsGenerating(true); setError(null);
    try {
      const urls: string[] = []; const labels: string[] = [];
      for (let k = 0; k < pairs.length; k++) {
        const { ai, pi } = pairs[k];
        const res = await fetch('/api/generate-video', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: processedUrls[pi], petType, action: ai, actionLabel: petActions[petType].actions[ai], clear_first: k === 0 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed.');
        urls.push(data.videoUrl); labels.push(petActions[petType].actions[ai]);
      }
      setVideoUrls(urls); setVideoLabels(labels);
      setFinalFlags(urls.map((_, i) => i < FINAL_COUNT)); // First N pre-checked
      await syncToDB(urls, labels);
      fetch('/api/check-subscription').then(r => r.json()).then(d => { setGensUsed(d.used || 0); setGensMax(d.max || 0); });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally { setIsGenerating(false); }
  };

  // Redo: upload new photos, REPLACE selected videos
  const handleStartRedo = () => {
    const idxs: number[] = [];
    (redoFlags || []).forEach((v, i) => { if (v) idxs.push(i); });
    if (idxs.length === 0 || idxs.length > gensLeft) return;
    setRedoIndices(idxs);
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]);
    setRedoActions(Array(idxs.length).fill(0));
    setStage('redo');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.'); setStage('redo');
    }
  };

  const handleRedoGenerate = async () => {
    if (processedUrls.length === 0) return;
    const redoCount = Math.min(MAX_TOTAL - totalVideos, processedUrls.length);
    setStage('redoGenerate'); setIsGenerating(true); setError(null);
    try {
      const newUrls: string[] = [];
      const newLabels: string[] = [];
      for (let k = 0; k < redoCount; k++) {
        const ai = redoActions[k] ?? 0;
        const pi = Math.min(k, processedUrls.length - 1);
        const res = await fetch('/api/generate-video', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: processedUrls[pi], petType, action: ai, actionLabel: petActions[petType].actions[ai], clear_first: false }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Redo failed.');
        newUrls.push(data.videoUrl);
        newLabels.push(petActions[petType].actions[ai]);
      }
      // Append new videos to list
      const allUrls = [...videoUrls, ...newUrls];
      const allLabels = [...videoLabels, ...newLabels];
      setVideoUrls(allUrls); setVideoLabels(allLabels);
      setRedoFlags([]);
      setFiles([]); setPreviewUrls([]); setProcessedUrls([]); setRedoActions([]); setRedoIndices([]);
      await syncToDB(allUrls, allLabels);
      setStage('done');
      fetch('/api/check-subscription').then(r => r.json()).then(d => { setGensUsed(d.used || 0); setGensMax(d.max || 0); });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redo failed.');
    } finally { setIsGenerating(false); setStage('done'); }
  };

  // Finalize: pick exactly N videos, sync to DB
  const handleFinalize = async () => {
    if (selectedCount > FINAL_COUNT) return;
    const finalUrls: string[] = [];
    const finalLabels: string[] = [];
    videoUrls.forEach((url, i) => { if (finalFlags[i]) { finalUrls.push(url); finalLabels.push(videoLabels[i]); } });
    if (finalUrls.length === 0) return;
    await syncToDB(finalUrls, finalLabels);
    setVideoUrls(finalUrls); setVideoLabels(finalLabels);
    setFinalFlags(Array(finalUrls.length).fill(true));
  };

  const handleReset = () => {
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]); setVideoUrls([]); setVideoLabels([]);
    setChecked([]); setFinalFlags([]); setRedoActions([]);
    setError(null); setProgress(0); setStage('select');
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">Create Your Desktop Pet</h1>
          <p className="mt-2 text-text-secondary">
            {tier === 'plus' ? `Plus member — generate up to ${MAX_TOTAL}, keep your ${FINAL_COUNT} favorites` : tier === 'basic' ? 'Basic member — 1 default action' : 'Subscribe to get started'}
          </p>
          {tier === 'plus' && <p className="text-xs text-mint mt-1">{gensLeft} generation{gensLeft !== 1 ? 's' : ''} remaining · {totalVideos}/{MAX_TOTAL} generated · {selectedCount}/{FINAL_COUNT} selected</p>}
        </div>

        <AnimatePresence mode="wait">
          {/* REDO STATE */}
          {stage === 'redo' || stage === 'redoGenerate' ? (
            <motion.div key="redo" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
              <h2 className="text-xl font-display font-bold text-text-primary text-center mb-4">🔄 Add More Videos</h2>
              <p className="text-center text-text-secondary text-sm mb-4">You have {totalVideos}/{MAX_TOTAL}. Add up to {Math.min(MAX_TOTAL - totalVideos, gensLeft)} more.</p>

              {processedUrls.length === 0 ? (
                <div>
                  <DropZone onFilesSelected={handleRedoFileSelected} maxFiles={Math.min(MAX_TOTAL - totalVideos, 3)}
                    title="Drop new photos" subtitle="Upload more photos to generate additional actions" />
                  {files.length > 0 && (
                    <div className="mt-6">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {previewUrls.map((url, i) => (
                          <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden"><img src={url} className="w-full h-full object-cover" /></div>
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <button onClick={handleRedoBGRemove} className="px-6 py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark shadow-lg cursor-pointer">
                          Remove Background ✨
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-text-secondary text-center mb-3">{processedUrls.length} photo{processedUrls.length > 1 ? 's' : ''} ready</p>
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    {processedUrls.map((url, i) => (
                      <div key={i} className="w-32 h-40 rounded-lg overflow-hidden border-2 border-mint/40"><img src={url} className="w-full h-full object-contain" /></div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-3 mb-4">
                    {(Object.keys(petActions) as PetType[]).map(t => (
                      <button key={t} onClick={() => setPetType(t)} className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${petType === t ? 'bg-coral text-white shadow-lg' : 'bg-white border'}`}>
                        {petActions[t].label}
                      </button>
                    ))}
                  </div>
                  {processedUrls.map((_, k) => (
                    <div key={k} className="flex items-center gap-3 bg-white rounded-xl border p-3 mb-2">
                      <span className="text-xs font-mono w-5">#{totalVideos + k + 1}</span>
                      <span className="text-sm text-text-secondary flex-1">New video</span>
                      <select value={redoActions[k] ?? 0} onChange={e => { const a = [...redoActions]; a[k] = parseInt(e.target.value); setRedoActions(a); }}
                        className="text-sm border rounded-lg p-2">
                        {petActions[petType].actions.map((act, ai) => <option key={ai} value={ai}>{act}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="text-center mt-6">
                    <button onClick={handleRedoGenerate} disabled={isGenerating}
                      className="px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-xl disabled:opacity-60 text-lg cursor-pointer">
                      {isGenerating ? 'Generating...' : `🎬 Generate ${processedUrls.length} Video${processedUrls.length > 1 ? 's' : ''}`}
                    </button>
                  </div>
                  <button onClick={() => { setStage('done'); setFiles([]); setPreviewUrls([]); setProcessedUrls([]); }}
                    className="block mx-auto mt-4 text-sm text-text-secondary hover:text-coral underline cursor-pointer">Cancel</button>
                </div>
              )}
            </motion.div>
          ) : stage === 'done' ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
              {/* Initial generation UI — show when no videos yet */}
              {videoUrls.length === 0 && (
                <div className="mb-8">
                  {/* Photos */}
                  <div className="flex gap-4 mb-4 justify-center flex-wrap">
                    {processedUrls.map((url, i) => (
                      <div key={i} className="bg-white rounded-xl border-2 border-mint/40 p-3">
                        <p className="text-xs text-mint mb-1 text-center font-semibold">Photo #{i + 1}</p>
                        <div className="w-48 h-56 rounded-lg overflow-hidden mx-auto" style={{backgroundImage:'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb)',backgroundSize:'20px 20px',backgroundPosition:'0 0,10px 10px'}}>
                          <img src={url} alt={`Pet ${i + 1}`} className="w-full h-full object-contain" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {tier === 'plus' && (
                    <>
                      <div className="flex justify-center gap-3 mb-4">
                        {(Object.keys(petActions) as PetType[]).map(t => (
                          <button key={t} onClick={() => setPetType(t)} className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${petType === t ? 'bg-coral text-white shadow-lg shadow-coral/25' : 'bg-white border border-gray-200 text-text-secondary hover:border-coral/30'}`}>
                            {petActions[t].label}
                          </button>
                        ))}
                      </div>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-text-primary">Pick up to {MAX_ACTIONS} action-photo pairs</p>
                          <span className="text-xs font-bold text-coral">{totalSelected}/{MAX_ACTIONS}</span>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full text-sm">
                          <thead><tr className="border-b border-gray-100"><th className="text-left py-2 pr-4 text-text-secondary font-medium text-xs">Action</th>{processedUrls.map((_, pi) => <th key={pi} className="text-center py-2 px-3 text-text-secondary font-medium text-xs">Photo {pi + 1}</th>)}</tr></thead>
                          <tbody>{petActions[petType].actions.map((action, ai) => (
                            <tr key={ai} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-3 pr-4 font-medium text-text-primary text-sm">{action}</td>
                              {processedUrls.map((_, pi) => (
                                <td key={pi} className="text-center px-3 py-3">
                                  <button onClick={() => toggleCheck(ai, pi)} className={`w-10 h-10 rounded-xl text-lg font-bold transition-all ${checked[ai]?.[pi] ? 'bg-coral text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                    {checked[ai]?.[pi] ? '✓' : ''}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          ))}</tbody>
                        </table></div>
                      </div>
                    </>
                  )}

                  <div className="text-center">
                    <button onClick={handleGenerate} disabled={isGenerating || (tier === 'plus' && totalSelected === 0)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer">
                      {isGenerating ? '🎬 Generating...' : tier === 'plus' ? `🎬 Generate ${totalSelected} Videos` : '🎬 Generate Video'}
                    </button>
                    {isGenerating && <p className="text-xs text-text-secondary/60 mt-3">About 1 min per video. Please wait...</p>}
                  </div>
                </div>
              )}

              {/* Video results — show after generation */}
              {videoUrls.length > 0 && (
              <div className="mb-8">
                <p className="text-center text-mint font-semibold mb-3">{totalVideos} Video{totalVideos !== 1 ? 's' : ''} · Select {FINAL_COUNT} final</p>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {videoUrls.map((url, i) => (
                    <div key={i} className={`bg-black rounded-2xl overflow-hidden shadow-xl ${finalFlags[i] ? 'ring-2 ring-mint' : 'opacity-60'}`}>
                      <p className="text-center text-xs text-white/60 py-1 bg-black/80">{videoLabels[i]}</p>
                      <video src={url} autoPlay loop muted playsInline className="w-full" />
                      <div className="flex items-center justify-between px-3 py-2 bg-black/80">
                        <a href={url} download className="text-coral underline text-xs" target="_blank" rel="noopener">Download</a>
                        {totalVideos > FINAL_COUNT && (
                          <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer font-semibold select-none">
                            <input type="checkbox" checked={finalFlags[i]} onChange={() => {
                              const f = [...finalFlags]; f[i] = !f[i];
                              if (f.filter(v => v).length <= FINAL_COUNT) setFinalFlags(f);
                            }} className="w-5 h-5 accent-mint cursor-pointer" /> Keep
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  {gensLeft > 0 && totalVideos < MAX_TOTAL && (
                    <button onClick={handleStartRedo}
                      className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-all text-sm cursor-pointer">
                      🔄 Add More ({gensLeft} left)
                    </button>
                  )}
                  {totalVideos > FINAL_COUNT && (
                    <button onClick={handleFinalize} disabled={selectedCount !== FINAL_COUNT}
                      className="px-6 py-3 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all disabled:opacity-50 text-sm cursor-pointer">
                      ✅ Finalize {selectedCount}/{FINAL_COUNT} Videos
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
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {stage === 'select' && (
                <div className="max-w-xl mx-auto">
                  <DropZone onFilesSelected={handleFileSelected} maxFiles={tier === 'plus' ? 5 : 1}
                    title={tier === 'plus' ? 'Drop 1-5 photos of your pet' : 'Drop a photo of your pet'}
                    subtitle={tier === 'plus' ? 'Plus member — up to 5 photos, 5 actions, up to 3 redos · JPG, PNG, WebP up to 10MB' : 'Basic member — 1 photo · JPG, PNG, WebP up to 10MB'} />
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                    <h3 className="font-display font-bold text-text-primary mb-5 text-lg">📸 Photo Tips</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { icon: '🐾', title: 'Front-facing', desc: 'Your pet looking at the camera works best' },
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
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="grid grid-cols-3 gap-3 mb-6">{previewUrls.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden"><img src={url} alt={`Pet ${i + 1}`} className="w-full h-full object-cover" /></div>
                    ))}</div>
                    {error && <p className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">Cancel</button>
                      <button onClick={handleBGRemove} className="flex-1 px-4 py-3 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark shadow-lg shadow-coral/25 cursor-pointer">Remove Background ✨</button>
                    </div>
                  </motion.div>
                </div>
              )}
              {(stage === 'uploading' || stage === 'processing') && (
                <div className="max-w-xl mx-auto text-center"><div className="bg-white rounded-2xl border p-12">
                  <motion.div animate={{ scale: [1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }} className="text-7xl mb-6">{stage === 'uploading' ? '📤' : '✨'}</motion.div>
                  <h3 className="text-xl font-bold mb-2">{stage === 'uploading' ? 'Uploading...' : 'Removing background...'}</h3>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-coral to-mint rounded-full" animate={{ width: `${progress}%` }} /></div>
                </div></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
