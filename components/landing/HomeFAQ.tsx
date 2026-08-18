const faqs = [
  ['Is Kaka really free?', 'Yes. Kaka is included with the DeskBub app, needs no account, and can be used for as long as you like.'],
  ['Can I use my own dog or cat?', 'Yes. Custom pets are created from your own photo and are sold as a one-time purchase starting at $1.'],
  ['Does DeskBub work on Windows and Mac?', 'DeskBub is available for Windows 10/11 and macOS 12 or later.'],
  ['Does the pet cover my work?', 'You can drag your pet around the desktop and adjust its size and opacity from the app controls.'],
];

export default function HomeFAQ() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display text-3xl font-bold text-text-primary sm:text-4xl">Questions before Kaka moves in?</h2>
        <div className="mt-10 space-y-4">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-gray-100 bg-cream px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-text-primary">{question}<span className="text-xl text-coral transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 pr-8 leading-relaxed text-text-secondary">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
