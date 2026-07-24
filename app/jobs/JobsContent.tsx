'use client'
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";



// ── Types ─────────────────────────────────────────────────────────────
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
  postedBy?: string; // ← owning recruiter/admin's user id, used for delete permission
  company?: { name: string; logo?: string };
}

interface User { id: string; name: string; email: string; role: string; }

// ── Helpers ───────────────────────────────────────────────────────────
const WORK_MODE_CLASS: Record<string, string> = {
  Remote: "badge--green", Hybrid: "badge--blue", Onsite: "badge--gray",
};

const SALESFORCE_ROLES = [
  "CPQ Specialist",
  "Experience Cloud Developer",
  "Field Service Lightning Consultant",
  "Marketing Cloud Architect",
  "Marketing Cloud Consultant",
  "Marketing Cloud Developer",
  "Salesforce Administrator",
  "Salesforce Architect",
  "Salesforce Business Analyst",
  "Salesforce Consultant",
  "Salesforce Data Analyst",
  "Salesforce Data Engineer",
  "Salesforce Developer",
  "Salesforce DevOps Engineer",
  "Salesforce Functional Consultant",
  "Salesforce Integration Developer",
  "Salesforce Intern",
  "Salesforce Platform Engineer",
  "Salesforce Product Owner",
  "Salesforce Project Manager",
  "Salesforce QA Engineer",
  "Salesforce Release Manager",
  "Salesforce Scrum Master",
  "Salesforce Solution Architect",
  "Salesforce Support Engineer",
  "Salesforce Sustainability Cloud Consultant",
  "Salesforce Technical Architect",
  "Salesforce Technical Lead",
  "Salesforce Trainer",
  "Service Cloud Consultant",
];

