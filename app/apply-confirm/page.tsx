"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function ApplyConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  
  
  const jobId = params.get("jobId") ?? "";
  const title = params.get("title") ?? "";

  const [saving, setSaving] = useState(false);

    const returnUrl = params.get("returnUrl") || "/jobs";
  const handleYes = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("tc_token");

      await fetch(`${API}/api/applied-jobs/${jobId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {}
    router.push(returnUrl);
    // router.push("/jobs");
  };

//   const handleNo = () => {
//     router.push("/jobs");
//   };
    const handleNo = () => {
    const returnUrl = params.get("returnUrl") || "/jobs";
    router.push(returnUrl);
    };

  return (
    <div className="apply-confirm">
      <div className="apply-confirm-card">

        <div className="apply-confirm-icon">
          ✓
        </div>

        <h1>Did you apply?</h1>

        <p>
          We opened the application page for
          <strong> {title}</strong>.
        </p>

        <p>
          Did you successfully submit your application?
        </p>

        <div className="apply-confirm-buttons">

          <button
            className="btn btn--primary"
            onClick={handleYes}
            disabled={saving}
          >
            {saving ? "Saving..." : "Yes, I Applied"}
          </button>

          <button
            className="btn btn--ghost"
            onClick={handleNo}
          >
            Not Yet
          </button>

        </div>

      </div>
    </div>
  );
  // your existing code here
}

export default function ApplyConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplyConfirmContent />
    </Suspense>
  );
}

