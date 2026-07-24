"use client";

import { Suspense } from "react";
import JobsContent from "./JobsContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobsContent />
    </Suspense>
  );
}