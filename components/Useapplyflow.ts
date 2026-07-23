'use client'
// hooks/useApplyFlow.ts
// Drop-in hook: gives you an Apply button handler + modal state.
// Usage in any component:
//   const { applyState, handleApplyClick, closeApplyModal, markApplied } = useApplyFlow();
//   <a onClick={(e) => handleApplyClick(e, job)}>Apply →</a>
//   {applyState && <ApplyConfirmModal {...applyState} onClose={closeApplyModal} onMarked={() => markApplied(applyState.jobId)} />}

import { useState } from "react";

interface JobLike { _id: string; title: string; applyUrl: string; }

export function useApplyFlow() {
  const [applyState, setApplyState] = useState<{ jobId: string; jobTitle: string; applyUrl: string } | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleApplyClick = (e: React.MouseEvent, job: JobLike) => {
    e.preventDefault();
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    setApplyState({ jobId: job._id, jobTitle: job.title, applyUrl: job.applyUrl });
  };

  const closeApplyModal = () => setApplyState(null);

  const markApplied = (jobId: string) => {
    setAppliedIds(prev => new Set(prev).add(jobId));
  };

  return { applyState, appliedIds, handleApplyClick, closeApplyModal, markApplied };
}