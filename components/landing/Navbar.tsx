'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

const publicLinks = [
  { href: '/free-desktop-pet', label: 'Free Kaka' },
  { href: '/custom-desktop-pet', label: 'Custom Pet' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/download', label: 'Download' },
];

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-cream/90 backdrop-blur-xl" aria-label="Primary navigation">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-2 font-display text-xl font-extrabold text-text-primary transition hover:text-coral">
          <span aria-hidden="true" className="text-2xl">🐾</span>
          DeskBub
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3.5 py-2 text-sm font-semibold text-text-secondary transition hover:bg-white hover:text-text-primary">
              {link.label}
            </Link>
          ))}
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="rounded-full px-3.5 py-2 text-sm font-semibold text-text-secondary transition hover:bg-white hover:text-text-primary">Dashboard</Link>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal"><button className="cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold text-text-secondary transition hover:bg-white hover:text-text-primary">Sign In</button></SignInButton>
          )}
          <Link href="/download" className="ml-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-coral/20 transition hover:bg-coral-dark">Download Free</Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-xl text-text-primary lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-gray-100 bg-cream px-5 py-4 shadow-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu} className="rounded-xl px-4 py-3 font-semibold text-text-primary hover:bg-white">{link.label}</Link>
            ))}
            {isSignedIn ? (
              <Link href="/dashboard" onClick={closeMenu} className="rounded-xl px-4 py-3 font-semibold text-text-primary hover:bg-white">Dashboard</Link>
            ) : (
              <SignInButton mode="modal"><button onClick={closeMenu} className="w-full cursor-pointer rounded-xl px-4 py-3 text-left font-semibold text-text-primary hover:bg-white">Sign In</button></SignInButton>
            )}
            <Link href="/download" onClick={closeMenu} className="mt-2 rounded-full bg-coral px-5 py-3 text-center font-bold text-white">Download Kaka Free</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
