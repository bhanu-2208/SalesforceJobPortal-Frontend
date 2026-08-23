'use client'
// components/EditJobModal.tsx
import { useState } from "react";
import { getValidToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface EditableJob {
  _id: string;
  title: string;
  description: string;
  location?: string;
  country?: string;
  workMode?: string;
  experienceLevel?: string;
  roleCategory?: string;
  employmentType?: string;
  applyUrl: string;
  skills?: string[];
  salary?: { min?: number; max?: number; currency?: string };
}

interface EditJobModalProps {
  job: EditableJob;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

const F = ({ label, id, value, onChange, placeholder = "", type = "text" }: any) => (
  <div className="feedback__field">
    <label className="feedback__label" htmlFor={id}>{label}</label>
    <input id={id} type={type} className="feedback__input" value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const S = ({ label, id, value, onChange, children }: any) => (
  <div className="feedback__field">
    <label className="feedback__label" htmlFor={id}>{label}</label>
    <select id={id} className="feedback__select" value={value ?? ""} onChange={e => onChange(e.target.value)}>{children}</select>
  </div>
);

export default function EditJobModal({ job, onClose, onSuccess }: EditJobModalProps) {
  const [form, setForm] = useState({
    title:           job.title || "",
    description:     job.description || "",
    location:        job.location || "",
    country:         job.country || "",
    workMode:        job.workMode || "Hybrid",
    experienceLevel: job.experienceLevel || "Mid",
    roleCategory:    job.roleCategory || "",
    employmentType:  job.employmentType || "Full-time",
    applyUrl:        job.applyUrl || "",
    skills:          (job.skills || []).join(", "),
    salaryMin:       job.salary?.min?.toString() || "",
    salaryMax:       job.salary?.max?.toString() || "",
    currency:        job.salary?.currency || "INR",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.applyUrl) {
      setError("Title, description, and apply URL are required."); return;
    }
    setLoading(true); setError("");

    const token = await getValidToken();
    if (!token) { setError("Session expired. Please log in again."); setLoading(false); return; }

    try {
      const res = await fetch(`${API}/api/jobs/${job._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
          salary: form.salaryMin ? { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: form.currency } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to update job."); return; }
      onSuccess(data.data);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="jd-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jd-modal jd-modal--post" onClick={e => e.stopPropagation()}>
        <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="jd-title" style={{ marginBottom: "1.5rem" }}>Edit Job</h2>

        {error && <div className="auth-alert auth-alert--error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="pj-grid">
          <F label="Job Title *"     id="ej-title"  value={form.title}    onChange={(v: string) => set("title", v)} />
          <F label="Role Category"   id="ej-role"   value={form.roleCategory} onChange={(v: string) => set("roleCategory", v)} />
          <F label="Location"        id="ej-loc"    value={form.location} onChange={(v: string) => set("location", v)} />
          <F label="Country"         id="ej-country" value={form.country} onChange={(v: string) => set("country", v)} />
          <S label="Work Mode"       id="ej-wm"     value={form.workMode} onChange={(v: string) => set("workMode", v)}>
            {["Remote", "Hybrid", "Onsite"].map(o => <option key={o}>{o}</option>)}
          </S>
          <S label="Experience"      id="ej-exp"    value={form.experienceLevel} onChange={(v: string) => set("experienceLevel", v)}>
            {["Intern", "Fresher", "Associate", "Mid", "Senior", "Lead"].map(o => <option key={o}>{o}</option>)}
          </S>
          <S label="Employment Type" id="ej-et"     value={form.employmentType} onChange={(v: string) => set("employmentType", v)}>
            {["Full-time", "Part-time", "Contract", "Internship"].map(o => <option key={o}>{o}</option>)}
          </S>
          <S label="Currency"        id="ej-cur"    value={form.currency} onChange={(v: string) => set("currency", v)}>
            {["INR", "USD", "GBP", "EUR"].map(o => <option key={o}>{o}</option>)}
          </S>
          <F label="Min Salary" id="ej-smin" value={form.salaryMin} onChange={(v: string) => set("salaryMin", v)} type="number" />
          <F label="Max Salary" id="ej-smax" value={form.salaryMax} onChange={(v: string) => set("salaryMax", v)} type="number" />
        </div>

        <div className="feedback__field" style={{ marginTop: "1rem" }}>
          <label className="feedback__label" htmlFor="ej-skills">Skills (comma separated)</label>
          <input id="ej-skills" type="text" className="feedback__input" value={form.skills} onChange={e => set("skills", e.target.value)} />
        </div>
        <div className="feedback__field" style={{ marginTop: "1rem" }}>
          <label className="feedback__label" htmlFor="ej-url">Apply URL *</label>
          <input id="ej-url" type="url" className="feedback__input" value={form.applyUrl} onChange={e => set("applyUrl", e.target.value)} />
        </div>
        <div className="feedback__field" style={{ marginTop: "1rem" }}>
          <label className="feedback__label" htmlFor="ej-desc">Description *</label>
          <textarea id="ej-desc" className="feedback__textarea" rows={7} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>

        <div className="jd-actions" style={{ marginTop: "1.5rem" }}>
          <button className="feedback__submit" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
          <button className="btn btn--ghost btn--lg" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}