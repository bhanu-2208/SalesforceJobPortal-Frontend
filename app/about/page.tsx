'use client'
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

// ── LIVE — everything actually built and shipped ──────────────────────
const LIVE_FEATURES: Feature[] = [
  { icon: "🔐", title: "Secure JWT Authentication",     description: "Bcrypt-hashed passwords, short-lived access tokens, and httpOnly refresh cookies keep every account safe." },
  { icon: "📧", title: "Email OTP Verification",         description: "Every new account is verified with a 6-digit code sent straight to their inbox before they can log in." },
  { icon: "🎭", title: "Role-Based Access",               description: "Job Seekers, Recruiters, and Admins each get a tailored experience with the right permissions." },
  { icon: "🔍", title: "Smart Job Search",                description: "Search across title, company, skills, location, and more — all from one search bar." },
  { icon: "🧭", title: "Advanced Filters",                description: "Filter by Work Mode, Experience Level, Employment Type, Role, and Country in real time." },
  { icon: "📋", title: "Rich Job Descriptions",           description: "Overview, Responsibilities, Requirements, Preferred Qualifications, Benefits, Skills, Salesforce Products, and Certifications — beautifully organized." },
  { icon: "✨", title: "AI Job Post Generator",           description: "Paste any job description and let AI auto-fill every field — recruiters review and publish in seconds." },
  { icon: "✏️", title: "Edit & Manage Your Postings",     description: "Recruiters and Admins can edit or delete the jobs they've posted, anytime." },
  { icon: "🏢", title: "Company Directory",               description: "Browse every hiring company, see how many roles they have open, and filter jobs by employer." },
  { icon: "💾", title: "Saved Jobs",                      description: "Bookmark roles you're interested in and revisit them anytime from your personal saved list." },
  { icon: "✅", title: "Applied Jobs Tracker",             description: "Confirm when you've applied and keep a running history of every application." },
  { icon: "🎯", title: "ATS Resume Score Check",          description: "See how well your resume matches a specific job posting before you apply." },
  { icon: "🗣️", title: "Feedback System",                description: "Share your experience directly with our team — every submission is reviewed and tracked." },
  { icon: "👥", title: "Candidate Search",                description: "Recruiters can search and filter Salesforce talent by skills, experience, notice period, and location." },
  { icon: "🎖️", title: "AI Candidate Ranking",            description: "Paste a job description and instantly rank all candidates by how well they match." },
  { icon: "🔖", title: "Saved Candidates",                description: "Recruiters can bookmark promising candidates for later outreach." },
  { icon: "🤖", title: "Automated Job Aggregation",       description: "Every 12 hours, our system scans multiple job boards and imports genuine Salesforce roles automatically." },
  { icon: "🛡️", title: "Precision Job Filtering",         description: "A rule-based engine rejects generic sales roles and only accepts verified Salesforce platform positions." },
  { icon: "📄", title: "Full Job Content Extraction",     description: "We fetch and clean the original job page for complete, accurate descriptions — not just summaries." },
  { icon: "⚡", title: "Rate-Limited & Secure API",       description: "Every endpoint is protected against abuse with intelligent rate limiting." },
];

// ── UPCOMING — planned but not yet built ────────────────────────────────
const UPCOMING_FEATURES: Feature[] = [
  { icon: "📄", title: "Resume Auto-Fill",             description: "Upload your resume once and let AI auto-fill your entire profile." },
  { icon: "🧠", title: "AI Job Recommendations",       description: "Personalised job matches based on your skills, experience, and preferences." },
  { icon: "📊", title: "Recruiter Hiring Analytics",   description: "Dashboards showing hiring funnel metrics and time-to-hire insights." },
  { icon: "🗂️", title: "Candidate Pipeline Board",     description: "Drag-and-drop tracking from Applied → Shortlisted → Interview → Offer → Hired." },
  { icon: "📅", title: "Interview Scheduling",         description: "Coordinate and track interviews without leaving the platform." },
  { icon: "✔️", title: "Verified Profiles",             description: "Confirm candidate credentials via LinkedIn, GitHub, and Trailhead." },
  { icon: "💬", title: "Team Collaboration Notes",     description: "Recruiters can leave shared notes on candidates for their hiring team." },
  { icon: "🌐", title: "More Job Sources",             description: "Expanding automated imports to Ashby, Workable, and SmartRecruiters." },
];

