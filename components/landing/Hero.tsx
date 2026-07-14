'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_VIDEO = 'https://xmmvznxrcuqxstkfhgsh.supabase.co/storage/v1/object/public/pet-photos/videos/user_3GRs2u0DnUOALc40epyY1sSP6V9/1784017312186.webm';

const demoSteps = [
  { emoji: '📸', title: 'Upload 1–5 Photos', desc: 'Take or choose photos of your real pet. The more the better!' },
  { emoji: '✨', title: 'Pick Actions & Generate', desc: 'Choose up to 5 actions — wagging tail, stretching, sleeping... AI does the magic.' },
  { emoji: '💻', title: 'Pet Lives on Your Desktop', desc: 'Your real pet, right on your screen. Napping, stretching, reminding you to take breaks.' },
];

export default function Hero() {
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const startDemo = () => {
    setDemoActive(true);
    setDemoStep(0);
  };

  const nextStep = () => {
    if (demoStep < 2) setDemoStep(demoStep + 1);
  };

  const prevStep = () => {
    if (demoStep > 0) setDemoStep(demoStep - 1);
  };

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-coral bg-coral/10 rounded-full">
            🎉 Your real pet, now on your desktop
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-text-primary leading-tight">
            Your Real Pet,{' '}
            <span className="text-coral">Alive</span> on Your Desktop
          </h1>

          <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-lg">
            Upload a photo. AI removes the background. Your furry friend
            appears on your screen — napping, stretching, and gently reminding
            you to drink water and take breaks. Not a cartoon. Your actual pet.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/upload"
              className="px-7 py-3.5 text-base font-semibold bg-coral text-white rounded-full hover:bg-coral-dark transition-all shadow-xl shadow-coral/30 hover:shadow-coral/50"
            >
              Upload Your Pet — It&apos;s Free
            </Link>
            <button
              onClick={startDemo}
              className="px-7 py-3.5 text-base font-medium text-coral border-2 border-coral/30 rounded-full hover:bg-coral/5 hover:border-coral/60 transition-all cursor-pointer"
            >
              See a Live Demo
            </button>
            <a
              href="#how-it-works"
              className="px-7 py-3.5 text-base font-medium text-text-secondary hover:text-text-primary transition-colors underline underline-offset-4"
            >
              How It Works
            </a>
          </div>
        </motion.div>

        {/* Right — Demo / Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="h-full min-h-[380px] rounded-3xl bg-gradient-to-br from-coral/10 via-mint/10 to-coral/5 border border-coral/20 overflow-hidden shadow-2xl shadow-coral/10 flex flex-col items-center justify-center relative">
            <AnimatePresence mode="wait">
              {!demoActive ? (
                /* ── Idle state ── */
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-center p-8">
                  <div className="text-8xl mb-4">🐶</div>
                  <p className="text-sm text-text-secondary font-medium">Your pet lives here</p>
                  <button onClick={startDemo}
                    className="mt-4 px-5 py-2 text-sm font-semibold bg-white/80 text-coral rounded-full border border-coral/20 hover:bg-coral hover:text-white transition-all cursor-pointer">
                    👀 Try Demo
                  </button>
                </motion.div>
              ) : (
                /* ── Demo active ── */
                <motion.div key="demo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center p-6">
                  {demoStep < 2 ? (
                    /* Step 0-1: Show step info */
                    <div className="text-center">
                      <div className="text-6xl mb-3">{demoSteps[demoStep].emoji}</div>
                      <h3 className="text-lg font-display font-bold text-text-primary">{demoSteps[demoStep].title}</h3>
                      <p className="text-sm text-text-secondary mt-1">{demoSteps[demoStep].desc}</p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {demoSteps.map((_, i) => (
                          <span key={i} className={`w-2 h-2 rounded-full ${i === demoStep ? 'bg-coral' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Show video on fake desktop */
                    <div className="text-center w-full">
                      {/* Desktop mockup */}
                      <div className="relative max-w-[260px] mx-auto rounded-xl overflow-hidden shadow-xl border-4 border-gray-700">
                        {/* Wallpaper background */}
                        <div className="bg-gradient-to-br from-blue-400 via-blue-300 to-green-300 h-[180px] relative flex items-center justify-center">
                          {/* Pet video — appears like it's on the desktop */}
                          <div className="absolute bottom-4 right-4 w-[100px]">
                            <video src={DEMO_VIDEO} autoPlay loop muted playsInline className="w-full drop-shadow-lg" />
                          </div>
                          {/* Desktop icons */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            <div className="bg-white/20 rounded px-2 py-0.5 text-[10px] text-white">📁 Folder</div>
                            <div className="bg-white/20 rounded px-2 py-0.5 text-[10px] text-white">🌐 Browser</div>
                          </div>
                        </div>
                        {/* Taskbar */}
                        <div className="bg-gray-800/90 h-[28px] flex items-center px-3 gap-2">
                          <span className="text-[10px] text-white">🪟</span>
                          <span className="text-[10px] text-white/70">DeskBub</span>
                          <span className="ml-auto text-[10px] text-white/50">🕐</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-text-primary mt-3">Your real pet, right on your desktop!</p>
                      <Link href="/sign-up"
                        className="inline-block mt-4 px-6 py-2.5 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg cursor-pointer">
                        🐾 Get Started Free
                      </Link>
                    </div>
                  )}

                  {/* Step navigation */}
                  <div className="flex items-center gap-3 mt-5">
                    <button onClick={prevStep} disabled={demoStep === 0}
                      className="text-xs text-text-secondary hover:text-coral disabled:opacity-30 cursor-pointer disabled:cursor-default">
                      ← Back
                    </button>
                    {demoStep < 2 ? (
                      <button onClick={nextStep}
                        className="text-xs font-semibold text-coral hover:text-coral-dark cursor-pointer">
                        Next →
                      </button>
                    ) : (
                      <button onClick={() => { setDemoActive(false); setDemoStep(0); }}
                        className="text-xs text-text-secondary hover:text-coral cursor-pointer">
                        Start Over
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-coral/5 via-mint/5 to-coral/5 blur-2xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
