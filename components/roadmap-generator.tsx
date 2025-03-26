"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Rocket, Clock, Globe, Building, Target, MessageSquare, AlertCircle, ChevronDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginDialog } from "@/components/login-dialog"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { useTracker } from "@/hooks/use-tracker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Career options data
const careerOptions = {
  currentRoles: [
    "AI Engineer",
    "Data Scientist",
    "Designer",
    "Entrepreneur",
    "Finance Professional",
    "Management Professional",
    "Marketing Specialist",
    "Product Manager",
    "Software Engineer",
    "Student",
    "Tech Lead",
  ],
  futureRoles: [
    "AI Engineer",
    "Data Scientist",
    "Designer",
    "Entrepreneur",
    "Finance Professional",
    "Management Professional",
    "Marketing Specialist",
    "Product Manager",
    "Software Engineer",
    "Tech Lead",
  ],
  timeframes: [
    { value: "3months", label: "3 months", emoji: "🔜" },
    { value: "6months", label: "6 months", emoji: "⏳" },
    { value: "12months", label: "12 months", emoji: "📆" },
    { value: "24months", label: "24 months", emoji: "📆" },
  ],
  countries: [
    { value: "au", label: "Australia", emoji: "🇦🇺" },
    { value: "br", label: "Brazil", emoji: "🇧🇷" },
    { value: "ca", label: "Canada", emoji: "🇨🇦" },
    { value: "cn", label: "China", emoji: "🇨🇳" },
    { value: "fr", label: "France", emoji: "🇫🇷" },
    { value: "de", label: "Germany", emoji: "🇩🇪" },
    { value: "in", label: "India", emoji: "🇮🇳" },
    { value: "ie", label: "Ireland", emoji: "🇮🇪" },
    { value: "it", label: "Italy", emoji: "🇮🇹" },
    { value: "jp", label: "Japan", emoji: "🇯🇵" },
    { value: "mx", label: "Mexico", emoji: "🇲🇽" },
    { value: "nl", label: "Netherlands", emoji: "🇳🇱" },
    { value: "sg", label: "Singapore", emoji: "🇸🇬" },
    { value: "za", label: "South Africa", emoji: "🇿🇦" },
    { value: "kr", label: "South Korea", emoji: "🇰🇷" },
    { value: "es", label: "Spain", emoji: "🇪🇸" },
    { value: "se", label: "Sweden", emoji: "🇸🇪" },
    { value: "ae", label: "UAE", emoji: "🇦🇪" },
    { value: "uk", label: "United Kingdom", emoji: "🇬🇧" },
    { value: "us", label: "United States", emoji: "🇺🇸" },
  ],
  priorities: [
    { value: "impact", label: "Impact", emoji: "🌍" },
    { value: "salary", label: "Salary", emoji: "💰" },
    { value: "balance", label: "Work-life Balance", emoji: "🏖️" },
    { value: "recognition", label: "Job Satisfaction", emoji: "🏆" },
  ],
  mentorStyles: [
    {
      value: "visionary",
      label: "Visionary",
      emoji: "🔮",
      description: "Sees the big picture and inspires with bold ideas and future possibilities.",
    },
    {
      value: "practical",
      label: "Practical",
      emoji: "🛠️",
      description: "Focuses on real-world applications and actionable steps to achieve goals.",
    },
    {
      value: "challenger",
      label: "Challenger",
      emoji: "🔥",
      description: "Pushes you beyond your comfort zone and holds you accountable.",
    },
    {
      value: "supportive",
      label: "Supportive",
      emoji: "🌱",
      description: "Nurtures your growth with encouragement and positive reinforcement.",
    },
    {
      value: "analytical",
      label: "Analytical",
      emoji: "📊",
      description: "Uses data and logic to guide decisions and measure progress.",
    },
  ],
}

// Safe localStorage access
const getLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key)
  }
  return null
}

const setLocalStorage = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, value)
  }
}

const removeLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(key)
  }
}

