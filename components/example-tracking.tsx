"use client"

import { useTracker } from "@/hooks/use-tracker"

export function ExampleTracking() {
  const tracker = useTracker()

  const handleClick = () => {
    // Track a custom event
    tracker?.event("button_clicked", { buttonName: "example" })

    // Your regular click handler logic
  }

  return <button onClick={handleClick}>Track This Click</button>
}

