'use client'
import { getValidToken } from "@/lib/api";
import { useState, useEffect, CSSProperties } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface AtsResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  summary: string;
}

interface AtsScoreModalProps {
  jobId: string;
  onClose: () => void;
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function scoreColor(score: number): string {
  if (score >= 75) return "#38A169";
  if (score >= 50) return "#ED8936";
  return "#E53E3E";
}

export default function AtsScoreModal({ jobId, onClose }: AtsScoreModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noResume, setNoResume] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      setNoResume(false);
      try {
        const token = await getValidToken();

        if (!token) {
            // Redirect to login
            return;
        }
        const res = await fetch(`${API}/api/ats/${jobId}`, {
          credentials: "include",
          headers: {
              Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.code === "NO_RESUME") setNoResume(true);
          else setError(data.message || "Could not check your ATS score.");
          return;
        }
        setResult(data.result);
      } catch {
        setError("Network error while checking your ATS score.");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  return (
    <div className="jd-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jd-modal ats-modal" onClick={(e) => e.stopPropagation()}>
        <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="jd-title" style={{ marginBottom: "0.25rem" }}>ATS Score Check</h2>
        <p className="jd-company" style={{ marginBottom: "1.5rem" }}>
          Based on the resume in your profile vs. this job's requirements
        </p>

        {loading && <div className="pm-loading">Analyzing your resume against this job…</div>}

        {!loading && noResume && (
          <div className="ats-empty">
            <div className="ats-empty__icon">📄</div>
            <h3>No resume on your profile yet</h3>
            <p>Open your profile from the navbar and upload a resume first — then come back and check your score.</p>
          </div>
        )}

        {!loading && error && (
          <div className="auth-alert auth-alert--error">{error}</div>
        )}

        {!loading && result && (
          <>
            {/* Score ring */}
            <div className="ats-score-row">
              <div
                className="ats-score-ring"
                style={{ "--pct": `${result.score}%`, "--ring-color": scoreColor(result.score) } as CSSProperties}
              >
                <span style={{ color: scoreColor(result.score) }}>{result.score}</span>
              </div>
              <div>
                <p className="ats-score-label">ATS Match Score</p>
                <p className="ats-score-summary">{result.summary}</p>
              </div>
            </div>

            {/* Matched keywords */}
            {result.matchedKeywords.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">✓ Keywords found in your resume</h3>
                <div className="job-card__skills">
                  {result.matchedKeywords.map((k) => (
                    <span key={k} className="skill-tag ats-tag--matched">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing keywords */}
            {result.missingKeywords.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">⚠ Keywords to add</h3>
                <div className="job-card__skills">
                  {result.missingKeywords.map((k) => (
                    <span key={k} className="skill-tag ats-tag--missing">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">Strengths</h3>
                <ul className="ats-list ats-list--good">
                  {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">Gaps</h3>
                <ul className="ats-list ats-list--bad">
                  {result.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="jd-section">
                <h3 className="jd-section-title">Suggestions to improve your score</h3>
                <ul className="ats-list ats-list--suggest">
                  {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="jd-actions">
          <button className="btn btn--ghost btn--lg" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}