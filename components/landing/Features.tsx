'use client';

import { motion } from 'framer-motion';

const features = [
  {
    emoji: '🐕',
    title: 'Your Real Pet, Not a Cartoon',
    description:
      'We use your actual pet photo — no generic avatars, no pixel art. Your golden retriever looks like YOUR golden retriever.',
  },
  {
    emoji: '💧',
    title: 'Gentle Health Reminders',
    description:
      'Your pet nudges you to drink water, stand up, stretch, and rest your eyes. Cute, not annoying.',
  },
  {
    emoji: '🪶',
    title: 'Lightweight & Always On',
    description:
      'Sits quietly on your desktop without slowing anything down. Always there, never in the way.',
  },
  {
    emoji: '🔒',
    title: 'Privacy First',
    description:
      'Your pet photos are encrypted at rest and in transit. We never share, sell, or use them for training.',
  },
];

export default function Features() {
  return (
    <section className="py-20 px-6 bg-cream">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            Why DeskBub?
          </h2>
          <p className="mt-3 text-text-secondary text-lg">
            Not just another desktop toy. A little companion that cares.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-mint/40 hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-3">{f.emoji}</div>
              <h3 className="text-lg font-display font-bold text-text-primary mb-1.5">
                {f.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
