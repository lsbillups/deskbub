import Footer from '@/components/landing/Footer';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacy Policy', description: 'How DeskBub collects, uses, and protects your personal data.' };
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-text-secondary text-sm mb-8">Last updated: August 2026</p>

        <h2>1. Information We Collect</h2>
        <p>When you use DeskBub, we collect:</p>
        <ul>
          <li><strong>Account information</strong> — email address and name via Clerk authentication.</li>
          <li><strong>Pet photos</strong> — images you upload to create your desktop pet.</li>
          <li><strong>Service data</strong> — features used and generation history needed to operate your account.</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>To generate and deliver your desktop pet.</li>
          <li>To process one-time purchases and manage generation credits.</li>
          <li>To improve our service and fix bugs.</li>
          <li>To communicate with you about your account.</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>Pet photos and generated content are stored using Supabase. Authentication data is managed by Clerk. Payment information is processed by Creem, so DeskBub does not receive your full card number.</p>

        <h2>4. Data Sharing</h2>
        <p>We do not sell personal data. We share the information needed to provide the service with processors such as Clerk for authentication, Supabase for storage, Creem for payments, and Replicate for AI processing.</p>

        <h2>5. Your Rights</h2>
        <p>You can request deletion of your account and associated content by contacting us. We will process verified deletion requests subject to legal and operational retention requirements.</p>

        <h2>6. Cookies</h2>
        <p>We use essential cookies for authentication and session management. No tracking cookies are used.</p>

        <h2>7. Contact</h2>
        <p>For privacy questions, contact us at <strong>support@deskbub.com</strong>.</p>
      </div>
      <Footer />
    </main>
  );
}