export default function RoadmapGenerator() {
  const router = useRouter()
  const tracker = useTracker()

  // Function to get random item from an array
  const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)]
  }

  // Form state with default values
  const [formData, setFormData] = useState(() => {
    // Initialize with specific default values
    const defaultData = {
      currentRole: "Software Engineer",
      futureRole: "Product Manager",
      timeframe: "6months",
      location: "us",
      priority: "salary",
      mentorStyle: "visionary",
      customCurrentRole: "",
      customFutureRole: "",
      city: "",
    }

    return defaultData
  })

  // UI state
  const [isCustomCurrentRole, setIsCustomCurrentRole] = useState(false)
  const [isCustomFutureRole, setIsCustomFutureRole] = useState(false)
  const [showError, setShowError] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [mentorDropdownOpen, setMentorDropdownOpen] = useState(false)
  const { toast } = useToast()

  // Check for saved form data after component mounts (client-side only)
  useEffect(() => {
    const savedFormData = getLocalStorage("savedFormData")

    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData)

        // If this is from the roadmap page, remove the saved data
        if (parsedData.fromRoadmap) {
          removeLocalStorage("savedFormData")
        }

        // Update form data with saved values
        setFormData((prevData) => ({
          ...prevData,
          currentRole: parsedData.currentRole || prevData.currentRole,
          futureRole: parsedData.futureRole || prevData.futureRole,
          timeframe: parsedData.timeframe || prevData.timeframe,
          location: parsedData.location || prevData.location,
          priority: parsedData.priority || prevData.priority,
          mentorStyle: parsedData.mentorStyle || prevData.mentorStyle,
          city: parsedData.city || prevData.city,
        }))
      } catch (error) {
        console.error("Error parsing saved form data:", error)
      }
    }
  }, [])

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null)
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }

    checkUser()
  }, [])

  // Restore form data after login
  useEffect(() => {
    if (user) {
      const savedFormData = getLocalStorage("tempFormData")
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData)

          // Restore custom role states
          setIsCustomCurrentRole(parsedData.isCustomCurrentRole)
          setIsCustomFutureRole(parsedData.isCustomFutureRole)

          // Restore form data
          setFormData((prevData) => ({
            ...prevData,
            currentRole: parsedData.currentRole,
            futureRole: parsedData.futureRole,
            timeframe: parsedData.timeframe,
            location: parsedData.location,
            city: parsedData.city || "",
            priority: parsedData.priority,
            mentorStyle: parsedData.mentorStyle,
            customCurrentRole: formData.customCurrentRole || "",
            customFutureRole: formData.customFutureRole || "",
          }))

          // Clear the temporary storage
          removeLocalStorage("tempFormData")
        } catch (error) {
          console.error("Error restoring form data:", error)
        }
      }
    }
  }, [user])

  // Handle form changes
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Hide error when user starts filling form again
    if (showError) setShowError(false)

    // Track form field changes
    tracker?.event("form_field_changed", {
      field,
      value,
      currentRole: formData.currentRole,
      futureRole: formData.futureRole,
    })
  }

  // Toggle custom role inputs
  const toggleCustomCurrentRole = () => {
    setIsCustomCurrentRole(!isCustomCurrentRole)
    tracker?.event("toggle_custom_current_role", {
      isCustom: !isCustomCurrentRole,
      currentRole: formData.currentRole,
    })

    if (isCustomCurrentRole) {
      // Switching from custom to dropdown - set to empty string
      setFormData({ ...formData, customCurrentRole: "", currentRole: "" })
    } else {
      // Switching from dropdown to custom - keep the current role value for reference
      setFormData({ ...formData, customCurrentRole: formData.currentRole })
    }
  }

  const toggleCustomFutureRole = () => {
    setIsCustomFutureRole(!isCustomFutureRole)
    tracker?.event("toggle_custom_future_role", {
      isCustom: !isCustomFutureRole,
      futureRole: formData.futureRole,
    })

    if (isCustomFutureRole) {
      // Switching from custom to dropdown - set to empty string
      setFormData({ ...formData, customFutureRole: "", futureRole: "" })
    } else {
      // Switching from dropdown to custom - keep the future role value for reference
      setFormData({ ...formData, customFutureRole: formData.futureRole })
    }
  }

  // Generate roadmap
  const generateRoadmap = () => {
    // First check if the form is complete
    if (!isFormComplete()) {
      setShowError(true)
      tracker?.event("roadmap_generation_error", {
        missingFields: getMissingFields(),
        formData: {
          currentRole: getCurrentRole(),
          futureRole: getFutureRole(),
          timeframe: formData.timeframe,
          location: formData.location,
          priority: formData.priority,
          mentorStyle: formData.mentorStyle,
        },
      })

      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.getElementById("form-error")
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
      return
    }

    // Then check if user is logged in
    if (!user) {
      // Track login prompt
      tracker?.event("login_prompt_for_roadmap", {
        formData: {
          currentRole: getCurrentRole(),
          futureRole: getFutureRole(),
          timeframe: formData.timeframe,
          location: formData.location,
          priority: formData.priority,
          mentorStyle: formData.mentorStyle,
        },
      })

      // Store the current form data in localStorage before opening login dialog
      const formDataToSave = {
        currentRole: getCurrentRole(),
        futureRole: getFutureRole(),
        timeframe: formData.timeframe,
        location: formData.location,
        city: formData.city,
        priority: formData.priority,
        mentorStyle: formData.mentorStyle,
        isCustomCurrentRole: isCustomCurrentRole,
        isCustomFutureRole: isCustomFutureRole,
        customCurrentRole: formData.customCurrentRole,
        customFutureRole: formData.customFutureRole,
      }
      setLocalStorage("tempFormData", JSON.stringify(formDataToSave))

      setIsLoginOpen(true)
      toast({
        title: "Login Required",
        description: "Please log in to generate your career roadmap",
        variant: "default",
      })
      return
    }

    // Track successful roadmap generation
    tracker?.event("roadmap_generated", {
      formData: {
        currentRole: getCurrentRole(),
        futureRole: getFutureRole(),
        timeframe: formData.timeframe,
        location: formData.location,
        city: formData.city,
        priority: formData.priority,
        mentorStyle: formData.mentorStyle,
      },
      userId: user?.id,
    })

    // Prepare the data for the roadmap page
    const roadmapData = {
      currentRole: getCurrentRole(),
      futureRole: getFutureRole(),
      timeframe: formData.timeframe,
      location: formData.location,
      city: formData.city,
      priority: formData.priority,
      mentorStyle: formData.mentorStyle,
    }

    // Store data in localStorage for the roadmap page to access
    setLocalStorage("roadmapFormData", JSON.stringify(roadmapData))
    setLocalStorage("roadmapCareerOptions", JSON.stringify(careerOptions))

    // Navigate to the roadmap page
    router.push("/roadmap")
  }

  // Get display values for the sentence
  const getCurrentRole = () => (isCustomCurrentRole ? formData.customCurrentRole : formData.currentRole)
  const getFutureRole = () => (isCustomFutureRole ? formData.customFutureRole : formData.futureRole)

  const getTimeframeEmoji = () => {
    return ""
  }

  const getLocationDisplay = () => {
    const country = careerOptions.countries.find((c) => c.value === formData.location)
    return country ? `in ${country.label} ${country.emoji}` : ""
  }

  const getPriorityEmoji = () => {
    return ""
  }

  const getMentorStyleEmoji = () => {
    return ""
  }

  // Get the selected mentor style
  const getSelectedMentorStyle = () => {
    return (
      careerOptions.mentorStyles.find((style) => style.value === formData.mentorStyle) || careerOptions.mentorStyles[0]
    )
  }

  // Check if form is complete
  const isFormComplete = () => {
    return (
      (formData.currentRole || formData.customCurrentRole) &&
      (formData.futureRole || formData.customFutureRole) &&
      formData.timeframe &&
      formData.location &&
      formData.priority &&
      formData.mentorStyle
    )
  }

  // Get missing fields for error message
  const getMissingFields = () => {
    const missing = []

    if (!formData.currentRole && !formData.customCurrentRole) missing.push("Current Role")
    if (!formData.futureRole && !formData.customFutureRole) missing.push("Future Role")
    if (!formData.timeframe) missing.push("Timeframe")
    if (!formData.location) missing.push("Location")
    if (!formData.priority) missing.push("Career Priority")
    if (!formData.mentorStyle) missing.push("Mentor Style")

    return missing
  }

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-2 md:p-4"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl w-full mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-400 text-center">Career Accelerator</h1>

        <h2 className="text-lg md:text-xl text-center mb-2 text-[#8F9094] font-normal">
          Tell us your dreams. We will build you a road to get there.
        </h2>

        <div className="bg-[#111111] rounded-xl p-4 md:p-6 shadow-sm border border-[#222222] transition-all duration-300 max-w-5xl mx-auto">
          {/* Dynamic Sentence Display */}
          <div className="mb-8 p-3 md:p-4 bg-[#141414] rounded-lg border border-[#222222] text-sm md:text-base leading-relaxed tracking-wide text-[#8F9094]">
            I am currently a{" "}
            {getCurrentRole() ? (
              <span className="text-[#4C8BF5] font-medium">{getCurrentRole()}</span>
            ) : (
              <span className="underlined-placeholder animate-pulse-soft">...</span>
            )}{" "}
            and want to become a{" "}
            {getFutureRole() ? (
              <span className="text-[#4C8BF5] font-medium">{getFutureRole()}</span>
            ) : (
              <span className="underlined-placeholder animate-pulse-soft">...</span>
            )}{" "}
            in the next{" "}
            {formData.timeframe ? (
              <span className="text-[#4C8BF5] font-medium">
                {careerOptions.timeframes.find((t) => t.value === formData.timeframe)?.label}
              </span>
            ) : (
              <span className="underlined-placeholder animate-pulse-soft">...</span>
            )}{" "}
            working{" "}
            {formData.location ? (
              <span className="text-[#4C8BF5] font-medium">{getLocationDisplay()}</span>
            ) : (
              <span className="underlined-placeholder animate-pulse-soft">...</span>
            )}
            . My top priority is{" "}
            {formData.priority ? (
              <span className="text-[#4C8BF5] font-medium">
                {careerOptions.priorities.find((p) => p.value === formData.priority)?.label}
              </span>
            ) : (
              <span className="underlined-placeholder animate-pulse-soft">...</span>
            )}{" "}
            and I prefer a{" "}
            {formData.mentorStyle ? (
              <span className="text-[#4C8BF5] font-medium">
                {careerOptions.mentorStyles.find((s) => s.value === formData.mentorStyle)?.label}
              </span>
            ) : (
              <span className="underlined-placeholder animate-pulse-soft">...</span>
            )}{" "}
            mentor.
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
            {/* Current Role */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-[#4C8BF5]" />
                <label className="text-sm font-medium text-[#8F9094]">Current Role</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCustomCurrentRole}
                  className="ml-auto text-xs h-7 px-2 text-[#4C8BF5] hover:text-[#4C8BF5]/80 hover:bg-[#4C8BF5]/10 rounded-lg"
                >
                  {isCustomCurrentRole ? "Choose from list" : "Custom role"}
                </Button>
              </div>

              {isCustomCurrentRole ? (
                <Input
                  placeholder="Enter your current role"
                  value={formData.customCurrentRole}
                  onChange={(e) => handleChange("customCurrentRole", e.target.value)}
                  className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#4C8BF5] focus:border-[#4C8BF5] transition-all duration-200 text-[#8F9094]"
                />
              ) : (
                <Select value={formData.currentRole} onValueChange={(value) => handleChange("currentRole", value)}>
                  <SelectTrigger className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 transition-all duration-200 hover:border-[#4C8BF5]/50 text-sm text-white">
                    <SelectValue placeholder="Select your current role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-md overflow-hidden">
                    {careerOptions.currentRoles.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="text-[#8F9094] py-1.5 px-3 hover:bg-[#222222] cursor-pointer transition-colors duration-150 text-sm"
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>

            {/* Future Role */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-[#4C8BF5]" />
                <label className="text-sm font-medium text-[#8F9094]">Future Role</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCustomFutureRole}
                  className="ml-auto text-xs h-7 px-2 text-[#4C8BF5] hover:text-[#4C8BF5]/80 hover:bg-[#4C8BF5]/10 rounded-lg"
                >
                  {isCustomFutureRole ? "Choose from list" : "Custom role"}
                </Button>
              </div>

              {isCustomFutureRole ? (
                <Input
                  placeholder="Enter your future role"
                  value={formData.customFutureRole}
                  onChange={(e) => handleChange("customFutureRole", e.target.value)}
                  className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#4C8BF5] focus:border-[#4C8BF5] transition-all duration-200 text-[#8F9094]"
                />
              ) : (
                <Select value={formData.futureRole} onValueChange={(value) => handleChange("futureRole", value)}>
                  <SelectTrigger className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 transition-all duration-200 hover:border-[#4C8BF5]/50 text-sm text-white [&>span]:text-white">
                    <SelectValue placeholder="Select your future role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-md overflow-hidden">
                    {careerOptions.futureRoles.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="text-[#8F9094] py-1.5 px-3 hover:bg-[#222222] cursor-pointer transition-colors duration-150 text-sm"
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>

            {/* Timeframe */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#4C8BF5]" />
                <label className="text-sm font-medium text-[#8F9094]">Timeframe</label>
              </div>
              <Select value={formData.timeframe} onValueChange={(value) => handleChange("timeframe", value)}>
                <SelectTrigger className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 transition-all duration-200 hover:border-[#4C8BF5]/50 text-sm text-white">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-md overflow-hidden">
                  {careerOptions.timeframes.map((timeframe) => (
                    <SelectItem
                      key={timeframe.value}
                      value={timeframe.value}
                      className="text-[#8F9094] py-1.5 px-3 hover:bg-[#222222] cursor-pointer transition-colors duration-150 text-sm"
                    >
                      {timeframe.label} {timeframe.emoji}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Location */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#4C8BF5]" />
                <label className="text-sm font-medium text-[#8F9094]">Location</label>
              </div>
              <Select value={formData.location} onValueChange={(value) => handleChange("location", value)}>
                <SelectTrigger className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 transition-all duration-200 hover:border-[#4C8BF5]/50 text-sm text-white">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-md overflow-hidden max-h-[300px]">
                  {careerOptions.countries.map((country) => (
                    <SelectItem
                      key={country.value}
                      value={country.value}
                      className="text-[#8F9094] py-1.5 px-3 hover:bg-[#222222] cursor-pointer transition-colors duration-150 text-sm"
                    >
                      {country.emoji} {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Career Priority */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#4C8BF5]" />
                <label className="text-sm font-medium text-[#8F9094]">Career Priority</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {careerOptions.priorities.map((priority) => (
                  <Button
                    key={priority.value}
                    variant="outline"
                    className={`justify-start gap-2 rounded-full transition-all duration-300 ${
                      formData.priority === priority.value
                        ? "bg-[#4C8BF5]/10 border-[#4C8BF5]/30 shadow-sm"
                        : "bg-[#141414] border-[#2a2a2a] hover:bg-[#1a1a1a] hover:border-[#4C8BF5]/30 hover:scale-105 hover:shadow-md"
                    }`}
                    onClick={() => handleChange("priority", priority.value)}
                  >
                    <span className="text-xl transform transition-transform group-hover:scale-110">
                      {priority.emoji}
                    </span>
                    <span className="text-white transition-colors">{priority.label}</span>
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Mentor Style */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#4C8BF5]" />
                <label className="text-sm font-medium text-[#8F9094]">Mentor Style</label>
              </div>

              <DropdownMenu open={mentorDropdownOpen} onOpenChange={setMentorDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-300 text-left bg-[#141414] border border-[#2a2a2a] hover:bg-[#0a0a0a]/80 hover:border-[#4C8BF5]/30 text-sm ${
                      mentorDropdownOpen ? "border-[#4C8BF5]/30 shadow-sm" : ""
                    }`}
                  >
                    <span className="text-xl">{getSelectedMentorStyle().emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white">{getSelectedMentorStyle().label}</div>
                      <div className="text-xs text-[#86868b]">{getSelectedMentorStyle().description}</div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#86868b] transition-transform ${mentorDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-full min-w-[300px] bg-[#141414] border-[#2a2a2a] rounded-lg p-2 shadow-lg"
                  align="start"
                  sideOffset={4}
                >
                  {careerOptions.mentorStyles.map((style) => (
                    <DropdownMenuItem
                      key={style.value}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        formData.mentorStyle === style.value
                          ? "bg-[#4C8BF5]/10 border border-[#4C8BF5]/30"
                          : "hover:bg-[#222222]"
                      }`}
                      onClick={() => handleChange("mentorStyle", style.value)}
                    >
                      <span className="text-2xl">{style.emoji}</span>
                      <div>
                        <div className="font-medium text-[#8F9094]">{style.label}</div>
                        <div className="text-xs text-[#86868b] mt-1">{style.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>

          {/* Error Message */}
          {showError && (
            <motion.div
              id="form-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8"
            >
              <Alert variant="destructive" className="bg-red-900/10 border border-red-500/30 text-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  Please fill all the fields to generate your roadmap.
                  <span className="block mt-1 text-sm opacity-80">Missing: {getMissingFields().join(", ")}</span>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Generate Button */}
          <motion.div
            className="mt-4 flex justify-center"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <Button
              onClick={generateRoadmap}
              className="bg-[#4C8BF5] hover:bg-[#4C8BF5]/90 text-white px-6 py-2 text-base font-medium rounded-lg shadow-sm"
            >
              {user ? "Generate My Career Roadmap 🚀" : "Login to Generate Roadmap 🚀"}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Login Dialog */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </motion.div>
  )
}

