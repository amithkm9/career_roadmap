"use client"

import { useState, useEffect, useCallback } from "react"

export function useExitIntent(enabled = true) {
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (enabled && !hasTriggered) {
        // Standard way to show a confirmation dialog before leaving
        e.preventDefault()
        e.returnValue = ""

        // Show our custom dialog instead
        setShowExitIntent(true)
        setHasTriggered(true)

        // This will still show the browser's default dialog,
        // but our custom dialog will appear first
        return ""
      }
    },
    [enabled, hasTriggered],
  )

  useEffect(() => {
    if (enabled) {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [enabled, handleBeforeUnload])

  const resetExitIntent = useCallback(() => {
    setHasTriggered(false)
    setShowExitIntent(false)
  }, [])

  return {
    showExitIntent,
    setShowExitIntent,
    hasTriggered,
    resetExitIntent,
  }
}

