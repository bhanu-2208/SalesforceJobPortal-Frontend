'use client'
import { useState, CSSProperties } from "react";

interface JdRequirements {
  roleTitle?: string;
  requiredSkills: string[];
  minExperienceYears: number;
}

interface RankResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  requirements: JdRequirements;
}

interface CandidateRankModalProps {
  userId: string;
  onClose: () => void;
  apiBase: string;
  authHeaders: () => Record<string, string>;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#38A169";
  if (score >= 50) return "#ED8936";
  return "#E53E3E";
}

export default function CandidateRankModal({ userId, onClose, apiBase, authHeaders }: CandidateRankModalProps) {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RankResult | null>(null);

  const handleSubmit = async () => {
    if (jd.trim().length < 30) {
      setError("Paste the full job description — that looks too short to analyze.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/candidates/${userId}/rank-by-jd`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not score this candidate.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not score this candidate.");
    } finally {
      setLoading(false);
    }
  };

  const tryAnother = () => {
    setResult(null);
    setJd("");
    setError("");
  };

  return (
    <div className="jd-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="jd-title" style={{ marginBottom: "0.25rem" }}>Rank This Candidate by Job Description</h2>
        <p className="jd-company" style={{ marginBottom: "1.25rem" }}>
          Paste a job description to see how well this specific candidate matches it.
        </p>

        {error && <div className="auth-alert auth-alert--error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {!result ? (
          <>
            <div className="feedback__field">
              <label className="feedback__label" htmlFor="single-rank-jd">Job Description</label>
              <textarea
                id="single-rank-jd"
                className="feedback__textarea"
                rows={10}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description — responsibilities, required skills, experience level, certifications..."
              />
            </div>
            <div className="jd-actions" style={{ marginTop: "1.25rem" }}>
              <button className="feedback__submit" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
                {loading ? "Analyzing & scoring…" : "🎯 Score This Candidate"}
              </button>
              <button className="btn btn--ghost btn--lg" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="ats-score-row">
              <div
                className="ats-score-ring"
                style={{ "--pct": `${result.score}%`, "--ring-color": scoreColor(result.score) } as CSSProperties}
              >
                <span style={{ color: scoreColor(result.score) }}>{result.score}</span>
              </div>
              <div>
                <p className="ats-score-label">Match Score</p>
                <p className="ats-score-summary">
                  Against: {result.requirements.roleTitle || "this job description"}
                  {result.requirements.minExperienceYears > 0 && ` · ${result.requirements.minExperienceYears}+ yrs required`}
                </p>
              </div>
            </div>

            {result.matchedSkills.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">✓ Matched Skills</h3>
                <div className="job-card__skills">
                  {result.matchedSkills.map((s) => <span key={s} className="skill-tag ats-tag--matched">{s}</span>)}
                </div>
              </div>
            )}

            {result.missingSkills.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">⚠ Missing Skills</h3>
                <div className="job-card__skills">
                  {result.missingSkills.map((s) => <span key={s} className="skill-tag ats-tag--missing">{s}</span>)}
                </div>
              </div>
            )}

            <div className="jd-actions" style={{ marginTop: "1.25rem" }}>
              <button className="btn btn--ghost" onClick={tryAnother}>Try Another JD</button>
              <button className="btn btn--primary btn--lg" onClick={onClose}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}