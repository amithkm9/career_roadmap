"use client"

import { useEffect, useState } from "react"
import { getTracker, initializeTracker } from "@/lib/openreplay"
import type Tracker from "@openreplay/tracker"

export function useTracker() {
  const [tracker, setTracker] = useState<Tracker | null>(null)

  useEffect(() => {
    // Get or initialize the tracker
    const trackerInstance = getTracker() || initializeTracker()
    setTracker(trackerInstance)
  }, [])

  return tracker
}