function timeAgo(date?: string): string {
  if (!date) return "Recently";
  const diff = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days === 0) return hours <= 1 ? "Just now" : `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function formatSalary(salary?: Job["salary"]): string {
  if (!salary || !salary.min) return "";
  const cur = salary.currency === "USD" ? "$" : "₹";
  const fmt = (n: number) => salary.currency === "USD" ? `${cur}${(n/1000).toFixed(0)}k` : `${cur}${(n/100000).toFixed(1)}L`;
  return `${fmt(salary.min)} – ${fmt(salary.max!)}`;
}

function initials(name?: string): string {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// Can this user delete this specific job?
// - Admins can delete any job.
// - Recruiters can only delete jobs where they are the `postedBy` owner.
// - Regular job seekers never get a delete button at all.
function canDeleteJob(user: User | null, job: Job): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "recruiter") return job.postedBy === user.id;
  return false;
}

// ── Job Detail Modal ──────────────────────────────────────────────────
function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className="jd-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jd-modal" onClick={e => e.stopPropagation()}>
        <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="jd-header">
          <div className="job-card__logo jd-logo">{initials(job.company?.name)}</div>
          <div>
            <h2 className="jd-title">{job.title}</h2>
            <p className="jd-company">{job.company?.name ?? "Company"}</p>
          </div>
        </div>

        <div className="jd-badges">
          {job.workMode && <span className={`badge ${WORK_MODE_CLASS[job.workMode]}`}>{job.workMode}</span>}
          {job.employmentType && <span className="badge badge--gray">{job.employmentType}</span>}
          {job.experienceLevel && <span className="badge badge--blue">{job.experienceLevel}</span>}
        </div>

        <div className="jd-meta">
          {job.location   && <span className="job-card__info-item">📍 {job.location}</span>}
          {job.experienceLevel && <span className="job-card__info-item">💼 {job.experienceLevel}</span>}
          {formatSalary(job.salary) && <span className="job-card__info-item">💰 {formatSalary(job.salary)}</span>}
          <span className="job-card__info-item">🕐 {timeAgo(job.postedAt)}</span>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="jd-section">
            <h3 className="jd-section-title">Skills Required</h3>
            <div className="job-card__skills">
              {job.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
            </div>
          </div>
        )}

        <div className="jd-section">
          <h3 className="jd-section-title">Job Description</h3>
          <div className="jd-description">
            {job.description.split("\n").map((line, i) =>
              line.trim() === "" ? <br key={i} /> :
              line.startsWith("•") ? <p key={i} className="jd-bullet">{line}</p> :
              <p key={i}>{line}</p>
            )}
          </div>
        </div>

        <div className="jd-actions">
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--lg">
            Apply Now →
          </a>
          <button className="btn btn--ghost btn--lg" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function F({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder = "",
}: any) {
  return (
    <div className="feedback__field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        className="feedback__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function S({
  label,
  id,
  value,
  onChange,
  children,
}: any) {
  return (
    <div className="feedback__field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="feedback__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

// ── Post Job Modal ────────────────────────────────────────────────────
// Note: `postedBy` is NOT sent from here — the backend sets it from the
// authenticated user's token, so ownership can't be spoofed by the client.
function PostJobModal({ token, onClose, onSuccess }: { token: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title:"", description:"", companyName:"", companyLogo:"", location:"", country:"India", workMode:"Hybrid", experienceLevel:"0-1 Year", roleCategory:"", skills:"", employmentType:"Full-time", applyUrl:"", salaryMin:"", salaryMax:"", currency:"INR" });  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
     if (!form.title || !form.description || !form.applyUrl || !form.companyName) {
    setError("Job title, company name, description, and apply URL are required."); return;
  }
  setLoading(true); setError("");

  const validToken = await getValidToken();
  if (!validToken) { setError("Session expired. Please log in again."); setLoading(false); return; }

  try {
    const res = await fetch(`${API}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
          salary: form.salaryMin ? { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: form.currency } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to post job."); return; }
      onSuccess();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="jd-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jd-modal jd-modal--post" onClick={e => e.stopPropagation()}>
        <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="jd-title" style={{ marginBottom: "1.5rem" }}>Post a New Job</h2>

        {error && <div className="auth-alert auth-alert--error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="pj-grid">
          <F label="Job Title *"     id="pj-title"  value={form.title}       onChange={(v:string) => set("title",v)}       placeholder="e.g. Salesforce Developer" />
          <F label="Company Name *" id="pj-company" value={form.companyName} onChange={(v:string) => set("companyName",v)} placeholder="e.g. Accenture" />
          <F label="Company Logo URL (optional)" id="pj-logo" value={form.companyLogo} onChange={(v:string) => set("companyLogo",v)} placeholder="https://yourcompany.com/logo.png" />
          <F label="Location"        id="pj-loc"    value={form.location}    onChange={(v:string) => set("location",v)}    placeholder="e.g. Hyderabad, India" />
          <F label="Country"         id="pj-country" value={form.country}    onChange={(v:string) => set("country",v)}     placeholder="e.g. India" />
          <S label="Work Mode"       id="pj-wm"     value={form.workMode}    onChange={(v:string) => set("workMode",v)}>
            {["Remote","Hybrid","Onsite"].map(o => <option key={o}>{o}</option>)}
          </S>
          <S label="Role Category" id="pj-role" value={form.roleCategory} onChange={(v:string) => set("roleCategory",v)}>
            {SALESFORCE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </S>
          <S label="Experience"      id="pj-exp"    value={form.experienceLevel} onChange={(v:string) => set("experienceLevel",v)}>
            {["0 Years","1-2 Years","2-6 Years","6-8 Years","8-12 Years","12+ Years"].map(o => <option key={o}>{o}</option>)}
          </S>
          <S label="Employment Type" id="pj-et"     value={form.employmentType} onChange={(v:string) => set("employmentType",v)}>
            {["Full-time","Part-time","Contract","Internship"].map(o => <option key={o}>{o}</option>)}
          </S>
          <S label="Currency"        id="pj-cur"    value={form.currency}    onChange={(v:string) => set("currency",v)}>
            {["INR","USD","GBP","EUR"].map(o => <option key={o}>{o}</option>)}
          </S>
          <F label="Min Salary"      id="pj-smin"   value={form.salaryMin}   onChange={(v:string) => set("salaryMin",v)}  placeholder="e.g. 800000" type="number" />
          <F label="Max Salary"      id="pj-smax"   value={form.salaryMax}   onChange={(v:string) => set("salaryMax",v)}  placeholder="e.g. 1400000" type="number" />
        </div>

        <div className="feedback__field" style={{ marginTop: "1rem" }}>
          <label className="feedback__label" htmlFor="pj-skills">Skills (comma separated)</label>
          <input id="pj-skills" type="text" className="feedback__input" value={form.skills} onChange={e => set("skills", e.target.value)} placeholder="Apex, LWC, SOQL" />
        </div>
        <div className="feedback__field" style={{ marginTop: "1rem" }}>
          <label className="feedback__label" htmlFor="pj-url">Apply URL *</label>
          <input id="pj-url" type="url" className="feedback__input" value={form.applyUrl} onChange={e => set("applyUrl", e.target.value)} placeholder="https://careers.yourcompany.com/job/123" />
        </div>
        <div className="feedback__field" style={{ marginTop: "1rem" }}>
          <label className="feedback__label" htmlFor="pj-desc">Description *</label>
          <textarea id="pj-desc" className="feedback__textarea" rows={7} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Full job description, responsibilities, requirements..." />
        </div>

        <div className="jd-actions" style={{ marginTop: "1.5rem" }}>
          <button className="feedback__submit" onClick={handleSubmit} disabled={loading} style={{ flex:1 }}>
            {loading ? "Posting…" : "Post Job"}
          </button>
          <button className="btn btn--ghost btn--lg" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────
function JobCard({ job, user, onDelete }: { job: Job; user: User | null; onDelete: (id: string) => void }) {
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = await getValidToken();
    if (!token) { window.location.href = "/login"; return; }
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
    } catch {}
    setSaving(false);
  };
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    const token = await getValidToken();
    if (!token) { window.location.href = "/login"; return; }
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/jobs/${job._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // The backend re-checks ownership itself (admin, or the job's
      // postedBy === the logged-in user) — this is only a UI-level
      // convenience, never the real security boundary.
      if (res.ok) onDelete(job._id);
    } catch {}
    setDeleting(false);
  };
  return (
    <div className="job-card">
      <div className="job-card__header">
        <div className="job-card__logo">
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
        {job.workMode && <span className={`badge ${WORK_MODE_CLASS[job.workMode]}`}>{job.workMode}</span>}
      </div>

      <div className="job-card__info">
        {job.location && <span className="job-card__info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {job.location}
        </span>}
        {job.experienceLevel && <span className="job-card__info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          {job.experienceLevel}
        </span>}
        <span className="job-card__info-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="job-card__info-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {timeAgo(job.postedAt)}
        </span>
        {formatSalary(job.salary) && <span className="job-card__info-item">💰 {formatSalary(job.salary)}</span>}
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="job-card__skills">
          {job.skills.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
          {job.skills.length > 4 && <span className="skill-tag">+{job.skills.length - 4}</span>}
        </div>
      )}

      <div className="job-card__actions">
        <a href={`/jobs/${job.slug}`} className="btn btn--primary btn--sm">View Details</a>
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">Apply →</a>
        <button
          className={`job-card__save-btn ${saved ? "job-card__save-btn--saved" : ""}`}
          onClick={handleSave}
          disabled={saving}
          aria-label={saved ? "Unsave job" : "Save job"}
          title={saved ? "Unsave" : "Save job"}
        >
          <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>

        {canDeleteJob(user, job) && (
          <button
            className="job-card__delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Delete ${job.title}`}
            title={user?.role === "admin" ? "Delete job (admin)" : "Delete your job posting"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Filter Sidebar ────────────────────────────────────────────────────
function FilterSidebar({ filters, onChange, onClear }: { filters: any; onChange: (k: string, v: string) => void; onClear: () => void }) {
  return (
    <aside className="jobs-sidebar">
      <div className="jobs-sidebar__header">
        <span className="jobs-sidebar__title">Filters</span>
        <button className="jobs-sidebar__clear" onClick={onClear}>Clear all</button>
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Work Mode</label>
        {["Remote","Hybrid","Onsite"].map(m => (
          <label key={m} className="jobs-sidebar__check">
            <input type="radio" name="workMode" value={m} checked={filters.workMode === m} onChange={() => onChange("workMode", filters.workMode === m ? "" : m)} />
            {m}
          </label>
        ))}
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Job Role</label>
        <select
          className="feedback__select"
          value={filters.role}
          onChange={e => onChange("role", e.target.value)}
        >
          <option value="">All Roles</option>
          {SALESFORCE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Experience Level</label>
        {["0 Years","1-2 Years","2-6 Years","6-8 Years","8-12 Years","12+ Years"].map(e => (
          <label key={e} className="jobs-sidebar__check">
            <input type="radio" name="experienceLevel" value={e} checked={filters.experienceLevel === e} onChange={() => onChange("experienceLevel", filters.experienceLevel === e ? "" : e)} />
            {e}
          </label>
        ))}
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Employment Type</label>
        {["Full-time","Part-time","Contract","Internship"].map(t => (
          <label key={t} className="jobs-sidebar__check">
            <input type="radio" name="employmentType" value={t} checked={filters.employmentType === t} onChange={() => onChange("employmentType", filters.employmentType === t ? "" : t)} />
            {t}
          </label>
        ))}
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Country</label>
        <select className="feedback__select" value={filters.country} onChange={e => onChange("country", e.target.value)}>
          <option value="">All Countries</option>
          {["India","USA","UK","Germany","Australia","Canada"].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
    </aside>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function JobsPage() {
  const router = useRouter();
   const searchParams = useSearchParams();
  const [jobs,        setJobs]        = useState<Job[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [user,        setUser]        = useState<User | null>(null);
  const [token,       setToken]       = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    q:               searchParams.get("q")               ?? "",
    country:         searchParams.get("country")          ?? "",
    role:            searchParams.get("role")             ?? "",
    workMode:        searchParams.get("workMode")         ?? "",
    experienceLevel: searchParams.get("experienceLevel")  ?? "",
    employmentType:  searchParams.get("employmentType")   ?? "",
    page: 1,
  });  // Rehydrate user
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tc_user");
        if (raw) setUser(JSON.parse(raw));
        const validToken = await getValidToken();
        if (validToken) setToken(validToken);
      } catch {}
    })();
  }, []);
  const handleJobDeleted = (id: string) => {
    setJobs(prev => prev.filter(j => j._id !== id));
    setTotal(prev => prev - 1);
  };
  const fetchJobs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (filters.q)               params.set("q",               filters.q);
      if (filters.country)         params.set("country",         filters.country);
      if (filters.workMode)        params.set("workMode",        filters.workMode);
      if (filters.experienceLevel) params.set("experienceLevel", filters.experienceLevel);
      if (filters.employmentType)  params.set("employmentType",  filters.employmentType);
      if (filters.role)            params.set("role",            filters.role.trim());
      params.set("page",  String(filters.page));
      params.set("limit", "12");

      const res  = await fetch(`${API}/api/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setJobs(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message ?? "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const setFilter = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v, page: 1 }));
  const clearFilters = () => setFilters({ q:"", country:"", role:"", workMode:"", experienceLevel:"", employmentType:"", page:1 });
  return (
    <>
      <Navbar />
      <div className="jobs-page">
        {/* ── Page Header ── */}
        <div className="jobs-hero">
          <div className="jobs-hero__inner">
            <div>
              <h1 className="jobs-hero__title">Salesforce Jobs</h1>
              <p className="jobs-hero__sub">{total > 0 ? `${total} opportunities found` : "Browse all Salesforce roles"}</p>
            </div>
            {/* Only recruiters and admins can post jobs / use AI generation */}
            {(user?.role === "admin" || user?.role === "recruiter") && (
                <div style={{ display: "flex", gap: "0.625rem" }}>
                  <button className="btn btn--primary jobs-hero__post-btn" onClick={() => setShowPostJob(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Post a Job
                  </button>
                  <a href="/jobs/new" className="btn btn--ghost jobs-hero__post-btn" style={{background:"rgba(255,255,255,0.15)", color:"#ffffff", borderColor:"rgba(255,255,255,0.4)"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Generate with AI
                  </a>
                </div>
              )}
          </div>

          {/* Search bar */}
          <div className="jobs-hero__search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18,color:"#5E6E82",flexShrink:0}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="jobs-hero__search-input"
              type="text"
              placeholder="Search by title, skill, or keyword..."
              value={filters.q}
              onChange={e => setFilter("q", e.target.value)}
            />
            {filters.q && <button className="jobs-hero__clear-btn" onClick={() => setFilter("q","")}>✕</button>}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="jobs-body">
          {/* Mobile filter toggle */}
          <button className="jobs-filter-toggle" onClick={() => setSidebarOpen(p => !p)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            {sidebarOpen ? "Hide Filters" : "Show Filters"}
          </button>

          <div className={`jobs-layout ${sidebarOpen ? "jobs-layout--open" : ""}`}>
            {/* Sidebar */}
            <FilterSidebar filters={filters} onChange={setFilter} onClear={clearFilters} />

            {/* Job grid */}
            <main className="jobs-main">
              {loading ? (
                <div className="jobs-loading">
                  {[...Array(6)].map((_, i) => <div key={i} className="jobs-skeleton" />)}
                </div>
              ) : error ? (
                <div className="jobs-error">
                  <p>⚠️ {error}</p>
                  <button className="btn btn--ghost" onClick={fetchJobs}>Retry</button>
                </div>
              ) : jobs.length === 0 ? (
                <div className="jobs-empty">
                  <div className="jobs-empty__icon">🔍</div>
                  <h3>No jobs found</h3>
                  <p>Try adjusting your filters or search term.</p>
                  <button className="btn btn--ghost" onClick={clearFilters}>Clear Filters</button>
                </div>
              ) : (
                <>
                  <div className="jobs-grid">
                    {jobs.map(job => (
                      <JobCard key={job._id} job={job} user={user} onDelete={handleJobDeleted} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="jobs-pagination">
                      <button className="jobs-page-btn" disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
                      <span className="jobs-page-info">Page {filters.page} of {totalPages}</span>
                      <button className="jobs-page-btn" disabled={filters.page >= totalPages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />

      {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
      {showPostJob && <PostJobModal token={token} onClose={() => setShowPostJob(false)} onSuccess={() => { setShowPostJob(false); fetchJobs(); }} />}
    </>
  );
}