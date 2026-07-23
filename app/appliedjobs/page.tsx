'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Job {
  _id: string; title: string; slug: string; location?: string; country?: string;
  workMode?: "Remote" | "Hybrid" | "Onsite"; experienceLevel?: string; skills?: string[];
  employmentType?: string; applyUrl: string; postedAt?: string;
  company?: { name: string; logoUrl?: string };
}
interface AppliedEntry { _id: string; job: Job; createdAt: string; }
interface User { id: string; name: string; email: string; role: string; }

const WORK_MODE_CLASS: Record<string, string> = { Remote: "badge--green", Hybrid: "badge--blue", Onsite: "badge--gray" };

function timeAgo(date?: string): string {
  if (!date) return "Recently";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
function initials(name?: string) {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function AppliedJobCard({ entry, onRemove }: { entry: AppliedEntry; onRemove: (jobId: string) => void }) {
  const { job } = entry;
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    const token = await getValidToken();
    try {
      await fetch(`${API}/api/applied-jobs/${job._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      onRemove(job._id);
    } catch { setRemoving(false); }
  };

  return (
    <div className={`job-card saved-job-card ${removing ? "saved-job-card--removing" : ""}`}>
      <div className="job-card__header">
        <div className="job-card__logo">
          {job.company?.logoUrl ? <img src={job.company.logoUrl} alt={job.company.name} className="job-card__logo-img" /> : initials(job.company?.name)}
        </div>
        <div className="job-card__meta">
          <h3 className="job-card__title">{job.title}</h3>
          <span className="job-card__company">{job.company?.name ?? "Company"}</span>
        </div>
        {job.workMode && <span className={`badge ${WORK_MODE_CLASS[job.workMode]}`}>{job.workMode}</span>}
      </div>

      <div className="job-card__info">
        {job.location && <span className="job-card__info-item">📍 {job.location}</span>}
        {job.experienceLevel && <span className="job-card__info-item">💼 {job.experienceLevel}</span>}
        <span className="job-card__info-item">🕐 Posted {timeAgo(job.postedAt)}</span>
      </div>

      <div className="saved-job-card__saved-on">✅ Applied {timeAgo(entry.createdAt)}</div>

      {job.skills && job.skills.length > 0 && (
        <div className="job-card__skills">
          {job.skills.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      )}

      <div className="job-card__actions">
        <a href={`/jobs/${job.slug}`} className="btn btn--primary btn--sm">View Details</a>
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">Apply Again →</a>
        <button className="btn btn--sm saved-job-card__remove-btn" onClick={handleRemove} disabled={removing}>
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

export default function AppliedJobsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AppliedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tc_user");
        if (!raw) { router.push("/login"); return; }
        setUser(JSON.parse(raw));

        const token = await getValidToken();
        if (!token) { router.push("/login"); return; }

        const res = await fetch(`${API}/api/applied-jobs`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEntries(data.data.filter((e: any) => e.job !== null));
      } catch (e: any) {
        setError(e.message ?? "Failed to load applied jobs.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleRemove = (jobId: string) => setEntries(prev => prev.filter(e => e.job._id !== jobId));

  return (
    <>
      <Navbar />
      <div className="saved-page">
        <div className="saved-hero">
          <div className="jdetail-container">
            <div className="saved-hero__inner">
              <div>
                <h1 className="saved-hero__title">Applied Jobs</h1>
                <p className="saved-hero__sub">{loading ? "Loading…" : `${entries.length} job${entries.length !== 1 ? "s" : ""} applied`}</p>
              </div>
              <button className="btn btn--primary" style={{ background: "#fff", color: "#0070C0", borderColor: "transparent" }} onClick={() => router.push("/jobs")}>
                Browse More Jobs →
              </button>
            </div>
          </div>
        </div>

        <div className="jdetail-container" style={{ padding: "2rem 1.5rem 5rem" }}>
          {loading ? (
            <div className="jobs-loading">{[...Array(4)].map((_, i) => <div key={i} className="jobs-skeleton" />)}</div>
          ) : error ? (
            <div className="jobs-error"><p>⚠️ {error}</p></div>
          ) : entries.length === 0 ? (
            <div className="jobs-empty" style={{ paddingTop: "4rem" }}>
              <div className="jobs-empty__icon">📄</div>
              <h3>No applied jobs yet</h3>
              <p>When you apply to a job and confirm it, it'll show up here.</p>
              <button className="btn btn--primary btn--lg" onClick={() => router.push("/jobs")}>Browse Jobs</button>
            </div>
          ) : (
            <div className="saved-grid">
              {entries.map(entry => <AppliedJobCard key={entry._id} entry={entry} onRemove={handleRemove} />)}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}