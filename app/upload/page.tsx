'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DropZone from '@/components/upload/DropZone';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = 'select' | 'preview' | 'uploading' | 'processing' | 'done';

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>('select');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genType, setGenType] = useState<'video' | '3d' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setError(null);
    setPreviewUrl(URL.createObjectURL(files[0]));
    setStage('preview');
  };

  const handleBGRemove = async () => {
    if (!file) return;
    setStage('uploading');
    setProgress(0);
    setError(null);

    try {
      const supabase = createClient();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error('Upload failed.');

      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(uploadData.path);
      const imageUrl = urlData.publicUrl;
      setProgress(50);

      setStage('processing');
      const res = await fetch('/api/generate-pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Background removal failed.');
      setProcessedUrl(data.processedUrl);
      setProgress(100);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('preview');
    }
  };

  const handleGenerate = async (type: 'video' | '3d') => {
    if (!processedUrl) return;
    setIsGenerating(true);
    setGenType(type);
    setError(null);

    try {
      const endpoint = type === 'video' ? '/api/generate-video' : '/api/generate-3d';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: processedUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed.');

      if (type === 'video') setVideoUrl(data.videoUrl);
      else window.open(data.modelUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setIsGenerating(false);
      setGenType(null);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(null); setProcessedUrl(null);
    setVideoUrl(null); setError(null); setProgress(0); setStage('select');
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">Create Your Desktop Pet</h1>
          <p className="mt-2 text-text-secondary">Upload a clear photo of your pet — front-facing works best</p>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'done' && processedUrl ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
              {/* Before/After */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl border p-3">
                  <p className="text-xs text-text-secondary mb-2">Original</p>
                  <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                    <img src={previewUrl!} alt="Original" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border-2 border-mint/40 p-3">
                  <p className="text-xs text-mint mb-2">Background Removed ✨</p>
                  <div className="aspect-square rounded-lg overflow-hidden" style={{backgroundImage:'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb)',backgroundSize:'20px 20px',backgroundPosition:'0 0,10px 10px'}}>
                    <img src={processedUrl} alt="Processed" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Video Result */}
              {videoUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <p className="text-center text-mint font-semibold mb-3">🎬 Your Animated Pet!</p>
                  <div className="max-w-sm mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl">
                    <video src={videoUrl} autoPlay loop muted playsInline className="w-full" />
                  </div>
                  <p className="text-center mt-2">
                    <a href={videoUrl} download className="text-coral underline text-sm" target="_blank" rel="noopener">Download video</a>
                    <span className="text-text-secondary/40 text-sm mx-2">|</span>
                    <a href={videoUrl} className="text-coral underline text-sm" target="_blank" rel="noopener">Copy link for DeskBub</a>
                  </p>
                </motion.div>
              )}

              {/* Generate Buttons */}
              {!videoUrl && (
                <div className="flex flex-col gap-3 items-center">
                  <button onClick={() => handleGenerate('video')} disabled={isGenerating}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl shadow-purple-500/25 disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer">
                    {isGenerating && genType === 'video' ? '🎬 Generating...' : '🎬 Generate Video — ~$0.10'}
                  </button>
                  <button onClick={() => handleGenerate('3d')} disabled={isGenerating}
                    className="px-8 py-4 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-full hover:from-orange-500 hover:to-red-600 transition-all shadow-xl shadow-orange-500/25 disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer">
                    {isGenerating && genType === '3d' ? '🧊 Generating...' : '🧊 Generate 3D Model — ~$0.05'}
                  </button>
                </div>
              )}

              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-500 text-center">{error}</motion.p>}
              <button onClick={handleReset} className="block mx-auto mt-6 text-sm text-text-secondary hover:text-coral underline underline-offset-4 cursor-pointer">Upload a different photo</button>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {stage === 'select' && <DropZone onFilesSelected={handleFileSelected} maxFiles={1} />}

              {stage === 'preview' && file && previewUrl && (
                <div className="max-w-xl mx-auto">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-6">
                      <img src={previewUrl} alt="Pet" className="w-full h-full object-cover" />
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border p-12">
                    <motion.div animate={{ scale: [1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }} className="text-7xl mb-6">{stage === 'uploading' ? '📤' : '✨'}</motion.div>
                    <h3 className="text-xl font-bold mb-2">{stage === 'uploading' ? 'Uploading...' : 'Removing background...'}</h3>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-coral to-mint rounded-full" animate={{ width: `${progress}%` }} />
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
