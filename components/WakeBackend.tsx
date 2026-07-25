"use client";

import { useEffect } from "react";

export default function WakeBackend() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .catch(() => {});
  }, []);

  return null;
}