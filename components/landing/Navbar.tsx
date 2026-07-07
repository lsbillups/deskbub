'use client';

import Link from 'next/link';
import { useAuth, UserButton, SignInButton } from '@clerk/nextjs';

export default function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-display font-bold text-text-primary hover:text-coral transition-colors"
        >
          <span className="text-2xl">🐾</span>
          DeskBub
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <Link
                href="/sign-up"
                className="px-5 py-2 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25 hover:shadow-coral/40"
              >
                Get Started Free
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/download"
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Download
              </Link>
              <Link
                href="/upload"
                className="px-5 py-2 text-sm font-semibold bg-coral text-white rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25"
              >
                Upload Pet
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
