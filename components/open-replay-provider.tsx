"use client"

import type React from "react"
import { useEffect } from "react"
import { initializeTracker } from "@/lib/openreplay"

export function OpenReplayProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize tracking for all visitors
    initializeTracker()
  }, [])

  return <>{children}</>
}

