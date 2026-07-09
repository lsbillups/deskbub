export default function RefundPage() {
  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Refund Policy</h1>
        <p className="text-text-secondary text-sm mb-8">Last updated: July 2026</p>

        <h2>Eligibility</h2>
        <p>You may request a refund if:</p>
        <ul>
          <li>The AI generation failed or produced unusable results due to a technical error on our side.</li>
          <li>You were charged incorrectly or double-charged.</li>
        </ul>

        <h2>Non-Refundable Cases</h2>
        <ul>
          <li>Credits that have already been used for generation.</li>
          <li>Dissatisfaction with the artistic quality of AI-generated results (generation quality varies and is part of the service).</li>
          <li>Purchases made more than 7 days ago.</li>
        </ul>

        <h2>How to Request</h2>
        <p>Email <strong>support@deskbub.app</strong> with your order ID and reason for refund. We will respond within 48 hours. Approved refunds are processed within 5-10 business days.</p>

        <h2>Chargebacks</h2>
        <p>If you initiate a chargeback without contacting us first, your account may be suspended. Please reach out to us first — we'll make it right.</p>
      </div>
    </main>
  );
}
