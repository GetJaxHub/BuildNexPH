export default function CookiePolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Cookie Policy</h1>
      <p className="text-sm text-neutral-400 mb-8">Last updated: October 16, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help the site remember
            your preferences, understand how you use the site, and provide a personalized experience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">2. Types of Cookies We Use</h2>

          <h3 className="font-semibold text-neutral-700 mt-4 mb-1">Necessary Cookies</h3>
          <p>
            These cookies are essential for the website to function. They enable core features like authentication,
            session management, and security. Necessary cookies cannot be disabled.
          </p>

          <h3 className="font-semibold text-neutral-700 mt-4 mb-1">Analytics Cookies</h3>
          <p>
            These cookies collect anonymous information about how visitors use our site, such as pages visited and
            time spent. They help us improve site performance and user experience. Enabled only with your consent.
          </p>

          <h3 className="font-semibold text-neutral-700 mt-4 mb-1">Marketing Cookies</h3>
          <p>
            These cookies are used to deliver relevant advertisements and track the effectiveness of advertising
            campaigns. They may be set by third-party advertising networks. Enabled only with your consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">3. Managing Your Preferences</h2>
          <p>
            When you first visit BuildNexPH, you will see a cookie consent banner allowing you to Accept All,
            Reject Optional, or customize your preferences. Your choice is stored on your device and persists
            across visits.
          </p>
          <p className="mt-2">
            You can change your preferences at any time by clicking the &ldquo;Cookie Preferences&rdquo; link in
            the website footer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">4. Third-Party Cookies</h2>
          <p>
            Some third-party services we may use (such as analytics providers) set their own cookies. These are
            governed by the respective provider&rsquo;s privacy policy. We only load these services after you
            have granted consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">5. Browser Controls</h2>
          <p>
            You can also control cookies through your browser settings. Most browsers allow you to block or delete
            cookies. Note that blocking necessary cookies may affect site functionality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">6. Contact</h2>
          <p>
            Questions about our use of cookies? Contact us at [privacy@buildnex.ph].
          </p>
        </section>
      </div>
    </div>
  );
}
