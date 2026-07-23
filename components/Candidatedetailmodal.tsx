'use client'
import { useState, useEffect } from "react";
import { resolveAvatarSrc,resolveResumeUrl  } from "./avatarPresets";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface CandidateDetailModalProps {
  userId: string;
  saved: boolean;
  onClose: () => void;
  onToggleSave: (userId: string) => void;
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fmtMonthYear(d?: string): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
  return np ? map[np] ?? np : "—";
}

export default function CandidateDetailModal({ userId, saved, onClose, onToggleSave }: CandidateDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/profile/${userId}`, {
          credentials: "include",
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load this profile.");
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load this profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const user = profile?.user;

  return (
    <div className="jd-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jd-modal cand-modal" onClick={(e) => e.stopPropagation()}>
        <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>

        {loading && <div className="pm-loading">Loading profile…</div>}
        {!loading && error && <div className="auth-alert auth-alert--error">{error}</div>}

        {!loading && profile && (
          <>
            <div className="jd-header">
              <img
                src={resolveAvatarSrc(profile.avatar, API, 64)}
                alt=""
                className="job-card__logo jd-logo"
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ flex: 1 }}>
                <h2 className="jd-title">{user?.name ?? "Candidate"}</h2>
                <p className="jd-company">{profile.headline || profile.currentDesignation || "Salesforce Professional"}</p>
              </div>
              <button
                className={`job-card__save-btn ${saved ? "job-card__save-btn--saved" : ""}`}
                onClick={() => onToggleSave(userId)}
                aria-label={saved ? "Remove from saved" : "Save candidate"}
                title={saved ? "Saved — click to remove" : "Save for later"}
              >
                <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>

            {/* Contact + quick facts */}
            <div className="jd-meta">
              {user?.email && <span className="job-card__info-item">✉️ {user.email}</span>}
              {profile.phone && <span className="job-card__info-item">📞 {profile.phone}</span>}
              {(profile.location?.city || profile.location?.country) && (
                <span className="job-card__info-item">📍 {[profile.location?.city, profile.location?.state, profile.location?.country].filter(Boolean).join(", ")}</span>
              )}
              <span className="job-card__info-item">💼 {profile.totalExperienceYears || 0}y {profile.totalExperienceMonths || 0}m experience</span>
              <span className="job-card__info-item">⏳ Notice: {noticeLabel(profile.noticePeriod)}</span>
              {profile.expectedSalaryLPA && <span className="job-card__info-item">💰 Expects ₹{profile.expectedSalaryLPA} LPA</span>}
            </div>

            {profile.summary && (
              <div className="jd-section">
                <h3 className="jd-section-title">Summary</h3>
                <p className="jd-description">{profile.summary}</p>
              </div>
            )}

            {(profile.salesforceSkills?.length > 0 || profile.skills?.length > 0) && (
              <div className="jd-section">
                <h3 className="jd-section-title">Skills</h3>
                <div className="job-card__skills">
                  {profile.salesforceSkills?.map((s: string) => <span key={s} className="skill-tag">{s}</span>)}
                  {profile.skills?.map((s: string) => <span key={s} className="skill-tag skill-tag--muted">{s}</span>)}
                </div>
              </div>
            )}

            {profile.trailheadUrl && (
              <div className="jd-section">
                <h3 className="jd-section-title">Trailhead</h3>
                <p className="jd-description">
                  {profile.trailheadRank && <span className="badge badge--blue" style={{ marginRight: "0.5rem" }}>{profile.trailheadRank}</span>}
                  {profile.trailheadBadgeCount ? `${profile.trailheadBadgeCount} badges` : ""}{" "}
                  <a href={profile.trailheadUrl} target="_blank" rel="noreferrer" className="auth-forgot">View profile ↗</a>
                </p>
              </div>
            )}

            {profile.experience?.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">Experience</h3>
                {profile.experience.map((e: any, i: number) => (
                  <div key={e._id || i} className="cand-timeline-item">
                    <strong>{e.title}</strong> — {e.company}
                    <div className="cand-timeline-item__meta">
                      {fmtMonthYear(e.from)} – {e.current ? "Present" : fmtMonthYear(e.to)}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                    {e.description && <p className="jd-description" style={{ marginTop: "0.25rem" }}>{e.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {profile.education?.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">Education</h3>
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
              <div className="jd-section">
                <h3 className="jd-section-title">Certifications</h3>
                <div className="job-card__skills">
                  {profile.certifications.map((c: any, i: number) => (
                    <span key={c._id || i} className="skill-tag">{c.name}</span>
                  ))}
                </div>
              </div>
            )}

            {(profile.links?.linkedin || profile.links?.github || profile.links?.portfolio) && (
              <div className="jd-section">
                <h3 className="jd-section-title">Links</h3>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {profile.links?.linkedin && <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">LinkedIn</a>}
                  {profile.links?.github && <a href={profile.links.github} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">GitHub</a>}
                  {profile.links?.portfolio && <a href={profile.links.portfolio} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">Portfolio</a>}
                </div>
              </div>
            )}

            <div className="jd-actions">
              {profile.resume?.url ? (
                <a href={resolveResumeUrl(profile.resume.url, API)} target="_blank" rel="noreferrer" className="btn btn--primary btn--lg">
                📄 View Resume
              </a>
              ) : (
                <span className="job-card__info-item">No resume uploaded</span>
              )}
              <button className="btn btn--ghost btn--lg" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}