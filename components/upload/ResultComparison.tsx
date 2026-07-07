'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ResultComparisonProps {
  originalUrl: string;
  processedUrl: string;
  isDemo?: boolean;
  onReset: () => void;
}

/* Confetti particle */
function Confetti({ count = 30 }: { count?: number }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#38BDF8'];
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: p.rotation + 720,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

export default function ResultComparison({
  originalUrl,
  processedUrl,
  isDemo = false,
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
      {/* Confetti celebration */}
      {showConfetti && <Confetti count={40} />}

      {/* Success banner */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-mint/10 border border-mint/30 text-mint font-semibold text-sm">
          ✨ Your Desktop Pet is Ready!
        </span>
      </motion.div>

      {/* Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* Before */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute -top-3 left-6 px-4 py-1 rounded-full bg-gray-200 text-xs font-semibold text-text-secondary uppercase tracking-wider z-10">
            Before
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 pt-6 overflow-hidden">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              <img
                src={originalUrl}
                alt="Original pet"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* After */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute -top-3 left-6 px-4 py-1 rounded-full bg-mint/20 text-xs font-semibold text-mint uppercase tracking-wider z-10">
            After ✨
          </div>
          <div className="bg-white rounded-2xl border-2 border-mint/40 shadow-xl shadow-mint/10 p-4 pt-6 overflow-hidden">
            <div className="aspect-square rounded-xl overflow-hidden flex items-center justify-center relative">
              {/* Checkerboard to show transparency */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px',
                }}
              />
              {/* Pet image — with soft oval mask in demo mode */}
              <img
                src={processedUrl}
                alt="Desktop-ready pet"
                className="relative z-10 w-full h-full"
                style={
                  isDemo
                    ? {
                        objectFit: 'cover',
                        WebkitMaskImage:
                          'radial-gradient(ellipse 65% 75% at 50% 55%, black 60%, transparent 100%)',
                        maskImage:
                          'radial-gradient(ellipse 65% 75% at 50% 55%, black 60%, transparent 100%)',
                      }
                    : { objectFit: 'contain' }
                }
              />

              {/* Demo badge */}
              {isDemo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute bottom-3 right-3 z-20 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-xs text-text-secondary rounded-full border border-gray-200 shadow-sm"
                >
                  🧪 Demo mode — real AI coming soon
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <h3 className="text-xl font-display font-bold text-text-primary mb-2">
          Ready to bring your pet to life?
        </h3>
        <p className="text-text-secondary mb-6">
          Download DeskBub and your furry friend will appear on your desktop.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <a
            href="#"
            className="px-7 py-3.5 text-sm font-semibold bg-mint text-white rounded-full hover:bg-mint-dark transition-all shadow-xl shadow-mint/30 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
            </svg>
            Download for Windows
          </a>
          <a
            href="#"
            className="px-7 py-3.5 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark transition-all shadow-xl shadow-coral/30 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Download for macOS
          </a>
        </div>

        <p className="text-xs text-text-secondary/50 mb-4">
          Desktop app coming soon — join our waitlist!
        </p>

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
