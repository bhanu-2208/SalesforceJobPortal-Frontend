'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  company?: { name: string; logo?: string; website?: string };
}

interface SavedJobEntry {
  _id: string;
  job: Job;
  createdAt: string;
}

interface User { id: string; name: string; email: string; role: string; }

const WORK_MODE_CLASS: Record<string, string> = {
  Remote: "badge--green", Hybrid: "badge--blue", Onsite: "badge--gray",
};


async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem("tc_token");
  if (!token) return null;

  // Try the current token first
  const test = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (test.ok) return token;

  // Token expired — try refreshing using the httpOnly cookie
  const refresh = await fetch(`${API}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refresh.ok) return null;

  const data = await refresh.json();
  localStorage.setItem("tc_token", data.token);
  return data.token;
}

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
  return `${fmt(salary.min)}${salary.max ? ` – ${fmt(salary.max)}` : ""}`;
}

function initials(name?: string) {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Saved Job Card ─────────────────────────────────────────────────────
function SavedJobCard({
  entry,
  onUnsave,
  onViewDetails,
}: {
  entry: SavedJobEntry;
  onUnsave: (jobId: string) => void;
  onViewDetails: (slug: string) => void;
}) {
  const { job } = entry;
  const [removing, setRemoving] = useState(false);

  const handleUnsave = async () => {
    setRemoving(true);
    await onUnsave(job._id);
    setRemoving(false);
  };

  return (
    <div className={`job-card saved-job-card ${removing ? "saved-job-card--removing" : ""}`}>
      <div className="job-card__header">
        <div className="job-card__logo">{initials(job.company?.name)}</div>
        <div className="job-card__meta">
          <h3 className="job-card__title">{job.title}</h3>
          <span className="job-card__company">{job.company?.name ?? "Company"}</span>
        </div>
        {job.workMode && <span className={`badge ${WORK_MODE_CLASS[job.workMode]}`}>{job.workMode}</span>}
      </div>

      <div className="job-card__info">
        {job.location && (
          <span className="job-card__info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {job.location}
          </span>
        )}
        {job.experienceLevel && (
          <span className="job-card__info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            {job.experienceLevel}
          </span>
        )}
        <span className="job-card__info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {timeAgo(job.postedAt)}
        </span>
        {formatSalary(job.salary) && (
          <span className="job-card__info-item">💰 {formatSalary(job.salary)}</span>
        )}
      </div>

      {/* Saved date */}
      <div className="saved-job-card__saved-on">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        Saved {timeAgo(entry.createdAt)}
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="job-card__skills">
          {job.skills.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
          {job.skills.length > 4 && <span className="skill-tag">+{job.skills.length - 4}</span>}
        </div>
      )}

      <div className="job-card__actions">
        <button className="btn btn--primary btn--sm" onClick={() => onViewDetails(job.slug)}>
          View Details
        </button>
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
          Apply →
        </a>
        <button
          className="btn btn--sm saved-job-card__remove-btn"
          onClick={handleUnsave}
          disabled={removing}
          aria-label="Remove from saved"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<SavedJobEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState("");

  // Rehydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      const tok = localStorage.getItem("tc_token");
      if (raw) setUser(JSON.parse(raw));
      if (tok) setToken(tok);
      else { setLoading(false); }
    } catch { setLoading(false); }
  }, []);

  // Fetch saved jobs
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const validToken = await getValidToken();
        if (!validToken) { router.push("/login"); return; }
        setToken(validToken);
        const res = await fetch(`${API}/api/saved-jobs`, {
          headers: { Authorization: `Bearer ${validToken}` },
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
       setSavedJobs(data.data.filter((entry: any) => entry.job !== null));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleUnsave = async (jobId: string) => {
    try {
      await fetch(`${API}/api/saved-jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedJobs(prev => prev.filter(e => e.job._id !== jobId));
    } catch {}
  };

  // ── Not logged in ──────────────────────────────────────────────────
  if (!loading && !user) return (
    <>
      <Navbar />
      <div className="saved-page">
        <div className="jdetail-container">
          <div className="jobs-empty" style={{paddingTop:"6rem"}}>
            <div className="jobs-empty__icon">🔒</div>
            <h3>Login required</h3>
            <p>Please log in to view your saved jobs.</p>
            <button className="btn btn--primary btn--lg" onClick={() => router.push("/login")}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="saved-page">

        {/* ── Hero ── */}
        <div className="saved-hero">
          <div className="jdetail-container">
            <div className="saved-hero__inner">
              <div>
                <h1 className="saved-hero__title">Saved Jobs</h1>
                <p className="saved-hero__sub">
                  {loading ? "Loading…" : `${savedJobs.length} job${savedJobs.length !== 1 ? "s" : ""} saved`}
                </p>
              </div>
              <button className="btn btn--primary" style={{background:"#fff",color:"#0070C0",borderColor:"transparent"}} onClick={() => router.push("/jobs")}>
                Browse More Jobs →
              </button>
            </div>
          </div>
        </div>

        <div className="jdetail-container" style={{padding:"2rem 1.5rem 5rem"}}>

          {/* Loading skeletons */}
          {loading && (
            <div className="jobs-loading">
              {[...Array(4)].map((_, i) => <div key={i} className="jobs-skeleton" />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="jobs-error">
              <p>⚠️ {error}</p>
              <button className="btn btn--ghost" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && savedJobs.length === 0 && (
            <div className="jobs-empty" style={{paddingTop:"4rem"}}>
              <div className="jobs-empty__icon">📋</div>
              <h3>No saved jobs yet</h3>
              <p>Browse jobs and click "Save Job" to keep track of roles you're interested in.</p>
              <button className="btn btn--primary btn--lg" onClick={() => router.push("/jobs")}>
                Browse Jobs
              </button>
            </div>
          )}

          {/* Jobs grid */}
          {!loading && !error && savedJobs.length > 0 && (
            <>
              {/* Stats row */}
              <div className="saved-stats">
                {[
                  { label: "Saved",    value: savedJobs.length },
                  { label: "Remote",   value: savedJobs.filter(e => e.job?.workMode === "Remote").length },
                  { label: "Hybrid",   value: savedJobs.filter(e => e.job?.workMode === "Hybrid").length },
                  { label: "Onsite",   value: savedJobs.filter(e => e.job?.workMode === "Onsite").length },
                ].map(s => (
                  <div key={s.label} className="saved-stat">
                    <span className="saved-stat__value">{s.value}</span>
                    <span className="saved-stat__label">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="saved-grid">
                {savedJobs.map(entry => (
                  <SavedJobCard
                    key={entry._id}
                    entry={entry}
                    onUnsave={handleUnsave}
                    onViewDetails={(slug) => router.push(`/jobs/${slug}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}