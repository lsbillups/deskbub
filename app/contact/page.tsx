'use client';
import Footer from '@/components/landing/Footer';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: dbErr } = await supabase.from('feedback').insert({
        name: name.trim() || 'Anonymous',
        email: email.trim() || 'Not provided',
        message: message.trim(),
      });
      if (dbErr) throw dbErr;
      setSent(true);
    } catch {
      setError('Failed to send. Please email support@deskbub.app directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary text-center mb-2">Contact Us</h1>
          <p className="text-text-secondary text-center mb-8">Questions, feedback, or just want to say hi? We&apos;d love to hear from you.</p>
        </motion.div>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-mint/30 p-8 text-center">
            <div className="text-5xl mb-4">💌</div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-2">Thank you!</h2>
            <p className="text-text-secondary">Your message has been received. We&apos;ll get back to you soon.</p>
            <button onClick={() => { setSent(false); setName(''); setEmail(''); setMessage(''); }} className="mt-6 text-sm text-coral underline underline-offset-4 cursor-pointer">Send another message</button>
          </motion.div>
        ) : (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-coral transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com (optional)" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-coral transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Message *</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required placeholder="Tell us what you think... bugs, feature ideas, or anything!" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-coral transition-colors resize-none" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={sending} className="w-full py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25 disabled:opacity-60 cursor-pointer">
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </motion.form>
        )}
      </div>
      <Footer />
    </main>
  );
}
