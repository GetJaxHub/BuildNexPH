export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral-400 mb-8">Last updated: October 16, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">1. Introduction</h2>
          <p>
            [Company Name] (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;BuildNexPH&rdquo;) is committed to protecting
            the privacy of contractors, suppliers, and visitors who use our B2B marketplace platform. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your information in accordance with the
            Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines, the GDPR, and the CCPA where
            applicable to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account information:</strong> Email address, password (hashed), company name, contact person, phone number, region, and business address.</li>
            <li><strong>Professional data:</strong> PCAB license numbers, accreditation details, uploaded government documents, and product listings.</li>
            <li><strong>Usage data:</strong> IP address, browser type, pages visited, and interaction data via cookies and similar technologies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your contractor account and company profile.</li>
            <li>To display your products, accreditation status, and documents to marketplace visitors.</li>
            <li>To communicate with you about your account, platform updates, and support requests.</li>
            <li>To analyze and improve our services and platform performance.</li>
            <li>To comply with legal obligations and government regulations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">4. Legal Basis for Processing (GDPR)</h2>
          <p>
            We process your personal data based on: (a) your consent when registering and uploading documents,
            (b) our legitimate interests in operating the marketplace, (c) the performance of a contract between
            you and us, and (d) compliance with legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">5. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Right to access:</strong> You may request a copy of your personal data.</li>
            <li><strong>Right to rectification:</strong> You may correct inaccurate or incomplete data.</li>
            <li><strong>Right to erasure:</strong> You may request deletion of your account and associated data.</li>
            <li><strong>Right to restrict processing:</strong> You may request we limit how we use your data.</li>
            <li><strong>Right to data portability:</strong> You may receive your data in a structured format.</li>
            <li><strong>Right to withdraw consent:</strong> You may withdraw consent at any time without affecting prior processing.</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, contact us at [privacy@buildnex.ph].</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">6. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active and for a reasonable period thereafter
            to comply with legal obligations, resolve disputes, and enforce our agreements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures, including encryption at rest and in
            transit, row-level security policies, and restricted access controls, to protect your personal data
            from unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">8. Cookie Usage</h2>
          <p>
            We use cookies to enhance your experience. See our{' '}
            <a href="/cookie-policy" className="text-primary-600 hover:underline">Cookie Policy</a> for details.
            You can manage your cookie preferences at any time through the cookie banner or the footer link.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">9. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites. We are not responsible for the privacy practices
            or content of these external sites. We encourage you to review their privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting
            the updated policy on this page and updating the &ldquo;Last updated&rdquo; date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, contact us at:<br />
            Email: [privacy@buildnex.ph]<br />
            Phone: [+63 2 8888 1234]<br />
            Address: [Makati City, Metro Manila, Philippines]
          </p>
        </section>
      </div>
    </div>
  );
}
