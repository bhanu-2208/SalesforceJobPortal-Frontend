'use client'
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AtsScoreModal from "@/components/Atsscoremodal";
import ApplyConfirmModal from "@/components/Applyconfirmmodal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Job {
  _id: string;
  title: string;
  slug: string;
  description: string;
  location?: string;
  country?: string;
  workMode?: "Remote" | "Hybrid" | "Onsite";
  experienceLevel?: string;
  roleCategory?: string;
  skills?: string[];
  salary?: { min?: number; max?: number; currency?: string };
  employmentType?: string;
  applyUrl: string;
  postedAt?: string;
  expiresAt?: string;
  source?: string;
  company?: { _id: string; name: string; logo?: string; website?: string };
}

interface User { id: string; name: string; email: string; role: string; }

const WORK_MODE_CLASS: Record<string, string> = {
  Remote: "badge--green", Hybrid: "badge--blue", Onsite: "badge--gray",
};

function timeAgo(date?: string): string {
  if (!date) return "Recently";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function formatSalary(salary?: Job["salary"]): string {
  if (!salary?.min) return "";
  const cur = salary.currency === "USD" ? "$" : "₹";
  const fmt = (n: number) => salary.currency === "USD"
    ? `${cur}${(n / 1000).toFixed(0)}k`
    : `${cur}${(n / 100000).toFixed(1)}L`;
  return `${fmt(salary.min)}${salary.max ? ` – ${fmt(salary.max)}` : ""} / yr`;
}

function initials(name?: string) {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function JobDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const slug    = params?.slug as string;

  const [job,     setJob]     = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState("");
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAts, setShowAts] = useState(false);

  // Rehydrate user
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      const tok = localStorage.getItem("tc_token");
      if (raw) setUser(JSON.parse(raw));
      if (tok) setToken(tok);
    } catch {}
  }, []);

  // Fetch job
  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/api/jobs/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Job not found.");
        setJob(data.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Check if saved
  useEffect(() => {
    if (!token || !job) return;
    (async () => {
      try {
        const res  = await fetch(`${API}/api/saved-jobs/ids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSaved(data.data.includes(job._id));
      } catch {}
    })();
  }, [token, job]);

  const handleSave = async () => {
    if (!user) { router.push("/login"); return; }
    setSaving(true);
    try {
      if (saved) {
        await fetch(`${API}/api/saved-jobs/${job!._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSaved(false);
      } else {
        await fetch(`${API}/api/saved-jobs/${job!._id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSaved(true);
      }
    } catch {}
    setSaving(false);
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) return (
    <>
      <Navbar />
      <div className="jdetail-page">
        <div className="jdetail-container">
          <div className="jdetail-skeleton jdetail-skeleton--hero" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.5rem", marginTop:"1.5rem" }}>
            <div>
              <div className="jdetail-skeleton" style={{ height:32, marginBottom:12, borderRadius:8 }} />
              <div className="jdetail-skeleton" style={{ height:200, borderRadius:10 }} />
            </div>
            <div className="jdetail-skeleton" style={{ height:300, borderRadius:10 }} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Error ─────────────────────────────────────────────────────────
  if (error || !job) return (
    <>
      <Navbar />
      <div className="jdetail-page">
        <div className="jdetail-container">
          <div className="jobs-empty">
            <div className="jobs-empty__icon">😕</div>
            <h3>{error || "Job not found"}</h3>
            <p>This job may have been removed or the link is incorrect.</p>
            <button className="btn btn--primary" onClick={() => router.push("/jobs")}>Browse All Jobs</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="jdetail-page">

        {/* ── Hero banner ── */}
        <div className="jdetail-hero">
          <div className="jdetail-container">
            {/* Breadcrumb */}
            <nav className="jdetail-breadcrumb" aria-label="Breadcrumb">
              <a href="/"    className="jdetail-breadcrumb__link">Home</a>
              <span className="jdetail-breadcrumb__sep">›</span>
              <a href="/jobs" className="jdetail-breadcrumb__link">Jobs</a>
              <span className="jdetail-breadcrumb__sep">›</span>
              <span className="jdetail-breadcrumb__current">{job.title}</span>
            </nav>

            <div className="jdetail-hero__inner">
              <div className="jdetail-hero__left">
                {/* Company logo */}
                <div className="jdetail-logo">{initials(job.company?.name)}</div>
                <div>
                  <h1 className="jdetail-title">{job.title}</h1>
                  <p className="jdetail-company">
                    {job.company?.name ?? "Company"}
                    {job.company?.website && (
                      <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="jdetail-company__link">
                        ↗ Visit website
                      </a>
                    )}
                  </p>
                  {/* Badges */}
                  <div className="jdetail-badges">
                    {job.workMode      && <span className={`badge ${WORK_MODE_CLASS[job.workMode]}`}>{job.workMode}</span>}
                    {job.employmentType && <span className="badge badge--gray">{job.employmentType}</span>}
                    {job.experienceLevel && <span className="badge badge--blue">{job.experienceLevel}</span>}
                    {job.roleCategory  && <span className="badge badge--blue">{job.roleCategory}</span>}
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="jdetail-hero__actions">
                <button
                  className="btn btn--primary btn--lg"
                  onClick={() => {
                    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
                    setShowApplyModal(true);
                  }}
                >
                  Apply Now →
                </button>
                  {user && (
                    <button className="btn btn--lg ats-check-btn" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.4)" }} onClick={() => setShowAts(true)}>
                      🎯 Check ATS Score
                    </button>
                  )}
                <button
                  className={`btn btn--lg ${saved ? "btn--saved" : "btn--ghost"}`}
                  onClick={handleSave}
                  disabled={saving}
                  aria-label={saved ? "Unsave job" : "Save job"}
                  style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
                    (e.currentTarget as HTMLButtonElement).style.color = "#0070C0";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                  }}
                >
                  <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  {saving ? "..." : saved ? "Saved" : "Save Job"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="jdetail-container jdetail-body">
          <div className="jdetail-grid">

            {/* ── Main content ── */}
            <main className="jdetail-main">

              {/* Quick info cards */}
              <div className="jdetail-info-row">
                {[
                  { icon: "📍", label: "Location",   value: job.location ?? "Not specified" },
                  { icon: "🌍", label: "Country",    value: job.country  ?? "Not specified" },
                  { icon: "💼", label: "Experience", value: job.experienceLevel ?? "Not specified" },
                  { icon: "⏰", label: "Type",       value: job.employmentType ?? "Not specified" },
                  { icon: "🕐", label: "Posted",     value: timeAgo(job.postedAt) },
                  { icon: "💰", label: "Salary",     value: formatSalary(job.salary) || "Not disclosed" },
                ].map(item => (
                  <div key={item.label} className="jdetail-info-card">
                    <span className="jdetail-info-icon">{item.icon}</span>
                    <div>
                      <span className="jdetail-info-label">{item.label}</span>
                      <span className="jdetail-info-value">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Skills Required</h2>
                  <div className="job-card__skills">
                    {job.skills.map(s => <span key={s} className="skill-tag jdetail-skill">{s}</span>)}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="jdetail-section">
                <h2 className="jdetail-section-title">Job Description</h2>
                <div className="jdetail-description">
                  {job.description.split("\n").map((line, i) => {
                    if (line.trim() === "")           return <br key={i} />;
                    if (line.startsWith("•"))         return <p key={i} className="jdetail-bullet">{line}</p>;
                    if (line.endsWith(":") && line.length < 60) return <h3 key={i} className="jdetail-desc-heading">{line}</h3>;
                    return <p key={i} className="jdetail-desc-para">{line}</p>;
                  })}
                </div>
              </div>

              {/* Apply CTA bottom */}
              <div className="jdetail-apply-cta">
                <div>
                  <p className="jdetail-apply-cta__text">Interested in this role?</p>
                  <p className="jdetail-apply-cta__sub">Apply directly on the company's careers page.</p>
                </div>
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--lg">
                  Apply Now →
                </a>
              </div>
            </main>

            {/* ── Sidebar ── */}
            <aside className="jdetail-sidebar">
              {/* Job summary card */}
              <div className="jdetail-sidebar-card">
                <h3 className="jdetail-sidebar-card__title">Job Summary</h3>
                <ul className="jdetail-summary-list">
                  {[
                    { label: "Posted",      value: timeAgo(job.postedAt) },
                    { label: "Work Mode",   value: job.workMode      ?? "—" },
                    { label: "Experience",  value: job.experienceLevel ?? "—" },
                    { label: "Employment",  value: job.employmentType ?? "—" },
                    { label: "Location",    value: job.location      ?? "—" },
                    { label: "Country",     value: job.country       ?? "—" },
                    { label: "Role",        value: job.roleCategory  ?? "—" },
                    { label: "Salary",      value: formatSalary(job.salary) || "Not disclosed" },
                    { label: "Source",      value: job.source        ?? "TalentCloud" },
                  ].map(item => (
                    <li key={item.label} className="jdetail-summary-item">
                      <span className="jdetail-summary-label">{item.label}</span>
                      <span className="jdetail-summary-value">{item.value}</span>
                    </li>
                  ))}
                </ul>
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary" style={{width:"100%",justifyContent:"center",marginTop:"1.25rem"}}>
                  Apply Now →
                </a>
                <button
                  className={`btn ${saved ? "btn--saved" : "btn--ghost"}`}
                  style={{width:"100%",justifyContent:"center",marginTop:"0.625rem"}}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  {saving ? "..." : saved ? "Saved" : "Save Job"}
                </button>
                {user && (
                  <button
                    className="btn btn--ghost ats-check-btn"
                    style={{ width: "100%", justifyContent: "center", marginTop: "0.625rem" }}
                    onClick={() => setShowAts(true)}
                  >
                    🎯 Check ATS Score
                  </button>
                )}
              </div>

              {/* Share card */}
              <div className="jdetail-sidebar-card">
                <h3 className="jdetail-sidebar-card__title">Share this Job</h3>
                <div className="jdetail-share-btns">
                  {[
                    { label: "Copy Link", action: () => { navigator.clipboard.writeText(window.location.href); } },
                    { label: "LinkedIn",  action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank") },
                    { label: "Twitter",   action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(job.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank") },
                  ].map(btn => (
                    <button key={btn.label} className="btn btn--ghost btn--sm jdetail-share-btn" onClick={btn.action}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Back to jobs */}
              <button className="btn btn--ghost" style={{width:"100%",justifyContent:"center"}} onClick={() => router.push("/jobs")}>
                ← Back to Jobs
              </button>
            </aside>
          </div>
        </div>
      </div>
      {showAts && <AtsScoreModal jobId={job._id} onClose={() => setShowAts(false)} />}
      {showApplyModal && (
        <ApplyConfirmModal
          jobId={job._id}
          jobTitle={job.title}
          applyUrl={job.applyUrl}
          onClose={() => setShowApplyModal(false)}
          onMarked={() => {
            console.log("Marked applied");
          }}
        />
      )}
      <Footer />
    </>
  );
}