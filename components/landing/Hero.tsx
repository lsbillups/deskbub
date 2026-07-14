'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_VIDEOS = [
  'https://xmmvznxrcuqxstkfhgsh.supabase.co/storage/v1/object/public/pet-photos/videos/user_3GRs2u0DnUOALc40epyY1sSP6V9/1784017312186.webm',
  'https://xmmvznxrcuqxstkfhgsh.supabase.co/storage/v1/object/public/pet-photos/videos/user_3GRs2u0DnUOALc40epyY1sSP6V9/1784017398691.webm',
  'https://xmmvznxrcuqxstkfhgsh.supabase.co/storage/v1/object/public/pet-photos/videos/user_3GRs2u0DnUOALc40epyY1sSP6V9/1784017540788.webm',
  'https://xmmvznxrcuqxstkfhgsh.supabase.co/storage/v1/object/public/pet-photos/videos/user_3GRs2u0DnUOALc40epyY1sSP6V9/1784018082317.webm',
  'https://xmmvznxrcuqxstkfhgsh.supabase.co/storage/v1/object/public/pet-photos/videos/user_3GRs2u0DnUOALc40epyY1sSP6V9/1784018140990.webm',
];

const demoSteps = [
  { emoji: '📸', title: 'Upload 1–5 Photos', desc: 'Take or choose photos of your real pet. The more the better!' },
  { emoji: '✨', title: 'Pick Actions & Generate', desc: 'Choose up to 5 actions — wagging tail, stretching, sleeping... AI does the magic.' },
  { emoji: '💻', title: 'Pet Lives on Your Desktop', desc: 'Your real pet, right on your screen. Napping, stretching, reminding you to take breaks.' },
];

export default function Hero() {
  const [demoActive, setDemoActive] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play demo: steps 0-1 stay 3s each, step 2 stays 16s (room for video rotation)
  useEffect(() => {
    if (!demoActive) return;
    const advance = () => {
      setDemoStep(prev => (prev >= 2 ? 0 : prev + 1));
    };
    // Use timeout chain instead of interval to vary durations
    const schedule = () => {
      const delay = demoStep >= 2 ? 16000 : 5000;
      timerRef.current = setTimeout(() => {
        advance();
      }, delay);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [demoActive, demoStep]);

  // Rotate videos separately (faster than step timer) when on step 2
  useEffect(() => {
    if (!demoActive || demoStep !== 2) return;
    const videoTimer = setInterval(() => {
      setVideoIdx(i => (i + 1) % DEMO_VIDEOS.length);
    }, 4000);
    return () => clearInterval(videoTimer);
  }, [demoActive, demoStep]);


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
              {demoActive && (
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
                      <div className="relative max-w-[320px] mx-auto rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-300">
                        {/* Wallpaper */}
                        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] h-[200px] relative overflow-hidden">
                          {/* Subtle wallpaper pattern */}
                          <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)',
                          }} />
                          {/* Desktop icons */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            {['📁 Files', '🌐 Chrome', '🎵 Music'].map(icon => (
                              <div key={icon} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-md px-2 py-1 text-[11px] text-white/80 cursor-default">
                                <span className="text-sm">{icon.split(' ')[0]}</span>
                                <span>{icon.split(' ')[1]}</span>
                              </div>
                            ))}
                          </div>
                          {/* Pet on desktop */}
                          <div className="absolute bottom-0 right-2" style={{ width: '85px', height: '105px' }}>
                            <motion.div
                              key={videoIdx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                              className="w-full h-full"
                            >
                              <video
                                src={DEMO_VIDEOS[videoIdx]}
                                autoPlay loop muted playsInline
                                className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                              />
                            </motion.div>
                            {/* Pet shadow on desktop */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60px] h-[8px] bg-black/20 rounded-full blur-sm" />
                          </div>
                        </div>
                        {/* Taskbar */}
                        <div className="bg-gray-900/95 h-[32px] flex items-center px-3 gap-2 backdrop-blur">
                          <span className="text-sm">🪟</span>
                          {['DeskBub', 'Chrome'].map(app => (
                            <div key={app} className={`h-[22px] px-3 rounded-sm flex items-center text-[10px] text-white/90 ${app === 'DeskBub' ? 'bg-white/10 border-b-2 border-coral' : 'hover:bg-white/10'}`}>
                              {app}
                            </div>
                          ))}
                          <div className="ml-auto flex items-center gap-3 text-[10px] text-white/60">
                            <span>🔊</span>
                            <span>📶</span>
                            <span>🔋</span>
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <motion.p
                        key={`label-${videoIdx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-semibold text-text-primary mt-3"
                      >
                        {['Panting happily', 'Head tilting', 'Lying relaxed', 'Curious look', 'Peaceful nap'][videoIdx]}
                      </motion.p>
                      <Link href="/upload"
                        className="inline-block mt-4 px-6 py-2.5 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg cursor-pointer">
                        🐾 Get Started Free
                      </Link>
                    </div>
                  )}

                  {/* Clickable progress dots */}
                  <div className="flex items-center justify-center gap-1.5 mt-5">
                    {demoSteps.map((_, i) => (
                      <button key={i} onClick={() => setDemoStep(i)}
                        title={demoSteps[i].title}
                        className={`rounded-full transition-all duration-500 cursor-pointer ${
                          i === demoStep ? 'w-5 h-1.5 bg-coral' : i < demoStep ? 'w-1.5 h-1.5 bg-coral/30' : 'w-1.5 h-1.5 bg-gray-300'
                        }`} />
                    ))}
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
