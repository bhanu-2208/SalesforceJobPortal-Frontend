'use client'
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";
import { resolveAvatarSrc, resolveResumeUrl } from "@/components/avatarPresets";
import CandidateRankModal from "@/components/Candidaterankmodal ";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface User { id: string; name: string; email: string; role: string; }

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function noticeLabel(np?: string): string {
  const map: Record<string, string> = {
    immediate: "Immediate",
    "15_days": "15 days",
    "30_days": "30 days",
    "60_days": "60 days",
    "90_days": "90 days",
    other: "Other",
  };
  return np ? map[np] ?? np : "Not specified";
}

function fmtMonthYear(d?: string): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.slug as string;

  const [me, setMe] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);

  // Rehydrate the logged-in recruiter + access-gate the page
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw) setMe(JSON.parse(raw));
    } catch {}
  }, []);

  // Fetch this candidate's full profile
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/profile/${userId}`, {
          credentials: "include",
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message ?? "Could not load this profile.");
        setProfile(data.profile);
      } catch (e: any) {
        setError(e.message ?? "Could not load this profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Check saved state
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const token = await getValidToken();
      if (!token) return;
      try {
        const res = await fetch(`${API}/api/saved-candidates/ids`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setSaved(data.data.includes(userId));
      } catch {}
    })();
  }, [userId]);

  const handleToggleSave = async () => {
    const token = await getValidToken();
    if (!token) return;
    setSaving(true);
    const wasSaved = saved;
    setSaved(!wasSaved); // optimistic
    try {
      await fetch(`${API}/api/saved-candidates/${userId}`, {
        method: wasSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setSaved(wasSaved); // revert on failure
    } finally {
      setSaving(false);
    }
  };

  // ── Access gate ──────────────────────────────────────────────────
  if (me && !(me.role === "admin" || me.role === "recruiter")) {
    return (
      <>
        <Navbar />
        <div className="jdetail-page">
          <div className="jdetail-container">
            <div className="jobs-empty">
              <div className="jobs-empty__icon">🔒</div>
              <h3>Recruiter access only</h3>
              <p>This page is only available to recruiter and admin accounts.</p>
              <button className="btn btn--primary" onClick={() => router.push("/jobs")}>Back to Jobs</button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────
  if (loading) return (
    <>
      <Navbar />
      <div className="jdetail-page">
        <div className="jdetail-container">
          <div className="jdetail-skeleton jdetail-skeleton--hero" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", marginTop: "1.5rem" }}>
            <div>
              <div className="jdetail-skeleton" style={{ height: 32, marginBottom: 12, borderRadius: 8 }} />
              <div className="jdetail-skeleton" style={{ height: 200, borderRadius: 10 }} />
            </div>
            <div className="jdetail-skeleton" style={{ height: 300, borderRadius: 10 }} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Error ────────────────────────────────────────────────────────
  if (error || !profile) return (
    <>
      <Navbar />
      <div className="jdetail-page">
        <div className="jdetail-container">
          <div className="jobs-empty">
            <div className="jobs-empty__icon">😕</div>
            <h3>{error || "Candidate not found"}</h3>
            <p>This profile may not exist or may not be visible to recruiters.</p>
            <button className="btn btn--primary" onClick={() => router.push("/candidates")}>Back to Candidates</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  const user = profile.user;
  const experienceYears = profile.totalExperienceYears ?? 0;
  const experienceMonths = profile.totalExperienceMonths ?? 0;
  const location = [profile.location?.city, profile.location?.country].filter(Boolean).join(", ");
  const allSkills = [...(profile.salesforceSkills ?? []), ...(profile.skills ?? [])];

  return (
    <>
      <Navbar />
      <div className="jdetail-page">

        {/* ── Hero banner ── */}
        <div className="jdetail-hero">
          <div className="jdetail-container">
            <nav className="jdetail-breadcrumb" aria-label="Breadcrumb">
              <a href="/" className="jdetail-breadcrumb__link">Home</a>
              <span className="jdetail-breadcrumb__sep">›</span>
              <a href="/candidates" className="jdetail-breadcrumb__link">Candidates</a>
              <span className="jdetail-breadcrumb__sep">›</span>
              <span className="jdetail-breadcrumb__current">{user?.name ?? "Candidate"}</span>
            </nav>

            <div className="jdetail-hero__inner">
              <div className="jdetail-hero__left">
                <img
                  src={resolveAvatarSrc(profile.avatar, API, 64)}
                  alt=""
                  className="jdetail-logo jdetail-logo--round"
                />
                <div>
                  <h1 className="jdetail-title">{user?.name ?? "Candidate"}</h1>
                  <p className="jdetail-company">
                    {profile.headline || profile.currentDesignation || "Salesforce Professional"}
                    {profile.currentCompany ? ` @ ${profile.currentCompany}` : ""}
                  </p>
                  <div className="jdetail-badges">
                    <span className="badge badge--blue">{noticeLabel(profile.noticePeriod)} notice</span>
                    {profile.willingToRelocate && <span className="badge badge--green">Open to relocate</span>}
                    {profile.trailheadRank && <span className="badge badge--gray">🏔 {profile.trailheadRank}</span>}
                    {typeof profile.profileCompleteness === "number" && (
                      <span className="badge badge--blue">{profile.profileCompleteness}% complete</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="jdetail-hero__actions">
                <button className="btn btn--primary btn--lg" onClick={() => setShowRankModal(true)}>
                  🎯 Rank by Job Description
                </button>
                <button
                  className={`btn btn--lg ${saved ? "btn--saved" : "btn--ghost"}`}
                  onClick={handleToggleSave}
                  disabled={saving}
                  style={!saved ? { color: "#ffffff", borderColor: "rgba(255,255,255,0.4)" } : undefined}
                >
                  <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {saving ? "…" : saved ? "Saved" : "Save Candidate"}
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
                  { icon: "📍", label: "Location", value: location || "Not specified" },
                  { icon: "💼", label: "Experience", value: `${experienceYears}y ${experienceMonths}m` },
                  { icon: "⏳", label: "Notice Period", value: noticeLabel(profile.noticePeriod) },
                  { icon: "💰", label: "Expected Salary", value: profile.expectedSalaryLPA ? `₹${profile.expectedSalaryLPA} LPA` : "Not disclosed" },
                  { icon: "✉️", label: "Email", value: user?.email ?? "—" },
                  { icon: "📞", label: "Phone", value: profile.phone || "Not shared" },
                ].map((item) => (
                  <div key={item.label} className="jdetail-info-card">
                    <span className="jdetail-info-icon">{item.icon}</span>
                    <div>
                      <span className="jdetail-info-label">{item.label}</span>
                      <span className="jdetail-info-value">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {profile.summary && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Summary</h2>
                  <div className="jdetail-description">
                    <p className="jdetail-desc-para">{profile.summary}</p>
                  </div>
                </div>
              )}

              {allSkills.length > 0 && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Skills</h2>
                  <div className="job-card__skills">
                    {profile.salesforceSkills?.map((s: string) => <span key={s} className="skill-tag jdetail-skill">{s}</span>)}
                    {profile.skills?.map((s: string) => <span key={s} className="skill-tag skill-tag--muted jdetail-skill">{s}</span>)}
                  </div>
                </div>
              )}

              {profile.trailheadUrl && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Trailhead</h2>
                  <div className="jdetail-description">
                    {profile.trailheadBadgeCount ? `${profile.trailheadBadgeCount} badges earned. ` : ""}
                    <a href={profile.trailheadUrl} target="_blank" rel="noreferrer" className="auth-forgot">
                      View Trailhead profile ↗
                    </a>
                  </div>
                </div>
              )}

              {profile.experience?.length > 0 && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Experience</h2>
                  {profile.experience.map((e: any, i: number) => (
                    <div key={e._id || i} className="cand-timeline-item">
                      <strong>{e.title}</strong> — {e.company}
                      <div className="cand-timeline-item__meta">
                        {fmtMonthYear(e.from)} – {e.current ? "Present" : fmtMonthYear(e.to)}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                      {e.description && <p className="jdetail-desc-para" style={{ marginTop: "0.375rem" }}>{e.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {profile.education?.length > 0 && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Education</h2>
                  {profile.education.map((ed: any, i: number) => (
                    <div key={ed._id || i} className="cand-timeline-item">
                      <strong>{ed.degree}</strong> — {ed.institution}
                      <div className="cand-timeline-item__meta">
                        {ed.startYear || "?"} – {ed.endYear || "?"}{ed.grade ? ` · ${ed.grade}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profile.certifications?.length > 0 && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Certifications</h2>
                  <div className="job-card__skills">
                    {profile.certifications.map((c: any, i: number) => (
                      <span key={c._id || i} className="skill-tag jdetail-skill">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {(profile.links?.linkedin || profile.links?.github || profile.links?.portfolio || profile.links?.leetcode || profile.links?.stackoverflow) && (
                <div className="jdetail-section">
                  <h2 className="jdetail-section-title">Links</h2>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {profile.links?.linkedin && <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">LinkedIn</a>}
                    {profile.links?.github && <a href={profile.links.github} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">GitHub</a>}
                    {profile.links?.portfolio && <a href={profile.links.portfolio} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">Portfolio</a>}
                    {profile.links?.leetcode && <a href={profile.links.leetcode} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">LeetCode</a>}
                    {profile.links?.stackoverflow && <a href={profile.links.stackoverflow} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">Stack Overflow</a>}
                  </div>
                </div>
              )}
            </main>

            {/* ── Sidebar ── */}
            <aside className="jdetail-sidebar">
              <div className="jdetail-sidebar-card">
                <h3 className="jdetail-sidebar-card__title">Resume</h3>
                {profile.resume?.url ? (
                  <a
                    href={resolveResumeUrl(profile.resume.url, API)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    📄 View Resume
                  </a>
                ) : (
                  <p className="jdetail-summary-item" style={{ color: "#9AAFBE" }}>No resume uploaded</p>
                )}
              </div>

              <div className="jdetail-sidebar-card">
                <h3 className="jdetail-sidebar-card__title">Candidate Summary</h3>
                <ul className="jdetail-summary-list">
                  {[
                    { label: "Experience", value: `${experienceYears}y ${experienceMonths}m` },
                    { label: "Notice Period", value: noticeLabel(profile.noticePeriod) },
                    { label: "Location", value: location || "—" },
                    { label: "Expected Salary", value: profile.expectedSalaryLPA ? `₹${profile.expectedSalaryLPA} LPA` : "—" },
                    { label: "Relocate", value: profile.willingToRelocate ? "Yes" : "No" },
                    { label: "Profile Complete", value: `${profile.profileCompleteness ?? 0}%` },
                  ].map((item) => (
                    <li key={item.label} className="jdetail-summary-item">
                      <span className="jdetail-summary-label">{item.label}</span>
                      <span className="jdetail-summary-value">{item.value}</span>
                    </li>
                  ))}
                </ul>

                <button className="btn btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: "1.25rem" }} onClick={() => setShowRankModal(true)}>
                  🎯 Rank by Job Description
                </button>
                <button
                  className={`btn ${saved ? "btn--saved" : "btn--ghost"}`}
                  style={{ width: "100%", justifyContent: "center", marginTop: "0.625rem" }}
                  onClick={handleToggleSave}
                  disabled={saving}
                >
                  {saving ? "…" : saved ? "✓ Saved" : "Save Candidate"}
                </button>
              </div>

              <button className="btn btn--ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/candidates")}>
                ← Back to Candidates
              </button>
            </aside>
          </div>
        </div>
      </div>
      <Footer />

      {showRankModal && (
        <CandidateRankModal
          userId={userId}
          onClose={() => setShowRankModal(false)}
          apiBase={API}
          authHeaders={authHeaders}
        />
      )}
    </>
  );
}