'use client'
import { useState } from "react";

interface RankByJDModalProps {
  onClose: () => void;
  onRanked: (result: { data: any[]; requirements: any; truncated: boolean }) => void;
  buildQueryParams: () => URLSearchParams; // current filters, so ranking respects them
  authHeaders: () => Record<string, string>;
  apiBase: string;
}

export default function RankByJDModal({ onClose, onRanked, buildQueryParams, authHeaders, apiBase }: RankByJDModalProps) {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (jd.trim().length < 30) {
      setError("Paste the full job description — that looks too short to analyze.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = buildQueryParams();
      const res = await fetch(`${apiBase}/api/candidates/rank-by-jd?${params}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not rank candidates.");
      onRanked({ data: data.data, requirements: data.requirements, truncated: data.truncated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rank candidates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jd-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="jd-title" style={{ marginBottom: "0.25rem" }}>Rank Candidates by Job Description</h2>
        <p className="jd-company" style={{ marginBottom: "1.25rem" }}>
          Paste a job description — every candidate matching your current filters gets scored
          against it, highest match first.
        </p>

        {error && <div className="auth-alert auth-alert--error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="feedback__field">
          <label className="feedback__label" htmlFor="rank-jd-text">Job Description</label>
          <textarea
            id="rank-jd-text"
            className="feedback__textarea"
            rows={12}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description here — responsibilities, required skills, experience level, certifications..."
          />
        </div>

        <div className="jd-actions" style={{ marginTop: "1.25rem" }}>
          <button className="feedback__submit" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Analyzing & scoring…" : "🎯 Rank Candidates"}
          </button>
          <button className="btn btn--ghost btn--lg" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}