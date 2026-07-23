'use client'
import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AVATAR_PRESETS, presetKeyToUrl,resolveResumeUrl, resolveAvatarSrc, AvatarValue } from "@/components/avatarPresets";
import { getValidToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/* ────────────────────────────────────────────────────────────
   Types — trimmed vs. the old modal:
   removed alternatePhone, dob, gender, currentSalaryLPA,
   employmentType, languages, and location.state. None of these
   were things a recruiter reading a profile actually used, and
   cutting them is most of why this page feels less hectic than
   the old 7-tab modal did with the same amount of real content.
   Nothing on the backend changes — these fields still exist on
   the Profile schema, this page just stops asking for them.
   ──────────────────────────────────────────────────────────── */

type NoticePeriod = "immediate" | "15_days" | "30_days" | "60_days" | "90_days" | "other";

interface Location {
  city: string;
  country: string;
}

interface ExperienceItem {
  _id?: string;
  title: string;
  company: string;
  location: string;
  from: string;
  to: string;
  current: boolean;
  description: string;
}

interface EducationItem {
  _id?: string;
  degree: string;
  institution: string;
  startYear: number | string;
  endYear: number | string;
  grade: string;
}

interface CertificationItem {
  _id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

interface Links {
  linkedin: string;
  github: string;
  portfolio: string;
  leetcode: string;
  stackoverflow: string;
  twitter: string;
  other: string;
}

interface Resume {
  fileName?: string;
  url?: string;
  uploadedAt?: string;
}

interface Profile {
  headline: string;
  summary: string;
  phone: string;
  location: Location;
  currentDesignation: string;
  currentCompany: string;
  totalExperienceYears: number;
  totalExperienceMonths: number;
  noticePeriod: NoticePeriod;
  expectedSalaryLPA: number | string;
  willingToRelocate: boolean;
  salesforceSkills: string[];
  trailheadUrl: string;
  trailheadRank: string;
  trailheadBadgeCount: number | string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  links: Links;
  resume: Resume | null;
  avatar: AvatarValue;
  profileCompleteness: number;
  [key: string]: unknown;
}

const SECTIONS = [
  { id: "sec-basic", label: "Basic Info" },
  { id: "sec-skills", label: "Skills & Salesforce" },
  { id: "sec-experience", label: "Experience" },
  { id: "sec-education", label: "Education" },
  { id: "sec-certifications", label: "Certifications" },
  { id: "sec-links", label: "Links & Resume" },
  { id: "sec-avatar", label: "Profile Photo" },
];

const EMPTY_PROFILE: Profile = {
  headline: "",
  summary: "",
  phone: "",
  location: { city: "", country: "India" },
  currentDesignation: "",
  currentCompany: "",
  totalExperienceYears: 0,
  totalExperienceMonths: 0,
  noticePeriod: "30_days",
  expectedSalaryLPA: "",
  willingToRelocate: false,
  salesforceSkills: [],
  trailheadUrl: "",
  trailheadRank: "",
  trailheadBadgeCount: "",
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  links: { linkedin: "", github: "", portfolio: "", leetcode: "", stackoverflow: "", twitter: "", other: "" },
  resume: null,
  avatar: { kind: "preset", value: "avatar-1" },
  profileCompleteness: 0,
};

/* ── helpers ──────────────────────────────────────────────── */

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function setDeep<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone = structuredClone(obj) as Record<string, any>;
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  cur[keys[keys.length - 1]] = value;
  return clone as T;
}

/* ── reusable pieces (same as the old modal) ─────────────────── */

interface FieldProps { label: string; children: ReactNode; hint?: string; required?: boolean; }
function Field({ label, children, hint, required }: FieldProps) {
  return (
    <div className="pm-field">
      <label className="pm-label">{label}{required && <span className="pm-required"> *</span>}</label>
      {children}
      {hint && <span className="pm-hint">{hint}</span>}
    </div>
  );
}

interface TagInputProps { values: string[]; onChange: (values: string[]) => void; placeholder?: string; }
function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const addTag = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="pm-tag-input">
      <div className="pm-tag-input__tags">
        {values.length === 0 && <span className="pm-tag-input__empty">Nothing added yet</span>}
        {values.map((v) => (
          <span key={v} className="pm-tag">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
      </div>
      <div className="pm-tag-input__row">
        <input
          className="pm-input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
        />
        <button type="button" className="btn btn--ghost btn--sm" onClick={addTag}>Add</button>
      </div>
    </div>
  );
}

interface ListEditorProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  emptyLabel: string;
  addLabel: string;
}
function ListEditor<T extends { _id?: string }>({ items, renderItem, onAdd, onRemove, emptyLabel, addLabel }: ListEditorProps<T>) {
  return (
    <div className="pm-list-editor">
      {items.length === 0 && <p className="pm-list-editor__empty">{emptyLabel}</p>}
      {items.map((item, i) => (
        <div className="pm-list-card" key={item._id ?? i}>
          <div className="pm-list-card__header">
            <span>{i + 1}</span>
            <button type="button" className="pm-list-card__remove" onClick={() => onRemove(i)}>Remove</button>
          </div>
          {renderItem(item, i)}
        </div>
      ))}
      <button type="button" className="btn btn--ghost pm-add-btn" onClick={onAdd}>{addLabel}</button>
    </div>
  );
}

// A section card on the page, with a scroll-anchor id used by the
// quick-nav sidebar.
function ProfileSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="profile-section-card">
      <h2 className="profile-section-card__title">{title}</h2>
      {children}
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiError, setAiError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getValidToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API}/api/profile/me`, { credentials: "include", headers: {
        Authorization: `Bearer ${token}`,
      }, });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load profile");
      setProfile({ ...EMPTY_PROFILE, ...data.profile });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const update = (path: string, value: unknown) => setProfile((prev) => setDeep(prev, path, value));

  const syncNavbarAvatar = (updated: { avatar?: AvatarValue }) => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw && updated.avatar) {
        const user = JSON.parse(raw);
        localStorage.setItem("tc_user", JSON.stringify({ ...user, avatar: updated.avatar }));
      }
    } catch { /* ignore */ }
  };

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { ...profile };
      delete payload.avatar;
      delete payload.resume;
      delete payload._id;
      delete payload.user;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;
      delete payload.profileCompleteness;
      
      const token = await getValidToken();

      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/profile/me`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Save failed");

      setProfile((prev) => ({ ...prev, ...data.profile }));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar ───────────────────────────────────────────────
  const handlePresetAvatar = async (key: string) => {
    try {
      const token = await getValidToken();

      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/profile/me/avatar`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: key }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not set avatar");
      setProfile((prev) => ({ ...prev, avatar: data.avatar }));
      syncNavbarAvatar({ avatar: data.avatar });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set avatar");
    }
  };

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file) return;
    setAvatarUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("avatar", file);
      const token = await getValidToken();

      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/profile/me/avatar/upload`, {
        method: "POST",
        credentials: "include",
        headers: {Authorization: `Bearer ${token}`},
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
      setProfile((prev) => ({ ...prev, avatar: data.avatar }));
      syncNavbarAvatar({ avatar: data.avatar });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Resume ───────────────────────────────────────────────
  const handleResumeUpload = async (file?: File | null) => {
    if (!file) return;
    setResumeUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("resume", file);
      const token = await getValidToken();

      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/profile/me/resume`, {
        method: "POST",
        credentials: "include",
        headers: {Authorization: `Bearer ${token}`},
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
      setProfile((prev) => ({ ...prev, resume: data.resume }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setResumeUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    try {
      const token = await getValidToken();

      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/profile/me/resume`, { method: "DELETE", credentials: "include", headers: {Authorization: `Bearer ${token}`}});
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      setProfile((prev) => ({ ...prev, resume: null }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  // ── Generate with AI ─────────────────────────────────────
  const handleGenerateWithAI = async (file?: File | null) => {
    if (!file) return;
    setAiParsing(true);
    setAiError("");
    setAiMessage("");
    try {
      const form = new FormData();
      form.append("resume", file);
      const token = await getValidToken();

      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/profile/me/resume/parse`, {
        method: "POST",
        credentials: "include",
        headers: {Authorization: `Bearer ${token}`},
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "AI parsing failed");

      setProfile({ ...EMPTY_PROFILE, ...data.profile });
      setAiMessage(data.message || "Resume parsed — please review each section before saving.");
      syncNavbarAvatar(data.profile);
      document.getElementById("sec-basic")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI parsing failed. You can fill the form manually instead.");
    } finally {
      setAiParsing(false);
    }
  };

  // ── Array section helpers ────────────────────────────────
  function addItem<K extends "experience" | "education" | "certifications">(key: K, blank: Profile[K][number]) {
    update(key, [...(profile[key] as unknown[]), blank]);
  }
  function removeItem<K extends "experience" | "education" | "certifications">(key: K, idx: number) {
    update(key, (profile[key] as unknown[]).filter((_, i) => i !== idx));
  }
  function updateItem<K extends "experience" | "education" | "certifications">(key: K, idx: number, field: string, value: unknown) {
    const list = [...(profile[key] as unknown as Record<string, unknown>[])];
    list[idx] = { ...list[idx], [field]: value };
    update(key, list);
  }

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Navbar />
      <div className="jobs-page">
        {/* ── Header banner ── */}
        <div className="jobs-hero profile-hero">
          <div className="jobs-hero__inner">
            <div>
              <h1 className="jobs-hero__title">My Profile</h1>
              <p className="jobs-hero__sub">Keep this up to date — recruiters see exactly what's here.</p>
            </div>

            <div className="profile-hero__right">
              <label className={`pm-ai-btn ${aiParsing ? "pm-ai-btn--busy" : ""}`}>
                {aiParsing ? "⏳ Reading your resume…" : "✨ Generate with AI"}
                <input type="file" accept=".pdf,.docx" hidden disabled={aiParsing} onChange={(e) => handleGenerateWithAI(e.target.files?.[0])} />
              </label>

              <div className="pm-completeness">
                <div className="pm-completeness__ring" style={{ "--pct": `${profile.profileCompleteness || 0}%` } as CSSProperties}>
                  <span>{profile.profileCompleteness || 0}%</span>
                </div>
                <span className="pm-completeness__label">Profile complete</span>
              </div>
            </div>
          </div>

          {(error || aiError || aiMessage) && (
            <div className="jobs-hero__inner" style={{ paddingTop: 0, marginTop: "-0.5rem" }}>
              {error && <div className="auth-alert auth-alert--error" style={{ width: "100%" }}>{error}</div>}
              {aiError && <div className="auth-alert auth-alert--error" style={{ width: "100%" }}>{aiError}</div>}
              {aiMessage && !aiError && <div className="pm-ai-success" style={{ width: "100%" }}>✓ {aiMessage}</div>}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="jobs-body">
          <div className="jobs-layout profile-layout">
            {/* Quick-nav sidebar */}
            <aside className="jobs-sidebar profile-quicknav">
              <span className="jobs-sidebar__title" style={{ marginBottom: "0.75rem", display: "block" }}>Jump to</span>
              {SECTIONS.map((s) => (
                <button key={s.id} className="profile-quicknav__link" onClick={() => scrollToSection(s.id)}>
                  {s.label}
                </button>
              ))}
            </aside>

            {/* All sections, stacked */}
            <main className="profile-main">
              {loading ? (
                <div className="pm-loading">Loading your profile…</div>
              ) : (
                <>
                  <ProfileSection id="sec-basic" title="Basic Info">
                    <div className="pm-grid">
                      <Field label="Headline" hint="Shown right under your name to recruiters" required>
                        <input className="pm-input" maxLength={120} placeholder="e.g. Salesforce Developer | 3+ yrs | Apex, LWC, Flow" value={profile.headline} onChange={(e) => update("headline", e.target.value)} />
                      </Field>
                      <Field label="About / Summary" required>
                        <textarea className="pm-textarea" rows={4} maxLength={2000} placeholder="A few lines about your experience and what you're looking for..." value={profile.summary} onChange={(e) => update("summary", e.target.value)} />
                      </Field>
                      <Field label="Phone" required>
                        <input className="pm-input" value={profile.phone} onChange={(e) => update("phone", e.target.value)} />
                      </Field>
                      <Field label="City" required>
                        <input className="pm-input" value={profile.location?.city ?? ""} onChange={(e) => update("location.city", e.target.value)} />
                      </Field>
                      <Field label="Country">
                        <input className="pm-input" value={profile.location?.country ?? ""} onChange={(e) => update("location.country", e.target.value)} />
                      </Field>
                      <Field label="Current designation" required>
                        <input className="pm-input" value={profile.currentDesignation} onChange={(e) => update("currentDesignation", e.target.value)} />
                      </Field>
                      <Field label="Current company">
                        <input className="pm-input" value={profile.currentCompany} onChange={(e) => update("currentCompany", e.target.value)} />
                      </Field>
                      <Field label="Total experience">
                        <div className="pm-inline-row">
                          <input type="number" min={0} className="pm-input pm-input--sm" placeholder="Years" value={profile.totalExperienceYears} onChange={(e) => update("totalExperienceYears", Number(e.target.value))} />
                          <input type="number" min={0} max={11} className="pm-input pm-input--sm" placeholder="Months" value={profile.totalExperienceMonths} onChange={(e) => update("totalExperienceMonths", Number(e.target.value))} />
                        </div>
                      </Field>
                      <Field label="Notice period">
                        <select className="pm-input" value={profile.noticePeriod} onChange={(e) => update("noticePeriod", e.target.value as NoticePeriod)}>
                          <option value="immediate">Immediate</option>
                          <option value="15_days">15 days</option>
                          <option value="30_days">30 days</option>
                          <option value="60_days">60 days</option>
                          <option value="90_days">90 days</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>
                      <Field label="Expected salary (LPA)">
                        <input type="number" min={0} step={0.1} className="pm-input" value={profile.expectedSalaryLPA} onChange={(e) => update("expectedSalaryLPA", e.target.value)} />
                      </Field>
                      <Field label="Willing to relocate?">
                        <label className="pm-checkbox">
                          <input type="checkbox" checked={profile.willingToRelocate} onChange={(e) => update("willingToRelocate", e.target.checked)} />
                          Yes, I'm open to relocating
                        </label>
                      </Field>
                    </div>
                  </ProfileSection>

                  <ProfileSection id="sec-skills" title="Skills & Salesforce">
                    <div className="pm-grid">
                      <Field label="Salesforce skills" hint="Apex, LWC, Flow, Integration, Data Cloud, etc." required>
                        <TagInput values={profile.salesforceSkills} onChange={(v) => update("salesforceSkills", v)} placeholder="Type a skill and press Enter" />
                      </Field>
                      <Field label="Other skills">
                        <TagInput values={profile.skills} onChange={(v) => update("skills", v)} placeholder="e.g. SQL, REST APIs, Agile" />
                      </Field>
                      <div className="pm-section-divider" />
                      <Field label="Trailhead profile URL">
                        <input className="pm-input" placeholder="https://www.salesforce.com/trailblazer/..." value={profile.trailheadUrl} onChange={(e) => update("trailheadUrl", e.target.value)} />
                      </Field>
                      <Field label="Trailhead rank">
                        <input className="pm-input" placeholder="e.g. Ranger, Mountaineer" value={profile.trailheadRank} onChange={(e) => update("trailheadRank", e.target.value)} />
                      </Field>
                      <Field label="Trailhead badge count">
                        <input type="number" min={0} className="pm-input" value={profile.trailheadBadgeCount} onChange={(e) => update("trailheadBadgeCount", e.target.value)} />
                      </Field>
                    </div>
                  </ProfileSection>

                  <ProfileSection id="sec-experience" title="Experience">
                    <ListEditor<ExperienceItem>
                      items={profile.experience}
                      emptyLabel="No work experience added yet."
                      addLabel="+ Add work experience"
                      onAdd={() => addItem("experience", { title: "", company: "", location: "", from: "", to: "", current: false, description: "" })}
                      onRemove={(i) => removeItem("experience", i)}
                      renderItem={(item, i) => (
                        <div className="pm-grid pm-grid--tight">
                          <Field label="Job title" required><input className="pm-input" value={item.title} onChange={(e) => updateItem("experience", i, "title", e.target.value)} /></Field>
                          <Field label="Company" required><input className="pm-input" value={item.company} onChange={(e) => updateItem("experience", i, "company", e.target.value)} /></Field>
                          <Field label="Location"><input className="pm-input" value={item.location} onChange={(e) => updateItem("experience", i, "location", e.target.value)} /></Field>
                          <Field label="From" required><input type="month" className="pm-input" value={item.from ? String(item.from).slice(0, 7) : ""} onChange={(e) => updateItem("experience", i, "from", e.target.value)} /></Field>
                          <Field label="To"><input type="month" className="pm-input" disabled={item.current} value={item.to ? String(item.to).slice(0, 7) : ""} onChange={(e) => updateItem("experience", i, "to", e.target.value)} /></Field>
                          <Field label="Currently working here">
                            <label className="pm-checkbox"><input type="checkbox" checked={item.current} onChange={(e) => updateItem("experience", i, "current", e.target.checked)} />Yes</label>
                          </Field>
                          <Field label="Description" hint="What did you build / own?"><textarea className="pm-textarea" rows={3} value={item.description} onChange={(e) => updateItem("experience", i, "description", e.target.value)} /></Field>
                        </div>
                      )}
                    />
                  </ProfileSection>

                  <ProfileSection id="sec-education" title="Education">
                    <ListEditor<EducationItem>
                      items={profile.education}
                      emptyLabel="No education added yet."
                      addLabel="+ Add education"
                      onAdd={() => addItem("education", { degree: "", institution: "", startYear: "", endYear: "", grade: "" })}
                      onRemove={(i) => removeItem("education", i)}
                      renderItem={(item, i) => (
                        <div className="pm-grid pm-grid--tight">
                          <Field label="Degree" required><input className="pm-input" placeholder="e.g. B.Tech Computer Science" value={item.degree} onChange={(e) => updateItem("education", i, "degree", e.target.value)} /></Field>
                          <Field label="Institution" required><input className="pm-input" value={item.institution} onChange={(e) => updateItem("education", i, "institution", e.target.value)} /></Field>
                          <Field label="Start year"><input type="number" className="pm-input" value={item.startYear} onChange={(e) => updateItem("education", i, "startYear", e.target.value)} /></Field>
                          <Field label="End year"><input type="number" className="pm-input" value={item.endYear} onChange={(e) => updateItem("education", i, "endYear", e.target.value)} /></Field>
                          <Field label="Grade"><input className="pm-input" placeholder="e.g. 8.2 CGPA" value={item.grade} onChange={(e) => updateItem("education", i, "grade", e.target.value)} /></Field>
                        </div>
                      )}
                    />
                  </ProfileSection>

                  <ProfileSection id="sec-certifications" title="Certifications">
                    <ListEditor<CertificationItem>
                      items={profile.certifications}
                      emptyLabel="No certifications added yet."
                      addLabel="+ Add certification"
                      onAdd={() => addItem("certifications", { name: "", issuer: "Salesforce", issueDate: "", expiryDate: "", credentialId: "", credentialUrl: "" })}
                      onRemove={(i) => removeItem("certifications", i)}
                      renderItem={(item, i) => (
                        <div className="pm-grid pm-grid--tight">
                          <Field label="Certification name" required><input className="pm-input" placeholder="e.g. Salesforce Certified Administrator" value={item.name} onChange={(e) => updateItem("certifications", i, "name", e.target.value)} /></Field>
                          <Field label="Issuer"><input className="pm-input" value={item.issuer} onChange={(e) => updateItem("certifications", i, "issuer", e.target.value)} /></Field>
                          <Field label="Issue date"><input type="month" className="pm-input" value={item.issueDate ? String(item.issueDate).slice(0, 7) : ""} onChange={(e) => updateItem("certifications", i, "issueDate", e.target.value)} /></Field>
                          <Field label="Expiry date"><input type="month" className="pm-input" value={item.expiryDate ? String(item.expiryDate).slice(0, 7) : ""} onChange={(e) => updateItem("certifications", i, "expiryDate", e.target.value)} /></Field>
                          <Field label="Credential ID"><input className="pm-input" value={item.credentialId} onChange={(e) => updateItem("certifications", i, "credentialId", e.target.value)} /></Field>
                          <Field label="Credential URL"><input className="pm-input" value={item.credentialUrl} onChange={(e) => updateItem("certifications", i, "credentialUrl", e.target.value)} /></Field>
                        </div>
                      )}
                    />
                  </ProfileSection>

                  <ProfileSection id="sec-links" title="Links & Resume">
                    <div className="pm-grid">
                      <Field label="LinkedIn"><input className="pm-input" placeholder="https://linkedin.com/in/..." value={profile.links.linkedin} onChange={(e) => update("links.linkedin", e.target.value)} /></Field>
                      <Field label="GitHub"><input className="pm-input" placeholder="https://github.com/..." value={profile.links.github} onChange={(e) => update("links.github", e.target.value)} /></Field>
                      <Field label="Portfolio website"><input className="pm-input" value={profile.links.portfolio} onChange={(e) => update("links.portfolio", e.target.value)} /></Field>
                      <Field label="LeetCode"><input className="pm-input" value={profile.links.leetcode} onChange={(e) => update("links.leetcode", e.target.value)} /></Field>
                      <Field label="Stack Overflow"><input className="pm-input" value={profile.links.stackoverflow} onChange={(e) => update("links.stackoverflow", e.target.value)} /></Field>
                      <Field label="Twitter / X"><input className="pm-input" value={profile.links.twitter} onChange={(e) => update("links.twitter", e.target.value)} /></Field>
                      <div className="pm-section-divider" />
                      <Field label="Resume" required hint="PDF or Word, up to 5MB">
                        {profile.resume?.url ? (
                          <div className="pm-resume-card">
                            <span className="pm-resume-card__name">📄 {profile.resume.fileName}</span>
                            <div className="pm-resume-card__actions">
                              <a className="btn btn--ghost btn--sm" href={resolveResumeUrl(profile.resume.url, API)} target="_blank" rel="noreferrer">View</a>
                              <button className="btn btn--ghost btn--sm job-card__delete-btn" onClick={handleResumeDelete}>Remove</button>
                            </div>
                          </div>
                        ) : (
                          <label className="pm-upload-btn">
                            {resumeUploading ? "Uploading…" : "Upload resume"}
                            <input type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => handleResumeUpload(e.target.files?.[0])} />
                          </label>
                        )}
                      </Field>
                    </div>
                  </ProfileSection>

                  <ProfileSection id="sec-avatar" title="Profile Photo">
                    <div className="pm-avatar-tab">
                      <div className="pm-avatar-tab__current">
                        <img src={resolveAvatarSrc(profile.avatar, API, 96)} alt="Current avatar" className="pm-avatar-preview" />
                        <label className="pm-upload-btn">
                          {avatarUploading ? "Uploading…" : "Upload your own photo"}
                          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                        </label>
                      </div>
                      <p className="pm-avatar-tab__label">Or pick a cartoon avatar</p>
                      <div className="pm-avatar-grid">
                        {AVATAR_PRESETS.map((a) => {
                          const isActive = profile.avatar.kind === "preset" && profile.avatar.value === a.key;
                          return (
                            <button key={a.key} type="button" className={`pm-avatar-option ${isActive ? "pm-avatar-option--active" : ""}`} onClick={() => handlePresetAvatar(a.key)} aria-label={`Choose avatar ${a.key}`}>
                              <img src={presetKeyToUrl(a.key, 72)} alt="" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </ProfileSection>
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="profile-save-bar">
        {savedFlash && <span className="pm-saved-flash">✓ Saved</span>}
        <button className="btn btn--ghost" onClick={() => router.push("/")}>Back to Home</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <Footer />
    </>
  );
}