'use client';

import { motion } from 'framer-motion';

const reviews = [
  {
    text: 'My cat Pixel literally sits on my screen now. I work from home and he usually sleeps behind my monitor — now I feel like he\'s actually with me. Love this thing.',
    name: 'Sarah',
    role: 'cat mom & software engineer',
  },
  {
    text: 'The water reminder actually works. My golden retriever Charlie pops up with a little bubble saying "Water break!" and I can\'t say no to that face.',
    name: 'Mike',
    role: 'dog dad & designer',
  },
  {
    text: 'I uploaded a photo of my late corgi, and now he hangs out on my desktop every day. It sounds silly but it genuinely makes me smile.',
    name: 'Emily',
    role: 'corgi lover & student',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            Loved by Pet Parents
          </h2>
          <p className="mt-3 text-text-secondary text-lg">
            Join thousands who already have their furry friends on their
            desktop.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-cream rounded-2xl p-7 border border-gray-100 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3 text-lg">
                {'⭐'.repeat(5)}
              </div>
              <p className="text-text-secondary leading-relaxed flex-1 italic">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-display font-semibold text-text-primary">
                  {r.name}
                </p>
                <p className="text-sm text-text-secondary/70">{r.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
