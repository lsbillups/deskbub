import Footer from '@/components/landing/Footer';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Terms of Service', description: 'DeskBub terms of service — rules and guidelines for using our AI desktop pet service.' };
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Terms of Service</h1>
        <p className="text-text-secondary text-sm mb-8">Last updated: July 2026</p>

        <h2>1. Service Description</h2>
        <p>DeskBub provides AI-powered pet animation services. You upload photos of your pet, and we generate animated desktop companions.</p>

        <h2>2. AI Technology Disclosure</h2>
        <p>DeskBub uses third-party AI models hosted on Replicate to process your pet photos and generate animations. These models perform background removal, video generation, and video background removal. The specific models used may be updated from time to time to improve quality and performance.</p>

        <h2>3. User Responsibilities</h2>
        <ul>
          <li>You must own or have permission to use the photos you upload.</li>
          <li>You may not use the service to generate harmful, illegal, or NSFW content.</li>
          <li>You are responsible for maintaining the confidentiality of your account.</li>
        </ul>

        <h2>4. Payments & Credits</h2>
        <p>Payments are processed through Creem, our Merchant of Record. Each generation consumes one credit from your plan. Credits do not expire. All prices are in USD.</p>

        <h2>5. Intellectual Property</h2>
        <p>You retain ownership of your uploaded photos. The generated videos and animations are yours to use personally. You may not resell or redistribute the generated content as standalone assets.</p>

        <h2>6. Service Availability</h2>
        <p>We strive for high availability but do not guarantee uninterrupted service. AI generation times may vary based on demand and model availability.</p>

        <h2>7. Limitation of Liability</h2>
        <p>DeskBub is provided "as is." We are not liable for any damages arising from use of the service.</p>

        <h2>8. Termination</h2>
        <p>We reserve the right to suspend accounts that violate these terms.</p>

        <h2>9. Contact</h2>
        <p><strong>support@deskbub.com</strong></p>
      </div>
      <Footer />
    </main>
  );
}
