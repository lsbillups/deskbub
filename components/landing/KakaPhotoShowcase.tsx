'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import styles from './KakaPhotoShowcase.module.css';

const media = '/media/kaka-showcase';
const actions = [
  { id: 'curious', name: 'Curious', photo: 'P02', alt: 'Kaka wearing a red harness beside a window', description: 'A quiet window-side photo becomes a curious little head tilt.' },
  { id: 'relaxed', name: 'Relaxed', photo: 'P08', alt: 'Kaka resting his front paws on a sofa', description: 'The same familiar face, with his paws resting in front of him.' },
  { id: 'happy', name: 'Happy', photo: 'P01', alt: 'Kaka standing on grass beside his little yellow duck toy', description: 'Kaka’s red harness and little yellow toy come along, too.' },
  { id: 'lie-down', name: 'Lie down', photo: 'P11', alt: 'Kaka facing the camera on grass, wearing a red harness', description: 'One photo, more than one action. This photo also appears in Bouncy.' },
  { id: 'bouncy', name: 'Bouncy', photo: 'P11', alt: 'Kaka facing the camera on grass, wearing a red harness', description: 'A playful bounce from the same photo used for Lie down.' },
] as const;

type Props = { id?: string; mode?: 'full' | 'compact' | 'single'; title?: string; description?: string; showCtas?: boolean; initialAction?: number };

export default function KakaPhotoShowcase({ id = 'kaka-examples', mode = 'full', title = 'See the photo. Meet the desktop pet.', description = 'Meet Kaka, our free desktop dog. Explore the real photos behind his five included animations.', showCtas = true, initialAction = 0 }: Props) {
  const [index, setIndex] = useState(initialAction);
  const [dark, setDark] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const active = actions[index];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !pausedByUser && !preference.matches) {
        void video.play().catch(() => { /* The Play button remains available if autoplay is blocked. */ });
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.2 });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', sync); video.pause(); };
  }, [active.id, pausedByUser, retry]);

  const choose = (next: number) => { setIndex(next); setError(false); setPlaying(false); setPausedByUser(false); };
  const keydown = (event: KeyboardEvent<HTMLButtonElement>, current: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? actions.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : actions.length - 1)) % actions.length;
    choose(next); tabsRef.current[next]?.focus();
  };
  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) { setPausedByUser(true); video.pause(); }
    else { setPausedByUser(false); void video.play().catch(() => setPlaying(false)); }
  };
  const replay = () => { const video = videoRef.current; if (video) { video.currentTime = 0; setPausedByUser(false); void video.play().catch(() => setPlaying(false)); } };

  return (
    <section id={id} className={`${styles.section} ${mode === 'compact' ? styles.compact : ''} ${mode === 'single' ? styles.single : ''}`} aria-labelledby={`${id}-heading`} data-kaka-showcase={mode}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2 id={`${id}-heading`}>{title}</h2>
          <p>{description}</p>
        </div>
        {mode !== 'single' && <div className={styles.tabs} role="tablist" aria-label="Choose a Kaka action">
          {actions.map((action, i) => <button key={action.id} ref={el => { tabsRef.current[i] = el; }} id={`${id}-tab-${action.id}`} type="button" role="tab" aria-controls={`${id}-panel`} aria-selected={index === i} tabIndex={index === i ? 0 : -1} onClick={() => choose(i)} onKeyDown={event => keydown(event, i)} className={styles.tab}>
            {/* Existing owner-confirmed assets, with a separately cropped thumbnail for navigation. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${media}/${action.id}-thumb.png`} alt="" width={44} height={44} loading="lazy" />
            <span>{action.name}</span>
          </button>)}
        </div>}
        <div id={`${id}-panel`} role={mode === 'single' ? undefined : 'tabpanel'} aria-labelledby={mode === 'single' ? undefined : `${id}-tab-${active.id}`}>
          <div className={styles.pair}>
            <div>
              <div className={styles.label}><h3>Original photo</h3><span>Where it started</span></div>
              <button type="button" className={styles.photo} aria-label={`Enlarge original photo: ${active.alt}`} onClick={() => dialogRef.current?.showModal()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${media}/${active.photo}.jpg`} alt={active.alt} width={600} height={800} loading="lazy" />
                <span>View full photo</span>
              </button>
            </div>
            <div>
              <div className={styles.label}><h3>{active.name}</h3><span>Included with free Kaka</span></div>
              <div className={`${styles.stage} ${dark ? styles.dark : ''}`}>
                <video key={`${active.id}-${retry}`} ref={videoRef} src={`${media}/${active.id}.webm`} poster={`${media}/${active.id}.png`} muted loop playsInline preload="metadata" aria-label={`${active.name}: one of Kaka’s five free desktop animations`} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setError(true)} />
                {error && <div className={styles.error} role="alert">Animation couldn’t load. <button type="button" onClick={() => { setError(false); setRetry(r => r + 1); }}>Try again</button></div>}
              </div>
              <div className={styles.toolbar}>
                <div className={styles.playback}><button type="button" onClick={play} disabled={error}>{playing ? 'Pause' : 'Play'}</button><button type="button" onClick={replay} disabled={error}>Replay</button></div>
                <div className={styles.backgrounds} role="group" aria-label="Animation background">
                  <button type="button" aria-label="Light background" aria-pressed={!dark} onClick={() => setDark(false)} className={styles.lightSwatch} />
                  <button type="button" aria-label="Dark background" aria-pressed={dark} onClick={() => setDark(true)} className={styles.darkSwatch} />
                </div>
              </div>
            </div>
          </div>
          <p className={styles.caption} aria-live="polite">{active.description}</p>
        </div>
        {mode === 'single' ? <div className={styles.ctas}><Link href="/free-desktop-pet#kaka-actions" className={styles.secondary}>See all five Kaka actions <span aria-hidden="true">→</span></Link><Link href="/custom-desktop-pet#kaka-examples" className={styles.textLink}>Create a pet from my photo</Link></div> : showCtas && <div className={styles.ctas}><Link href="/pricing#pricing-plans" className={styles.primary}>Create a pet from my photo</Link><Link href="/download" className={styles.secondary}>Use Kaka for free</Link></div>}
        <p className={styles.truth}>Kaka is our original brand example. Custom results vary by photo and action; Basic includes one default action.</p>
      </div>
      <dialog ref={dialogRef} className={styles.dialog} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
        <form method="dialog"><button type="submit" autoFocus>Close photo</button></form>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${media}/${active.photo}-original.jpg`} alt={active.alt} width={900} height={1200} loading="lazy" />
      </dialog>
    </section>
  );
}
