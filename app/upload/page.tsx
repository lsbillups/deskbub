'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DropZone from '@/components/upload/DropZone';
import ResultComparison from '@/components/upload/ResultComparison';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = 'select' | 'preview' | 'uploading' | 'processing' | 'done';

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>('select');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isGenerating3D, setIsGenerating3D] = useState(false);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    // Create local preview
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setStage('preview');
  };

  const handleGenerate = async () => {
    if (!file) return;

    try {
      setIsDemo(false);
      setStage('uploading');
      setUploadProgress(0);
      setError(null);

      // Step 1: Upload to Supabase Storage
      const supabase = createClient();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          throw new Error(
            'Storage is not configured yet. Please run the Supabase setup SQL first — check the README for instructions.'
          );
        }
        throw new Error('Failed to upload image. Please try again.');
      }

      setUploadProgress(100);

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(uploadData.path);

      const imageUrl = urlData.publicUrl;

      // Step 3: Call AI processing
      setStage('processing');
      const response = await fetch('/api/generate-pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI processing failed. Please try again.');
      }

      setProcessedUrl(result.processedUrl);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('preview'); // Go back so user can retry
    }
  };

  const handleGenerateVideo = async () => {
    if (!processedUrl) return;
    setIsGeneratingVideo(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: processedUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Video generation failed.');
      }

      setVideoUrl(result.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerate3D = async () => {
    if (!processedUrl) return;
    setIsGenerating3D(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: processedUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '3D generation failed.');
      setModelUrl(result.modelUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '3D generation failed.');
    } finally {
      setIsGenerating3D(false);
    }
  };

  const handleDemo = async () => {
    if (!previewUrl) return;
    setError(null);

    // Simulate upload
    setStage('uploading');
    setUploadProgress(30);
    await new Promise((r) => setTimeout(r, 800));
    setUploadProgress(100);
    await new Promise((r) => setTimeout(r, 400));

    // Simulate AI processing
    setStage('processing');
    await new Promise((r) => setTimeout(r, 2000));

    // Use the same image for both (demo mode — no actual AI)
    setIsDemo(true);
    setProcessedUrl(previewUrl);
    setStage('done');
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setVideoUrl(null);
    setModelUrl(null);
    setError(null);
    setUploadProgress(0);
    setStage('select');
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            Create Your Desktop Pet
          </h1>
          <p className="mt-2 text-text-secondary">
            Upload a clear photo of your pet — front-facing works best!
          </p>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'done' && processedUrl && previewUrl ? (
            <ResultComparison
              key="done"
              originalUrl={previewUrl}
              processedUrl={processedUrl}
              videoUrl={videoUrl}
              modelUrl={modelUrl}
              isDemo={isDemo}
              isGeneratingVideo={isGeneratingVideo}
              isGenerating3D={isGenerating3D}
              onGenerateVideo={handleGenerateVideo}
              onGenerate3D={handleGenerate3D}
              onReset={handleReset}
            />
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Stage: Select */}
              {stage === 'select' && (
                <DropZone onFileSelected={handleFileSelected} />
              )}

              {/* Stage: Preview */}
              {stage === 'preview' && file && previewUrl && (
                <div className="max-w-xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6"
                  >
                    <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-6">
                      <img
                        src={previewUrl}
                        alt="Your pet"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                      <span className="truncate max-w-[60%]">{file.name}</span>
                      <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg"
                      >
                        {error}
                      </motion.p>
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <button
                          onClick={handleReset}
                          className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary border border-gray-200 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Choose Different Photo
                        </button>
                        <button
                          onClick={handleGenerate}
                          className="flex-1 px-4 py-3 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25 cursor-pointer"
                        >
                          Generate My Desktop Pet ✨
                        </button>
                      </div>
                      <button
                        onClick={handleDemo}
                        className="w-full px-4 py-2.5 text-sm font-medium text-mint border-2 border-mint rounded-full hover:bg-mint/5 transition-colors cursor-pointer"
                      >
                        🧪 Try Demo Mode (no API keys needed)
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Stage: Uploading / Processing */}
              {(stage === 'uploading' || stage === 'processing') && (
                <div className="max-w-xl mx-auto text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-gray-200 p-12"
                  >
                    {/* Animated pet emoji */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-7xl mb-6"
                    >
                      {stage === 'uploading' ? '📤' : '✨'}
                    </motion.div>

                    <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                      {stage === 'uploading' ? 'Uploading your photo...' : 'AI is working its magic...'}
                    </h3>
                    <p className="text-text-secondary text-sm mb-6">
                      {stage === 'uploading'
                        ? 'Sending your pet photo to our servers.'
                        : 'Removing the background and preparing your desktop pet. This takes about 20 seconds.'}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-coral to-mint rounded-full"
                        initial={{ width: '0%' }}
                        animate={{
                          width:
                            stage === 'uploading'
                              ? `${uploadProgress || 30}%`
                              : stage === 'processing'
                                ? '90%'
                                : '0%',
                        }}
                        transition={{ duration: 1 }}
                      />
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
