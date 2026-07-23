'use client'
// components/ApplyConfirmModal.tsx
// Reusable — call openApply(job) from any Apply button across the site.

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  applyUrl: string;
  onClose: () => void;
  onMarked: () => void;
}

export default function ApplyConfirmModal({ jobId, jobTitle, applyUrl, onClose, onMarked }: ApplyModalProps) {
  const [saving, setSaving] = useState(false);

  const handleYes = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("tc_token");
      await fetch(`${API}/api/applied-jobs/${jobId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      onMarked();
    } catch {}
    setSaving(false);
    onClose();
  };

  return (
    <div className="navbar__modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="navbar__modal" onClick={e => e.stopPropagation()}>
        <div className="navbar__modal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h2 className="navbar__modal-title">Did you apply?</h2>
        <p className="navbar__modal-sub">
          We opened the application page for <strong>{jobTitle}</strong> in a new tab.
          Let us know if you completed your application so we can track it for you.
        </p>
        <div className="navbar__modal-actions">
          <button className="btn btn--primary" onClick={handleYes} disabled={saving}>
            {saving ? "Saving…" : "Yes, I applied"}
          </button>
          <button className="btn btn--ghost" onClick={onClose}>Not yet</button>
        </div>
      </div>
    </div>
  );
}