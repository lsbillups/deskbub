export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-text-secondary text-sm mb-8">Last updated: July 2026</p>

        <h2>1. Information We Collect</h2>
        <p>When you use DeskBub, we collect:</p>
        <ul>
          <li><strong>Account information</strong> — email address and name via Clerk authentication.</li>
          <li><strong>Pet photos</strong> — images you upload to create your desktop pet.</li>
          <li><strong>Usage data</strong> — pages visited, features used, and generation history.</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>To generate and deliver your desktop pet.</li>
          <li>To process payments and manage your subscription.</li>
          <li>To improve our service and fix bugs.</li>
          <li>To communicate with you about your account.</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>Pet photos and generated content are stored securely on Supabase servers. Authentication data is managed by Clerk. Payment information is processed by Creem — we never see your full credit card details.</p>

        <h2>4. Data Sharing</h2>
        <p>We do not sell, trade, or share your personal data with third parties except as necessary to provide the service (e.g., AI processing via Replicate).</p>

        <h2>5. Your Rights</h2>
        <p>You can delete your account and all associated data at any time by contacting us. Upon deletion, all your uploaded photos and generated content will be permanently removed.</p>

        <h2>6. Cookies</h2>
        <p>We use essential cookies for authentication and session management. No tracking cookies are used.</p>

        <h2>7. Contact</h2>
        <p>For privacy questions, contact us at <strong>support@deskbub.app</strong>.</p>
      </div>
    </main>
  );
}
