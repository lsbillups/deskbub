'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DropZone from '@/components/upload/DropZone';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = 'select' | 'preview' | 'uploading' | 'generating' | 'done';

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (selected: File[]) => {
    setFiles(selected);
    setError(null);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    setStage('preview');
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;
    setStage('uploading');
    setProgress(0);
    setError(null);

    try {
      const supabase = createClient();
      const urls: string[] = [];

      // Upload all photos
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fileName = `${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(fileName, f, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Failed to upload "${f.name}".`);
        const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(uploadData.path);
        urls.push(urlData.publicUrl);
        setProgress(Math.round(((i + 1) / files.length) * 50));
      }

      setImageUrls(urls);
      setProgress(50);

      // Generate 3D model with all images
      setStage('generating');
      const response = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: urls }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '3D generation failed.');

      setModelUrl(result.modelUrl);
      setProgress(100);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('preview');
    }
  };

  const handleReset = () => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviewUrls([]);
    setImageUrls([]);
    setModelUrl(null);
    setError(null);
    setProgress(0);
    setStage('select');
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            Create Your 3D Desktop Pet
          </h1>
          <p className="mt-2 text-text-secondary">
            Upload 3-5 photos from different angles for the best 3D model
          </p>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'done' && modelUrl ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-mint bg-mint/10 rounded-full">🧊 3D Model Ready!</span>
              <h2 className="text-2xl font-display font-bold mb-4">Your Desktop Pet is Ready!</h2>
              <a href={modelUrl} download className="inline-block px-8 py-3.5 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-all shadow-xl shadow-coral/30 text-lg cursor-pointer mb-4">
                Download 3D Model (.glb)
              </a>
              <p className="text-xs text-text-secondary/60">Desktop 3D pet viewer coming soon</p>
              <button onClick={handleReset} className="block mx-auto mt-6 text-sm text-text-secondary hover:text-coral underline underline-offset-4 cursor-pointer">Upload different photos</button>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {stage === 'select' && <DropZone onFilesSelected={handleFilesSelected} maxFiles={5} />}

              {stage === 'preview' && files.length > 0 && (
                <div className="max-w-2xl mx-auto">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <p className="text-sm font-semibold text-text-primary mb-4">{files.length} photo{files.length > 1 ? 's' : ''} selected</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                          <img src={url} alt={`Pet angle ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</motion.p>}
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">Choose Different Photos</button>
                      <button onClick={handleGenerate} className="flex-1 px-4 py-3 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25 cursor-pointer">🧊 Generate 3D Model</button>
                    </div>
                  </motion.div>
                </div>
              )}

              {(stage === 'uploading' || stage === 'generating') && (
                <div className="max-w-xl mx-auto text-center">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-200 p-12">
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-7xl mb-6">
                      {stage === 'uploading' ? '📤' : '🧊'}
                    </motion.div>
                    <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                      {stage === 'uploading' ? 'Uploading photos...' : 'Generating 3D model...'}
                    </h3>
                    <p className="text-text-secondary text-sm mb-6">
                      {stage === 'uploading' ? 'Sending your photos securely.' : 'AI is building a textured 3D model. This takes 1-2 minutes.'}
                    </p>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-coral to-mint rounded-full" animate={{ width: `${stage === 'uploading' ? progress : 80}%` }} transition={{ duration: 1 }} />
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
