'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ResultComparisonProps {
  originalUrl: string;
  processedUrl: string;
  videoUrl?: string | null;
  modelUrl?: string | null;
  isDemo?: boolean;
  isGeneratingVideo?: boolean;
  isGenerating3D?: boolean;
  onGenerateVideo?: () => void;
  onGenerate3D?: () => void;
  onReset: () => void;
}

function Confetti({ count = 30 }: { count?: number }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#38BDF8'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            width: 6 + Math.random() * 10,
            height: (6 + Math.random() * 10) * 1.5,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: Math.random() * 360 + 720,
          }}
          transition={{ duration: 1.5 + Math.random() * 2, delay: Math.random() * 0.5, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

export default function ResultComparison({
  originalUrl,
  processedUrl,
  videoUrl,
  modelUrl,
  isDemo = false,
  isGeneratingVideo = false,
  isGenerating3D = false,
  onGenerateVideo,
  onGenerate3D,
  onReset,
}: ResultComparisonProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto relative"
    >
      {showConfetti && <Confetti count={40} />}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-mint/10 border border-mint/30 text-mint font-semibold text-sm">
          {videoUrl ? '🎬 Your Animated Pet is Ready!' : '✨ Your Desktop Pet is Ready!'}
        </span>
      </motion.div>

      {/* Video Result */}
      {videoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="max-w-md mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
            />
          </div>
          <p className="text-center text-text-secondary text-sm mt-3">
            🔄 5 seconds · Loops automatically ·{' '}
            <a href={videoUrl} download className="text-coral underline" target="_blank" rel="noopener">
              Download video
            </a>
          </p>
        </motion.div>
      )}

      {/* Before/After Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="absolute -top-3 left-6 px-4 py-1 rounded-full bg-gray-200 text-xs font-semibold text-text-secondary uppercase tracking-wider z-10">
            Original
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 pt-6 overflow-hidden">
            <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
              <img src={originalUrl} alt="Original pet" className="w-full h-full object-cover" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <div className="absolute -top-3 left-6 px-4 py-1 rounded-full bg-mint/20 text-xs font-semibold text-mint uppercase tracking-wider z-10">
            Background Removed ✨
          </div>
          <div className="bg-white rounded-2xl border-2 border-mint/40 shadow-xl shadow-mint/10 p-4 pt-6 overflow-hidden">
            <div className="aspect-square rounded-xl overflow-hidden flex items-center justify-center relative">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px',
                }}
              />
              <img
                src={processedUrl}
                alt="Processed pet"
                className="relative z-10 w-full h-full"
                style={{ objectFit: 'contain' }}
              />
              {isDemo && (
                <div className="absolute bottom-3 right-3 z-20 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-xs text-text-secondary rounded-full border border-gray-200 shadow-sm">
                  🧪 Demo mode
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Generate Video Button */}
      {!videoUrl && onGenerateVideo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mb-10"
        >
          <button
            onClick={onGenerateVideo}
            disabled={isGeneratingVideo}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl shadow-purple-500/25 disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer"
          >
            {isGeneratingVideo ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  🎬
                </motion.span>
                Generating Video...
              </span>
            ) : (
              '🎬 Generate Animated Video — $0.01'
            )}
          </button>
          <p className="text-xs text-text-secondary/60 mt-2">
            AI generates a 5-second looping video of your pet breathing and moving naturally
          </p>
        </motion.div>
      )}

      {/* Generate 3D Button */}
      {!modelUrl && onGenerate3D && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="text-center mb-8"
        >
          <button
            onClick={onGenerate3D}
            disabled={isGenerating3D}
            className="px-8 py-4 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-full hover:from-orange-500 hover:to-red-600 transition-all shadow-xl shadow-orange-500/25 disabled:opacity-60 disabled:cursor-wait text-lg cursor-pointer"
          >
            {isGenerating3D ? (
              <span className="flex items-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🧊</motion.span>
                Generating 3D Model... (1-2 min)
              </span>
            ) : (
              '🧊 Generate 3D Model — ~$0.05'
            )}
          </button>
          <p className="text-xs text-text-secondary/60 mt-2">AI creates a textured 3D model (.glb) from your pet photo</p>
        </motion.div>
      )}

      {/* 3D Model Result */}
      {modelUrl && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-center text-mint font-semibold mb-2">🧊 3D Model Ready!</p>
          <p className="text-center text-sm text-text-secondary break-all">{modelUrl}</p>
          <p className="text-center text-sm mt-1">
            <a href={modelUrl} download className="text-coral underline" target="_blank" rel="noopener">Download GLB Model</a>
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <button
          onClick={onReset}
          className="text-sm font-medium text-text-secondary hover:text-coral transition-colors underline underline-offset-4 cursor-pointer"
        >
          Upload a different photo
        </button>
      </motion.div>
    </motion.div>
  );
}
