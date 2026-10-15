'use client';

import { progressCounts, progressLabel, type BatchProgress } from '@/lib/generation/progress';

export default function GenerationProgress({ progress, working, error, onResume }: {
  progress: BatchProgress; working: boolean; error: string | null; onResume: () => void;
}) {
  const { total, completed, failed } = progressCounts(progress);
  const reviewOnly = progress.items.every(item => ['succeeded', 'failed', 'uncertain'].includes(item.status));
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 sm:p-8" aria-labelledby="generation-heading">
      <h2 id="generation-heading" className="text-2xl font-display font-bold text-text-primary">
        {working ? `Creating your ${total === 1 ? 'video' : `${total} videos`}` : 'Your progress is saved'}
      </h2>
      <p className="mt-3 text-text-secondary" role="status" aria-live="polite">
        {completed} of {total} completed{failed ? ` · ${failed} could not finish` : ''}.
        {working ? ' We’ll show this batch together when it’s ready.' : ' Your completed videos are safe.'}
      </p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="Videos completed"
        aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}>
        <div className="h-full bg-mint-dark transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${total ? completed / total * 100 : 0}%` }} />
      </div>
      <ol className="mt-6 divide-y divide-gray-100">
        {progress.items.map((item, index) => (
          <li key={item.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="min-w-0 break-words font-medium text-text-primary">{index + 1}. {item.label}</span>
            <span className="shrink-0 text-sm text-text-secondary">{progressLabel(item)}</span>
          </li>
        ))}
      </ol>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {!working && !reviewOnly && <button onClick={onResume}
        className="mt-5 rounded-full bg-text-primary px-6 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary cursor-pointer">
        Resume saved tasks
      </button>}
      {!working && reviewOnly && <p className="mt-5 text-sm text-text-secondary">A task needs review before it can continue. <a href="/contact" className="font-semibold underline underline-offset-4">Contact support</a> to check the saved task.</p>}
      <p className="mt-5 text-sm text-text-secondary">You can reopen this page to resume these same tasks. No need to select your actions or start again.</p>
    </section>
  );
}
