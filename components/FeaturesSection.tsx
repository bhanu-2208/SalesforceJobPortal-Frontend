'use client'
import { useState } from "react";

type TabKey = "seekers" | "recruiters" | "platform";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// ── Icons ────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
  </svg>
);
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconGauge = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /><path d="M12 12l3-3" /><path d="M12 4v2" />
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconBadge = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5" />
  </svg>
);
const IconPipeline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
    <rect x="16" y="15" width="6" height="6" rx="1" /><path d="M8 6h1m4 6h1" />
  </svg>
);
const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);

// ── Feature data per audience ──────────────────────────────────────────
const FEATURES: Record<TabKey, Feature[]> = {
  seekers: [
    { icon: <IconSparkle />, title: "AI Job Recommendations", description: "Get personalised matches based on your skills, experience, and preferences — no more scrolling through irrelevant listings." },
    { icon: <IconFile />,    title: "Resume Auto-Fill",        description: "Upload your resume once and let AI auto-fill your profile. Edit anytime to keep it accurate." },
    { icon: <IconGauge />,   title: "Resume Score & ATS Check", description: "See how your resume performs against real ATS systems, with actionable tips to improve it." },
    { icon: <IconBolt />,    title: "Easy Apply",              description: "Apply to jobs in one click using your saved profile — no repetitive forms." },
    { icon: <IconBell />,    title: "Job Alerts",              description: "Get notified the moment a role matching your criteria goes live." },
    { icon: <IconTarget />,  title: "Profile Completion Score", description: "Track how complete your profile is and boost visibility to recruiters." },
  ],
  recruiters: [
    { icon: <IconSparkle />,  title: "AI Job Posting",         description: "Paste a job description and let AI auto-fill the entire listing — edit before publishing." },
    { icon: <IconTarget />,   title: "AI Candidate Matching",  description: "Automatically surface the best-fit candidates for each role based on skills and experience." },
    { icon: <IconUsers />,    title: "Candidate Pipeline",     description: "Track every candidate from Applied → Shortlisted → Interview → Offer → Hired, all in one board." },
    { icon: <IconBadge />,    title: "Verified Profiles",      description: "Confirm candidate credentials via LinkedIn, GitHub, Trailhead, and certifications." },
    { icon: <IconMail />,     title: "Direct Invitations",     description: "Send email invitations straight from search results to suitable candidates." },
    { icon: <IconCalendar />, title: "Interview Scheduling",   description: "Coordinate and track interviews end-to-end without leaving the platform." },
  ],
  platform: [
    { icon: <IconSearch />,   title: "Global Search",       description: "Powerful search across jobs, candidates, and companies with advanced filters." },
    { icon: <IconLayers />,   title: "Role-Based Access",   description: "Tailored experiences for job seekers, recruiters, and admins — everyone sees what matters to them." },
    { icon: <IconChart />,    title: "Hiring Analytics",    description: "Recruiters get dashboards with real hiring metrics to optimise their process." },
    { icon: <IconPipeline />, title: "Company Profiles",    description: "Every employer gets a dedicated profile showcasing open roles and culture." },
    { icon: <IconShield />,   title: "Data Control",        description: "Admins can manage, archive, or remove jobs, profiles, and companies with full oversight." },
    { icon: <IconBolt />,     title: "Always Free for Seekers", description: "Job search, applications, and alerts are completely free — always." },
  ],
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "seekers",    label: "For Job Seekers" },
  { key: "recruiters", label: "For Recruiters" },
  { key: "platform",   label: "Platform Highlights" },
];

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("seekers");

  return (
    <section className="features" aria-labelledby="features-heading">
      <div className="section__header">
        <span className="section__eyebrow">Everything You Need</span>
        <h2 id="features-heading" className="section__title">
          Built for Job Seekers, Recruiters, and Everyone in Between
        </h2>
        <p className="section__subtitle">
          A complete Salesforce hiring platform — powered by AI, designed for real results
        </p>
      </div>

      {/* Tabs */}
      <div className="features__tabs" role="tablist" aria-label="Feature categories">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`features__tab ${activeTab === tab.key ? "features__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feature grid */}
      <div className="features__grid">
        {FEATURES[activeTab].map((feature) => (
          <div key={feature.title} className="feature-card">
            <div className="feature-card__icon" aria-hidden="true">
              {feature.icon}
            </div>
            <h3 className="feature-card__title">{feature.title}</h3>
            <p className="feature-card__desc">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}