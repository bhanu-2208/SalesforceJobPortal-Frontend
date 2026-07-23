'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const MAX_JOBS = 9;

// ── Types ────────────────────────────────────────────────────────────
interface Job {
  _id: string;
  title: string;
  slug: string;
  location?: string;
  country?: string;
  workMode?: "Remote" | "Hybrid" | "Onsite";
  experienceLevel?: string;
  roleCategory?: string;
  skills?: string[];
  employmentType?: string;
  applyUrl: string;
  postedAt?: string;
  company?: { name: string; logo?: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const WORK_MODE_CLASS: Record<string, string> = {
  Remote: "badge--green",
  Hybrid: "badge--blue",
  Onsite: "badge--gray",
};

// ── Helpers ──────────────────────────────────────────────────────────
function timeAgo(date?: string): string {
  if (!date) return "Recently";
  const diff  = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days === 0) return hours <= 1 ? "Just now" : `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function initials(name?: string): string {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Login required modal ─────────────────────────────────────────────
function LoginModal({
  message,
  onLogin,
  onClose,
}: {
  message: string;
  onLogin: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="navbar__modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-modal-title"
      onClick={onClose}
    >
      <div className="navbar__modal" onClick={(e) => e.stopPropagation()}>
        <div className="navbar__modal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 id="job-modal-title" className="navbar__modal-title">Login required</h2>
        <p className="navbar__modal-sub">{message}</p>
        <div className="navbar__modal-actions">
          <button className="btn btn--primary" onClick={onLogin}>Go to Login</button>
          <button className="btn btn--ghost"   onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Job Card ─────────────────────────────────────────────────────────
function JobCard({
  job,
  user,
  onGuard,
}: {
  job: Job;
  user: User | null;
  onGuard: (msg: string) => void;
}) {
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);

  const handleViewDetails = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      onGuard(`Please log in to view details for "${job.title}" at ${job.company?.name ?? "this company"}.`);
    }
  };

  const handleSave = async () => {
    if (!user) {
      onGuard(`Please log in to save "${job.title}" at ${job.company?.name ?? "this company"}.`);
      return;
    }

    const token = localStorage.getItem("tc_token");
    if (!token) {
      onGuard("Please log in to save this job.");
      return;
    }

    setSaving(true);
    try {
      if (saved) {
        await fetch(`${API}/api/saved-jobs/${job._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSaved(false);
      } else {
        await fetch(`${API}/api/saved-jobs/${job._id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSaved(true);
      }
    } catch {
      // silently ignore — user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="job-card">
      {/* Header */}
      <div className="job-card__header">
        <div className="job-card__logo" aria-hidden="true">
          {job.company?.logo ? (
            <img src={job.company.logo} alt={job.company.name} className="job-card__logo-img" />
          ) : (
            initials(job.company?.name)
          )}
        </div>
        <div className="job-card__meta">
          <h3 className="job-card__title">{job.title}</h3>
          <span className="job-card__company">{job.company?.name ?? "Company"}</span>
        </div>
        {job.workMode && (
          <span className={`badge ${WORK_MODE_CLASS[job.workMode]}`}>
            {job.workMode}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="job-card__info">
        {job.location && (
          <span className="job-card__info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {job.location}
          </span>
        )}
        {job.experienceLevel && (
          <span className="job-card__info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            {job.experienceLevel}
          </span>
        )}
        <span className="job-card__info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {timeAgo(job.postedAt)}
        </span>
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="job-card__skills">
          {job.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
          {job.skills.length > 4 && (
            <span className="skill-tag">+{job.skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="job-card__actions">
        <a
          href={user ? `/jobs/${job.slug}` : "#"}
          className={`btn btn--primary btn--sm ${!user ? "btn--locked" : ""}`}
          onClick={handleViewDetails}
          aria-label={`View details for ${job.title}`}
        >
          {!user && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 13, height: 13, marginRight: 4 }} aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          View Details
        </a>

        <button
          className={`btn btn--ghost btn--sm ${saved ? "btn--saved" : ""}`}
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-label={`${saved ? "Unsave" : "Save"} ${job.title} at ${job.company?.name ?? "this company"}`}
        >
          <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ width: 15, height: 15 }} aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {saving ? "…" : saved ? "Saved" : "Save Job"}
        </button>
      </div>
    </div>
  );
}

// ── LatestJobs ───────────────────────────────────────────────────────
export default function LatestJobs() {
  const router = useRouter();
  const [user,      setUser]      = useState<User | null>(null);
  const [jobs,      setJobs]      = useState<Job[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [modalMsg,  setModalMsg]  = useState("");
  const [showModal, setShowModal] = useState(false);

  // Rehydrate user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Fetch the most recent jobs — capped at MAX_JOBS (9)
  useEffect(() => {
    (async () => {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams({ page: "1", limit: String(MAX_JOBS) });
        const res    = await fetch(`${API}/api/jobs?${params}`);
        const data   = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Failed to load jobs.");
        setJobs((data.data ?? []).slice(0, MAX_JOBS));
      } catch (e: any) {
        setError(e.message ?? "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGuard = (msg: string) => {
    setModalMsg(msg);
    setShowModal(true);
  };

  const handleBrowseAll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      handleGuard("Please log in to browse all Salesforce jobs.");
    }
  };

  return (
    <>
      <section className="latest-jobs" aria-labelledby="latest-jobs-heading">
        <div className="section__header">
          <span className="section__eyebrow">Fresh Listings</span>
          <h2 id="latest-jobs-heading" className="section__title">Latest Jobs</h2>
          <p className="section__subtitle">
            Hand-picked Salesforce opportunities updated daily
          </p>
        </div>

        {loading ? (
          <div className="jobs-loading" style={{ maxWidth: 1100, margin: "0 auto" }}>
            {[...Array(6)].map((_, i) => <div key={i} className="jobs-skeleton" />)}
          </div>
        ) : error ? (
          <div className="jobs-error">
            <p>⚠️ {error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="jobs-empty">
            <div className="jobs-empty__icon">📋</div>
            <h3>No jobs posted yet</h3>
            <p>Check back soon for new Salesforce opportunities.</p>
          </div>
        ) : (
          <div className="latest-jobs__grid">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                user={user}
                onGuard={handleGuard}
              />
            ))}
          </div>
        )}

        <div className="latest-jobs__cta">
          <a
            href={user ? "/jobs" : "#"}
            className="btn btn--primary btn--lg"
            onClick={handleBrowseAll}
          >
            Browse All Jobs →
          </a>
        </div>
      </section>

      {showModal && (
        <LoginModal
          message={modalMsg}
          onLogin={() => { setShowModal(false); router.push("/login"); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}