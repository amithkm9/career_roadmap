import Tracker from "@openreplay/tracker"

// This ensures the tracker is only initialized on the client side
let tracker: Tracker | null = null

// Initialize the tracker
export const initializeTracker = () => {
  if (typeof window !== "undefined" && !tracker) {
    // Get the project key from environment variables
    const projectKey = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY

    if (!projectKey) {
      console.warn("OpenReplay project key is not defined. Tracking will not be initialized.")
      return null
    }

    tracker = new Tracker({
      projectKey,
      // Optional configuration
      __DISABLE_SECURE_MODE: process.env.NODE_ENV === "development", // For easier local development
    })

    tracker.start()
    console.log("OpenReplay tracker initialized")
  }

  return tracker
}

// Get the tracker instance
export const getTracker = () => tracker

