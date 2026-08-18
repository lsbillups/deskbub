'use client';

import { useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

type OperatingSystem = 'windows' | 'mac';

const installers = {
  windows: { label: 'Windows', emoji: '🪟', href: 'https://github.com/lsbillups/deskbub/releases/latest/download/DeskBub-Windows.exe', requirement: 'Windows 10 or 11' },
  mac: { label: 'macOS', emoji: '🍎', href: 'https://github.com/lsbillups/deskbub/releases/latest/download/DeskBub-macOS.dmg', requirement: 'macOS 12 or later' },
};

export default function DownloadPage() {
  const { user, isSignedIn } = useUser();
  const [os, setOs] = useState<OperatingSystem>('windows');
  const [copied, setCopied] = useState(false);
  const installer = installers[os];
  const pairingCode = useMemo(() => {
    if (!user) return null;
    let hash = 0;
    for (let index = 0; index < user.id.length; index += 1) { hash = ((hash << 5) - hash) + user.id.charCodeAt(index); hash |= 0; }
    return String(Math.abs(hash) % 1000000).padStart(6, '0');
  }, [user]);

  const copyPairingCode = async () => {
    if (!pairingCode) return;
    await navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-cream pt-16">
      <section className="px-6 py-20 text-center sm:py-24">
        <span className="inline-flex rounded-full bg-mint/15 px-4 py-2 text-sm font-bold text-mint-dark">KAKA INCLUDED FREE</span>
        <h1 className="mt-6 font-display text-5xl font-extrabold text-text-primary sm:text-6xl">Download DeskBub for Windows &amp; Mac</h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl leading-relaxed text-text-secondary">Kaka is included free with DeskBub. No account required. If you&apos;ve created a custom pet, sign in to get your pairing code.</p>
        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-text-primary/5 sm:p-9">
          <div className="flex justify-center gap-3">{(Object.keys(installers) as OperatingSystem[]).map((key) => <button key={key} type="button" onClick={() => setOs(key)} className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-bold transition ${os === key ? 'bg-text-primary text-white' : 'bg-cream text-text-secondary hover:text-text-primary'}`}>{installers[key].emoji} {installers[key].label}</button>)}</div>
          <div className="mt-8 text-6xl">{installer.emoji}</div>
          <h2 className="mt-4 font-display text-2xl font-bold text-text-primary">DeskBub for {installer.label}</h2>
          <p className="mt-2 text-sm text-text-secondary">{installer.requirement} · Latest GitHub release</p>
          <a href={installer.href} className="mt-7 inline-block rounded-full bg-coral px-8 py-3.5 text-lg font-bold text-white shadow-xl shadow-coral/25 hover:bg-coral-dark">Download for {installer.label}</a>
          <p className="mt-4 text-xs text-text-secondary">The installer is hosted on DeskBub&apos;s public GitHub releases.</p>
        </div>
      </section>

      {isSignedIn && pairingCode && <section className="px-6 pb-16"><div className="mx-auto max-w-xl rounded-3xl border border-mint/25 bg-mint/5 p-7 text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-mint-dark">Your custom pet pairing code</p><code className="mt-4 block select-all font-mono text-4xl font-bold tracking-[0.22em] text-text-primary">{pairingCode}</code><button type="button" onClick={copyPairingCode} className="mt-5 cursor-pointer rounded-full bg-white px-5 py-2.5 text-sm font-bold text-text-primary shadow-sm">{copied ? 'Copied!' : 'Copy pairing code'}</button><p className="mt-4 text-sm text-text-secondary">Kaka works without this code. Use it only when you want to replace him with a custom pet you created.</p></div></section>}

      <section className="bg-white px-6 py-20"><div className="mx-auto max-w-5xl"><h2 className="text-center font-display text-3xl font-bold text-text-primary sm:text-4xl">Kaka appears in three steps</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{[['1', 'Download DeskBub', 'Choose the installer for your computer.'], ['2', 'Install and open', 'Launch the app—no account or code needed.'], ['3', 'Meet Kaka', 'Click Kaka to change actions, size, and opacity.']].map(([number, title, description]) => <article key={number} className="rounded-2xl border border-gray-100 bg-cream p-7"><span className="text-sm font-extrabold text-coral">STEP {number}</span><h3 className="mt-3 font-display text-lg font-bold text-text-primary">{title}</h3><p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p></article>)}</div></div></section>

      <section className="px-6 py-20"><div className="mx-auto max-w-3xl"><h2 className="text-center font-display text-3xl font-bold text-text-primary">Download FAQ</h2><div className="mt-8 space-y-4">{[['Do I need an account?', 'No. Download and use Kaka without signing in. An account is needed only to create and pair a custom pet.'], ['Does DeskBub access my files or screen?', 'DeskBub displays the pet in its own transparent window. Sharing features prepare a file for you; you remain in control of anything uploaded to social media.'], ['Can I switch back to Kaka?', 'Yes. Use the desktop controls or tray menu to switch back to the free Kaka pet at any time.']].map(([q, a]) => <details key={q} className="rounded-2xl border border-gray-100 bg-white px-6 py-4"><summary className="cursor-pointer font-bold text-text-primary">{q}</summary><p className="mt-3 leading-relaxed text-text-secondary">{a}</p></details>)}</div>{!isSignedIn && <p className="mt-10 text-center text-text-secondary">Already created a custom pet? <Link href="/sign-in" className="font-bold text-coral underline underline-offset-4">Sign in for your pairing code.</Link></p>}</div></section>
      <Footer />
    </main>
  );
}