// ── Scroll-reveal hook — lightweight, no extra library ──────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealCard({ feature, index, live }: { feature: Feature; index: number; live: boolean }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`about-feature-card ${live ? "about-feature-card--live" : "about-feature-card--upcoming"} ${visible ? "about-feature-card--visible" : ""}`}
      style={{ transitionDelay: `${(index % 6) * 60}ms` }}
    >
      <div className="about-feature-card__icon">{feature.icon}</div>
      <h3 className="about-feature-card__title">{feature.title}</h3>
      <p className="about-feature-card__desc">{feature.description}</p>
      {live ? (
        <span className="about-status-pill about-status-pill--live">✓ Live</span>
      ) : (
        <span className="about-status-pill about-status-pill--upcoming">🚀 Coming Soon</span>
      )}
    </div>
  );
}

function StatBlock({ value, label, delay }: { value: string; label: string; delay: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`about-stat ${visible ? "about-stat--visible" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      <span className="about-stat__value">{value}</span>
      <span className="about-stat__label">{label}</span>
    </div>
  );
}

export default function AboutPage() {
  const heroReveal = useScrollReveal();

  return (
    <>
      <Navbar />
      <div className="about-page">

        {/* ── Hero ── */}
        <div className="about-hero">
          <div className="about-hero__bg-orb about-hero__bg-orb--1" aria-hidden="true" />
          <div className="about-hero__bg-orb about-hero__bg-orb--2" aria-hidden="true" />
          <div className="about-container">
            <div ref={heroReveal.ref} className={`about-hero__content ${heroReveal.visible ? "about-hero__content--visible" : ""}`}>
              <span className="about-hero__badge">About TalentCloud</span>
              <h1 className="about-hero__title">
                Built for Salesforce.<br />Powered by AI.
              </h1>
              <p className="about-hero__sub">
                TalentCloud is a purpose-built hiring platform for the Salesforce ecosystem —
                connecting job seekers, recruiters, and the world's largest CRM community
                through intelligent automation and thoughtful design.
              </p>
            </div>

            <div className="about-stats-row">
              <StatBlock value="20+"  label="Features Live"     delay={0} />
              <StatBlock value="12hr" label="Auto Job Refresh"  delay={80} />
              <StatBlock value="4"    label="Job Sources"       delay={160} />
              <StatBlock value="100%" label="Salesforce Focus"  delay={240} />
            </div>
          </div>
        </div>

        {/* ── Live features ── */}
        <div className="about-container about-section">
          <div className="section__header">
            <span className="section__eyebrow">What We've Built</span>
            <h2 className="section__title">Live Features</h2>
            <p className="section__subtitle">Everything below is fully built, tested, and running right now.</p>
          </div>
          <div className="about-features-grid">
            {LIVE_FEATURES.map((f, i) => <RevealCard key={f.title} feature={f} index={i} live={true} />)}
          </div>
        </div>

        {/* ── Upcoming features ── */}
        <div className="about-upcoming-section">
          <div className="about-container about-section">
            <div className="section__header">
              <span className="section__eyebrow">What's Next</span>
              <h2 className="section__title">Upcoming Features</h2>
              <p className="section__subtitle">We're actively building these next — check back soon.</p>
            </div>
            <div className="about-features-grid">
              {UPCOMING_FEATURES.map((f, i) => <RevealCard key={f.title} feature={f} index={i} live={false} />)}
            </div>
          </div>
        </div>

        {/* ── Closing CTA ── */}
        <div className="about-cta">
          <div className="about-container about-cta__inner">
            <h2 className="about-cta__title">Ready to find your next Salesforce role?</h2>
            <p className="about-cta__sub">Join thousands of professionals already using TalentCloud.</p>
            <div className="about-cta__actions">
              <a href="/jobs" className="btn btn--primary btn--lg">Browse Jobs →</a>
              <a href="/register" className="btn btn--ghost btn--lg" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.4)" }}>Create Free Account</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}