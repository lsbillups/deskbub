'use client';

import { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DropZone from '@/components/upload/DropZone';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = 'select' | 'preview' | 'uploading' | 'processing' | 'done';
type PetType = 'dog' | 'cat' | 'other';

const MAX_ACTIONS = 2;

const petActions: Record<PetType, { label: string; actions: string[] }> = {
  dog: { label: '🐶 Dog', actions: ['Panting & tongue out', 'Head tilting curiously', 'Tail wagging excitedly', 'Lying down relaxed', 'Sitting looking up', 'Playful light jog'] },
  cat: { label: '🐱 Cat', actions: ['Licking paw & grooming', 'Stretching & arching back', 'Curling up sleepy', 'Tail swishing slowly', 'Pouncing playfully', 'Sitting & washing face'] },
  other: { label: '🐾 Other Pet', actions: ['Casual walk exploring', 'Looking around curiously', 'Sitting calmly', 'Head tilting cute', 'Nibbling delicately', 'Stretching relaxing'] },
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

  const [stage, setStage] = useState<Stage>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [processedUrls, setProcessedUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoLabels, setVideoLabels] = useState<string[]>([]);
  const [petType, setPetType] = useState<PetType>('dog');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  // Grid: [actionIndex][photoIndex] = boolean
  const [checked, setChecked] = useState<boolean[][]>([]);

  const initChecked = (numPhotos: number) => {
    const actions = petActions[petType].actions;
    const c: boolean[][] = actions.map(() => Array(numPhotos).fill(false));
    setChecked(c);
  };

  const toggleCheck = (ai: number, pi: number) => {
    const c = checked.map((row, i) => (i === ai ? [...row] : row));
    const newVal = !c[ai][pi];

    // Count active actions (rows with any check)
    const actionHasAny = (row: boolean[]) => row.some((v: boolean) => v);
    const currentActive = c.filter(actionHasAny).length;
    const willBeActive = newVal ? c[ai].some((v: boolean) => v) || !actionHasAny(c[ai]) : (() => {
      const tmp = [...c[ai]];
      tmp[pi] = false;
      return tmp.some((v: boolean) => v);
    })();

    // Check max actions limit
    if (newVal && !c[ai].some((v: boolean) => v) && currentActive >= MAX_ACTIONS) return;

    c[ai][pi] = newVal;
    setChecked(c);
  };

  const activeActionCount = checked.filter((row) => row.some((v) => v)).length;
  const totalSelected = checked.flat().filter((v) => v).length;

  const handleFileSelected = (fs: File[]) => {
    if (fs.length === 0) return;
    setFiles(fs); setError(null);
    setPreviewUrls(fs.map((f) => URL.createObjectURL(f)));
    setStage('preview');
  };

  const handleBGRemove = async () => {
    if (files.length === 0) return;
    const subRes = await fetch('/api/check-subscription');
    const sub = await subRes.json();
    if (!sub.canGenerate) { router.push('/pricing'); return; }
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
      initChecked(urls.length);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.'); setStage('preview');
    }
  };

  const handleGenerateVideo = async () => {
    if (processedUrls.length === 0 || totalSelected === 0) return;
    const subRes = await fetch('/api/check-subscription');
    const sub = await subRes.json();
    if (!sub.canGenerate) { router.push('/pricing'); return; }
    setIsGenerating(true); setError(null);
    try {
      const urls: string[] = [];
      const labels: string[] = [];
      for (let ai = 0; ai < checked.length; ai++) {
        for (let pi = 0; pi < (checked[ai]?.length || 0); pi++) {
          if (checked[ai][pi]) {
            const res = await fetch('/api/generate-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: processedUrls[pi], petType, action: ai }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Generation failed.`);
            urls.push(data.videoUrl);
            labels.push(`${petActions[petType].actions[ai]} · Photo ${pi + 1}`);
          }
        }
      }
      setVideoUrls(urls);
      setVideoLabels(labels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally { setIsGenerating(false); }
  };

  const handleReset = () => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]); setPreviewUrls([]); setProcessedUrls([]); setVideoUrls([]); setVideoLabels([]);
    setChecked([]); setError(null); setProgress(0); setStage('select');
  };

  const actions = petActions[petType].actions;

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">Create Your Desktop Pet</h1>
          <p className="mt-2 text-text-secondary">Upload 1-5 photos — more photos = more action combinations</p>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'done' && processedUrls.length > 0 ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
              {/* Pet type selector */}
              <div className="flex justify-center gap-3 mb-4">
                {(Object.keys(petActions) as PetType[]).map((t) => (
                  <button key={t} onClick={() => setPetType(t)}
                    className={`px-4 py-2 rounded-full font-semibold text-xs transition-all cursor-pointer ${petType === t ? 'bg-coral text-white shadow-lg shadow-coral/25' : 'bg-white border border-gray-200 text-text-secondary hover:border-coral/30'}`}>
                    {petActions[t].label}
                  </button>
                ))}
              </div>

              {/* Photos row */}
              <div className="flex gap-4 mb-6 justify-center flex-wrap">
                {processedUrls.map((url, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-mint/40 p-3">
                    <p className="text-xs text-mint mb-1 text-center font-semibold">Photo #{i + 1}</p>
                    <div className="w-48 h-56 rounded-lg overflow-hidden mx-auto" style={{backgroundImage:'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb)',backgroundSize:'20px 20px',backgroundPosition:'0 0,10px 10px'}}>
                      <img src={url} alt={`Pet ${i + 1}`} className="w-full h-full object-contain" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action × Photo grid */}
              {videoUrls.length === 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-text-primary">Pick actions and photos (max {MAX_ACTIONS} action types)</p>
                    <span className={`text-xs font-bold ${activeActionCount >= MAX_ACTIONS ? 'text-coral' : 'text-text-secondary'}`}>
                      {activeActionCount}/{MAX_ACTIONS} actions · {totalSelected} video{totalSelected !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-4 text-text-secondary font-medium text-xs">Action</th>
                          {processedUrls.map((_, pi) => (
                            <th key={pi} className="text-center py-2 px-3 text-text-secondary font-medium text-xs">Photo {pi + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {actions.map((action, ai) => (
                          <tr key={ai} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 pr-4 font-medium text-text-primary text-sm">{action}</td>
                            {processedUrls.map((_, pi) => (
                              <td key={pi} className="text-center px-3 py-3">
                                <button
                                  onClick={() => toggleCheck(ai, pi)}
                                  className={`w-10 h-10 rounded-xl text-lg font-bold transition-all cursor-pointer ${
                                    checked[ai]?.[pi]
                                      ? 'bg-coral text-white shadow-md'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  {checked[ai]?.[pi] ? '✓' : ''}
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center mt-6">
                    <button onClick={handleGenerateVideo} disabled={isGenerating || totalSelected === 0}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl shadow-purple-500/25 disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer">
                      {isGenerating ? `🎬 Generating...` : `🎬 Generate ${totalSelected} Video${totalSelected !== 1 ? 's' : ''}`}
                    </button>
                    {totalSelected === 0 && <p className="text-xs text-text-secondary/60 mt-2">Check at least one box above</p>}
                  </div>
                </div>
              )}

              {/* Video results */}
              {videoUrls.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <p className="text-center text-mint font-semibold mb-3">🎬 {videoUrls.length} Video{videoUrls.length > 1 ? 's' : ''} Generated!</p>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {videoUrls.map((url, i) => (
                      <div key={i} className="bg-black rounded-2xl overflow-hidden shadow-xl">
                        <p className="text-center text-xs text-white/60 py-1 bg-black/80">{videoLabels[i]}</p>
                        <video src={url} autoPlay loop muted playsInline className="w-full" />
                        <div className="flex justify-center gap-4 p-2 bg-black/80">
                          <a href={url} download className="text-coral underline text-xs" target="_blank" rel="noopener">Download</a>
                          <a href={url} className="text-coral underline text-xs" target="_blank" rel="noopener">Copy link</a>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pairingCode && (
                    <div className="mt-4 p-4 bg-mint/5 rounded-xl border border-mint/20 text-center">
                      <p className="text-sm font-semibold text-mint mb-1">🔗 Your Pairing Code</p>
                      <code className="text-3xl font-mono font-bold tracking-[0.3em] text-coral select-all">{pairingCode}</code>
                      <p className="text-xs text-text-secondary mt-1">Open DeskBub → enter this code → click Pair</p>
                    </div>
                  )}
                </motion.div>
              )}

              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-500 text-center">{error}</motion.p>}
              <button onClick={handleReset} className="block mx-auto mt-6 text-sm text-text-secondary hover:text-coral underline underline-offset-4 cursor-pointer">Upload different photos</button>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {stage === 'select' && (
                <div>
                  <DropZone onFilesSelected={handleFileSelected} maxFiles={5} title="Drop 1-5 photos of your pet" subtitle="1 photo for Basic · up to 5 for Plus — JPG, PNG, WebP up to 10MB" />
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-xl mx-auto mt-8 bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-display font-bold text-text-primary mb-3">📸 Tips for the best result</h3>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li>🐾 Use a <strong>front-facing</strong> photo — your pet looking at the camera works best</li>
                      <li>🎨 Make sure your pet <strong>contrasts with the background</strong></li>
                      <li>☀️ Good <strong>lighting</strong> is important — natural daylight is ideal</li>
                      <li>📷 Keep the photo <strong>sharp and clear</strong> — blurry photos produce poor results</li>
                    </ul>
                  </motion.div>
                </div>
              )}

              {stage === 'preview' && files.length > 0 && (
                <div className="max-w-xl mx-auto">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden"><img src={url} alt={`Pet ${i + 1}`} className="w-full h-full object-cover" /></div>
                      ))}
                    </div>
                    {error && <p className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">Cancel</button>
                      <button onClick={handleBGRemove} className="flex-1 px-4 py-3 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark shadow-lg shadow-coral/25 cursor-pointer">Remove Background ✨</button>
                    </div>
                  </motion.div>
                </div>
              )}

              {(stage === 'uploading' || stage === 'processing') && (
                <div className="max-w-xl mx-auto text-center">
                  <div className="bg-white rounded-2xl border p-12">
                    <motion.div animate={{ scale: [1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }} className="text-7xl mb-6">{stage === 'uploading' ? '📤' : '✨'}</motion.div>
                    <h3 className="text-xl font-bold mb-2">{stage === 'uploading' ? 'Uploading...' : 'Removing background...'}</h3>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-coral to-mint rounded-full" animate={{ width: `${progress}%` }} /></div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
