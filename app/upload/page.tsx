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
  const [redoFlags, setRedoFlags] = useState<boolean[]>([]);
  const [redoIndices, setRedoIndices] = useState<number[]>([]);
  const [redoPhotos, setRedoPhotos] = useState<string[]>([]);
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
        setRedoFlags(Array(d.videos.length).fill(false));
        setStage('done');
      }
    }).catch(() => {});
  }, [pairingCode]);

  const maxActions = tier === 'plus' ? 5 : 1;
  const gensLeft = Math.max(0, gensMax - gensUsed);

  const initChecked = (nPhotos: number) => {
    if (tier === 'plus') setChecked(petActions[petType].actions.map(() => Array(nPhotos).fill(false)));
  };

  const toggleCheck = (ai: number, pi: number) => {
    if (tier !== 'plus') return;
    const c = checked.map((row, i) => (i === ai ? [...row] : row));
    c[ai][pi] = !c[ai][pi];
    if (c.flat().filter(v => v).length > maxActions) return;
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
      if (pairs.length > maxActions) pairs.length = maxActions;
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
      setRedoFlags(Array(urls.length).fill(false));
      // Sync all videos to database
      try {
        await fetch('/api/sync-pet-data', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairingCode, videos: urls.map((u, i) => ({ url: u, label: labels[i] })) }),
        });
      } catch {}
      fetch('/api/check-subscription').then(r => r.json()).then(d => { setGensUsed(d.used || 0); setGensMax(d.max || 0); });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally { setIsGenerating(false); }
  };

  // Start redo: select videos to replace
  const handleStartRedo = () => {
    const idxs: number[] = [];
    redoFlags.forEach((v, i) => { if (v) idxs.push(i); });
    if (idxs.length === 0 || idxs.length > gensLeft) return;
    setRedoIndices(idxs);
    setRedoPhotos([]);
    setRedoActions(Array(idxs.length).fill(0));
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]);
    setStage('redo');
  };

  // Upload new photo for redo
  const handleRedoFileSelected = (fs: File[]) => {
    if (fs.length === 0) return;
    setFiles(fs); setError(null);
    setPreviewUrls(fs.map(f => URL.createObjectURL(f)));
    setStage('redo');
  };

  // Process redo photos
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
      setRedoPhotos(urls); setProgress(100);
      setStage('redo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.'); setStage('redo');
    }
  };

  // Generate redo videos
  const handleRedoGenerate = async () => {
    if (redoPhotos.length === 0) return;
    setStage('redoGenerate'); setIsGenerating(true); setError(null);
    try {
      const newUrls = [...videoUrls];
      const newLabels = [...videoLabels];
      for (let k = 0; k < redoIndices.length; k++) {
        const idx = redoIndices[k];
        const imgIdx = Math.min(k, redoPhotos.length - 1);
        const ai = redoActions[k] ?? 0;
        const res = await fetch('/api/generate-video', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: redoPhotos[imgIdx], petType, action: ai, actionLabel: petActions[petType].actions[ai], clear_first: false }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Redo failed.');
        newUrls[idx] = data.videoUrl;
        newLabels[idx] = petActions[petType].actions[ai];
      }
      setVideoUrls(newUrls); setVideoLabels(newLabels);
      setRedoFlags(Array(newUrls.length).fill(false));
      setRedoIndices([]); setRedoPhotos([]); setFiles([]); setPreviewUrls([]); setProcessedUrls([]);
      // Sync to database: delete old, insert all
      try {
        await fetch('/api/sync-pet-data', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairingCode, videos: newUrls.map((url, i) => ({ url, label: newLabels[i] })) }),
        });
      } catch {}
      setStage('done');
      fetch('/api/check-subscription').then(r => r.json()).then(d => { setGensUsed(d.used || 0); setGensMax(d.max || 0); });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redo failed.');
    } finally { setIsGenerating(false); setStage('done'); }
  };

  const handleReset = () => {
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]); setVideoUrls([]); setVideoLabels([]);
    setChecked([]); setRedoFlags([]); setRedoIndices([]); setRedoPhotos([]); setRedoActions([]);
    setError(null); setProgress(0); setStage('select');
  };

  const redoCount = redoFlags.filter(v => v).length;

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">Create Your Desktop Pet</h1>
          <p className="mt-2 text-text-secondary">
            {tier === 'plus' ? 'Plus member — 5 actions, 3 redo slots' : tier === 'basic' ? 'Basic member — 1 default action' : 'Subscribe to get started'}
          </p>
          {tier === 'plus' && <p className="text-xs text-mint mt-1">{gensLeft} generation{gensLeft !== 1 ? 's' : ''} remaining</p>}
        </div>

        <AnimatePresence mode="wait">
          {/* REDO STATE */}
          {stage === 'redo' || stage === 'redoGenerate' ? (
            <motion.div key="redo" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
              <h2 className="text-xl font-display font-bold text-text-primary text-center mb-4">🔄 Regenerate {redoIndices.length} Video{redoIndices.length > 1 ? 's' : ''}</h2>

              {/* Show kept videos */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-6">
                {videoUrls.map((url, i) => (
                  <div key={i} className={`rounded-xl overflow-hidden border-2 ${redoIndices.includes(i) ? 'border-coral opacity-40' : 'border-mint'}`}>
                    <p className="text-xs text-center py-1 bg-black/80 text-white/60">{videoLabels[i]}</p>
                    <div className="bg-black aspect-square relative">
                      <video src={url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      {redoIndices.includes(i) ? (
                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm bg-black/20">🔄 Replacing</span>
                      ) : (
                        <span className="absolute top-1 right-1 bg-mint text-white text-xs px-2 py-0.5 rounded-full">🔒 Kept</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {redoPhotos.length === 0 ? (
                <div>
                  <DropZone onFilesSelected={handleRedoFileSelected} maxFiles={redoIndices.length}
                    title={`Drop ${redoIndices.length} new photo${redoIndices.length > 1 ? 's' : ''}`} subtitle="Upload replacement photos for the selected videos" />
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
                  <p className="text-sm text-text-secondary text-center mb-3">{redoPhotos.length} photo{redoPhotos.length > 1 ? 's' : ''} ready — pick actions</p>
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    {redoPhotos.map((url, i) => (
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
                  {redoIndices.map((vidx, k) => (
                    <div key={k} className="flex items-center gap-3 bg-white rounded-xl border p-3 mb-2">
                      <span className="text-xs font-mono w-5">#{k + 1}</span>
                      <span className="text-sm text-text-secondary flex-1">Replacing: {videoLabels[vidx]}</span>
                      <select value={redoActions[k] ?? 0} onChange={e => { const a = [...redoActions]; a[k] = parseInt(e.target.value); setRedoActions(a); }}
                        className="text-sm border rounded-lg p-2">
                        {petActions[petType].actions.map((act, ai) => <option key={ai} value={ai}>{act}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="text-center mt-6">
                    <button onClick={handleRedoGenerate} disabled={isGenerating}
                      className="px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-xl disabled:opacity-60 text-lg cursor-pointer">
                      {isGenerating ? 'Regenerating...' : `🔄 Regenerate ${redoIndices.length} Video${redoIndices.length > 1 ? 's' : ''}`}
                    </button>
                    {isGenerating && <p className="text-xs text-text-secondary/60 mt-2">About 1 min per video. Please wait...</p>}
                  </div>
                  <button onClick={() => { setStage('done'); setRedoIndices([]); setRedoPhotos([]); setFiles([]); setPreviewUrls([]); }}
                    className="block mx-auto mt-4 text-sm text-text-secondary hover:text-coral underline cursor-pointer">Cancel redo</button>
                </div>
              )}
            </motion.div>
          ) : stage === 'done' ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
              {/* Video results + Redo */}
              <div className="mb-8">
                <p className="text-center text-mint font-semibold mb-3">{videoUrls.length} Video{videoUrls.length > 1 ? 's' : ''} Generated!</p>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {videoUrls.map((url, i) => (
                    <div key={i} className={`bg-black rounded-2xl overflow-hidden shadow-xl ${redoFlags[i] ? 'ring-2 ring-coral' : ''}`}>
                      <p className="text-center text-xs text-white/60 py-1 bg-black/80">{videoLabels[i]}</p>
                      <video src={url} autoPlay loop muted playsInline className="w-full" />
                      <div className="flex items-center justify-between px-3 py-2 bg-black/80">
                        <div className="flex gap-3">
                          <a href={url} download className="text-coral underline text-xs" target="_blank" rel="noopener">Download</a>
                          <a href={url} className="text-coral underline text-xs" target="_blank" rel="noopener">Copy</a>
                        </div>
                        {tier === 'plus' && gensLeft > 0 && (
                          <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer font-semibold select-none">
                            <input type="checkbox" checked={redoFlags[i]} onChange={() => { const f = [...redoFlags]; f[i] = !f[i]; setRedoFlags(f); }} className="w-5 h-5 accent-coral cursor-pointer" /> Redo
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {tier === 'plus' && redoCount > 0 && (
                  <div className="text-center mt-4">
                    <button onClick={handleStartRedo} disabled={redoCount > gensLeft}
                      className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-all disabled:opacity-50 cursor-pointer text-sm">
                      🔄 Regenerate Selected ({redoCount} — {gensLeft} left)
                    </button>
                    <p className="text-xs text-text-secondary/60 mt-2">You'll be able to upload new photos for the selected videos</p>
                  </div>
                )}

                {pairingCode && (
                  <div className="mt-4 p-4 bg-mint/5 rounded-xl border border-mint/20 text-center">
                    <p className="text-sm font-semibold text-mint mb-1">🔗 Your Pairing Code</p>
                    <code className="text-3xl font-mono font-bold tracking-[0.3em] text-coral select-all">{pairingCode}</code>
                  </div>
                )}
              </div>
              {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {stage === 'select' && (
                <div className="max-w-xl mx-auto">
                  <DropZone onFilesSelected={handleFileSelected} maxFiles={tier === 'plus' ? 5 : 1}
                    title={tier === 'plus' ? 'Drop 1-5 photos of your pet' : 'Drop a photo of your pet'}
                    subtitle={tier === 'plus' ? 'Plus member — up to 5 photos, 5 actions, 3 redos · JPG, PNG, WebP up to 10MB' : 'Basic member — 1 photo · JPG, PNG, WebP up to 10MB'} />
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
