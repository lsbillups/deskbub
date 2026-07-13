'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShared: () => void;
}

const shareChannels = [
  {
    name: 'Twitter',
    icon: '🐦',
    shareUrl: (link: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
  },
  {
    name: 'Facebook',
    icon: '📘',
    shareUrl: (link: string, text: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`,
  },
  {
    name: 'Copy Link',
    icon: '📋',
    shareUrl: (link: string) => link,
  },
];

const shareText = 'Turn your real pet into a living desktop companion! 🐾 Upload a photo, AI brings it to life on your screen. Try DeskBub for free 👇';
const shareLink = 'https://deskbub.app';

export default function ShareModal({ isOpen, onClose, onShared }: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async (channel: typeof shareChannels[0]) => {
    setLoading(true);
    setError('');

    try {
      // Call unlock API first
      const res = await fetch('/api/unlock-basic', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to unlock. Please try again.');
        setLoading(false);
        return;
      }

      // If it's "Copy Link", copy and mark as shared
      if (channel.name === 'Copy Link') {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => {
          onShared();
        }, 1000);
        return;
      }

      // Open share window, then mark as shared
      const url = channel.shareUrl(shareLink, shareText);
      window.open(url, '_blank', 'width=600,height=400');
      onShared();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl text-center"
          >
            <div className="text-5xl mb-4">🎁</div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-2">Share to Unlock Basic</h2>
            <p className="text-text-secondary text-sm mb-6">
              Share DeskBub with your friends to unlock <strong className="text-coral">1 free pet action</strong>!
            </p>

            <div className="space-y-3 mb-4">
              {shareChannels.map((ch) => (
                <button
                  key={ch.name}
                  onClick={() => handleShare(ch)}
                  disabled={loading}
                  className={`w-full flex items-center gap-3 px-5 py-3 rounded-full font-semibold text-sm transition-all cursor-pointer
                    ${ch.name === 'Copy Link'
                      ? 'bg-gray-100 text-text-primary hover:bg-gray-200'
                      : 'bg-coral text-white hover:bg-coral-dark shadow-lg shadow-coral/25'}
                    disabled:opacity-60 disabled:cursor-wait`}
                >
                  <span className="text-xl">{ch.icon}</span>
                  {ch.name === 'Copy Link' && copied ? '✅ Copied! Redirecting...' : `Share on ${ch.name}`}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-red-500 mb-3 p-2 bg-red-50 rounded-lg">{error}</p>}

            <p className="text-xs text-text-secondary/60">
              Limited to <strong>10 free unlocks per day</strong>. One per person.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
