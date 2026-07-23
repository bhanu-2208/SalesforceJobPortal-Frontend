'use client'

const SalesforceIcon = () => (
  <svg viewBox="0 0 100 67" xmlns="http://www.w3.org/2000/svg" className="footer__logo-icon" aria-hidden="true">
    <path d="M41.4 9.7C44.8 6 49.6 3.8 54.9 3.8c7.3 0 13.6 4.1 17 10.1 2.9-1.3 6.1-2 9.5-2 13.1 0 23.7 10.7 23.7 23.9S94.5 59.7 81.4 59.7H20.5C9.2 59.7 0 50.5 0 39.1c0-10.5 7.8-19.2 18-20.5-.1-.9-.2-1.7-.2-2.6C17.8 7.2 25 0 33.9 0c3.3 0 6.4 1 9 2.7" fill="#00A1E0" />
    <text x="50" y="42" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="18" fill="#ffffff" letterSpacing="0.5">sf</text>
  </svg>
);

const FOOTER_LINKS = {
  "Browse Jobs": [
    { label: "Salesforce Developer",  href: "/jobs?role=developer" },
    { label: "Salesforce Admin",      href: "/jobs?role=admin" },
    { label: "Salesforce Architect",  href: "/jobs?role=architect" },
    { label: "Marketing Cloud",       href: "/jobs?role=marketing-cloud" },
    { label: "Remote Jobs",           href: "/jobs?mode=remote" },
  ],
  "Top Locations": [
    { label: "Jobs in India",         href: "/jobs?location=india" },
    { label: "Jobs in USA",           href: "/jobs?location=usa" },
    { label: "Jobs in UK",            href: "/jobs?location=uk" },
    { label: "Jobs in Germany",       href: "/jobs?location=germany" },
    { label: "Jobs in Australia",     href: "/jobs?location=australia" },
  ],
  "Company": [
    { label: "About Us",              href: "/about" },
    { label: "Post a Job",            href: "/post-job" },
    { label: "Contact",               href: "/contact" },
    { label: "Privacy Policy",        href: "/privacy" },
    { label: "Terms of Service",      href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        {/* Brand column */}
        <div className="footer__brand-col">
          <a href="/" className="footer__brand" aria-label="TalentCloud home">
            <SalesforceIcon />
            <span className="footer__brand-name">TalentCloud</span>
          </a>
          <p className="footer__tagline">
            The #1 job board for Salesforce professionals. Find your next
            role in the Salesforce ecosystem.
          </p>
          {/* Social links */}
          <div className="footer__socials">
            {[
              { label: "LinkedIn", href: "#", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
              { label: "Twitter", href: "#", path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" },
            ].map((social) => (
              <a key={social.label} href={social.href} className="footer__social-link" aria-label={social.label}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="footer__link-col">
            <h3 className="footer__col-heading">{heading}</h3>
            <ul className="footer__link-list">
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="footer__link">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div className="footer__newsletter">
        <div className="footer__newsletter-text">
          <h3 className="footer__newsletter-title">Get job alerts in your inbox</h3>
          <p className="footer__newsletter-sub">New Salesforce jobs delivered weekly. No spam.</p>
        </div>
        <div className="footer__newsletter-form">
          <input
            type="email"
            className="footer__newsletter-input"
            placeholder="you@example.com"
            aria-label="Email for job alerts"
          />
          <button className="btn btn--primary" type="button">
            Subscribe
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <p className="footer__copy">
          © {new Date().getFullYear()} TalentCloud. All rights reserved.
        </p>
        <p className="footer__credit">
          Built for the Salesforce community.
        </p>
      </div>
    </footer>
  );
}