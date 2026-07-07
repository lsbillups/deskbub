'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    emoji: '📸',
    title: 'Upload',
    description:
      'Take or choose a photo of your pet. Any breed, any angle — our AI handles the rest.',
  },
  {
    emoji: '✨',
    title: 'AI Magic',
    description:
      'Our AI removes the background and optimizes your pet for the desktop. Takes about 20 seconds.',
  },
  {
    emoji: '💻',
    title: 'Enjoy',
    description:
      'Download DeskBub. Your furry friend appears on your desktop, moving and reminding you to stay healthy.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            How It Works
          </h2>
          <p className="mt-3 text-text-secondary text-lg">
            Three simple steps. No technical skills needed.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              className="relative bg-cream rounded-2xl p-8 border border-gray-100 hover:border-coral/30 hover:shadow-lg hover:shadow-coral/5 transition-all"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-coral text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {i + 1}
              </div>
              <div className="text-5xl mb-4">{step.emoji}</div>
              <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
