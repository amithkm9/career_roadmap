"use client"

import { DialogDescription } from "@/components/ui/dialog"

import {
  Dialog,
  DialogContent as DialogContentPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
} from "@/components/ui/dialog"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Target,
  Award,
  Lightbulb,
  BookOpen,
  Users,
  Zap,
  ChevronRight,
  Youtube,
  BookIcon,
  Laptop,
  Brain,
  Heart,
  ExternalLink,
  Code,
  Layers,
  Briefcase,
  FileText,
  Headphones,
  Video,
  Loader,
  Info,
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useSubRoles } from "@/hooks/use-sub-roles"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTracker } from "@/hooks/use-tracker"
import { useRouter } from "next/navigation"
// Add the import for our new components at the top of the file
import { FeedbackDialog } from "@/components/feedback-dialog"
import { useExitIntent } from "@/hooks/use-exit-intent"
import { useUser } from "@supabase/auth-helpers-react"
// Add this to the imports at the top
import type { User } from "@supabase/supabase-js"

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

const removeLocalStorage = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(key, value)
  }
}

interface RoadmapDisplayProps {
  formData: {
    currentRole: string
    futureRole: string
    timeframe: string
    location: string
    priority: string
    mentorStyle: string
  }
  resetForm: () => void
  careerOptions: any
}

interface Skill {
  id: string
  name: string
  type: "functional" | "soft"
  description: string
  learningResource: string
}

interface BookRecommendation {
  title: string
  author: string
  chapter: string
  description: string
  link: string
}

interface Resource {
  title: string
  platform?: string
  author?: string
  publication?: string
  host?: string
  creator?: string
  postDate?: string
  link?: string
}

interface RoadmapStep {
  title: string
  period: string
  subtext: string
  projects: string[]
  resources: {
    books?: Resource[]
    videos?: Resource[]
    courses?: Resource[]
    articles?: Resource[]
    podcasts?: Resource[]
  }
}

interface CareerRoadmapData {
  role: string
  roadmap: RoadmapStep[]
}

export default function RoadmapDisplay({ formData, resetForm, careerOptions }: RoadmapDisplayProps) {
  const [selectedConsultantType, setSelectedConsultantType] = useState<string | null>(null)
  const [showSkillInfo, setShowSkillInfo] = useState(false)
  const [consultantInput, setConsultantInput] = useState("")
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [roadmapSource, setRoadmapSource] = useState<string>("") // Track which role's roadmap is being used
  const tracker = useTracker()
  const router = useRouter()
  // Inside the RoadmapDisplay component, add these lines after the existing state declarations
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const { showExitIntent, setShowExitIntent } = useExitIntent(true)
  const userAuth = useUser()
  // Add this to the state declarations
  const [user, setUser] = useState<User | null>(null)

  // Add this useEffect to get the user information
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    getUser()
  }, [])

  // Fetch roadmap data from Supabase
  useEffect(() => {
    const fetchRoadmap = async () => {
      setIsLoading(true)
      try {
        // First try to fetch the roadmap for the exact future role
        let { data, error } = await supabase
          .from("career_repository")
          .select("roadmap, role")
          .eq("role", formData.futureRole)
          .single()

        // If no exact match, fall back to the Entrepreneur roadmap
        if (error) {
          console.log(`No exact match found for ${formData.futureRole}, falling back to Entrepreneur roadmap`)

          const { data: entrepreneurData, error: entrepreneurError } = await supabase
            .from("career_repository")
            .select("roadmap, role")
            .eq("role", "Entrepreneur")
            .single()

          if (entrepreneurError) {
            console.error("Error fetching fallback roadmap:", entrepreneurError)
            setIsLoading(false)
            return
          }

          data = entrepreneurData
        }

        if (data) {
          console.log(`Successfully loaded roadmap`)
          // Handle the nested structure from Supabase
          if (data.roadmap && typeof data.roadmap === "object") {
            setCareerRoadmap(data.roadmap)
            setRoadmapSource(data.roadmap.role || data.role)
          } else {
            console.error("Unexpected roadmap data structure:", data.roadmap)
          }
        }
      } catch (error) {
        console.error("Failed to fetch roadmap:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoadmap()
  }, [formData.futureRole])

  // Add this useEffect to handle the exit intent
  useEffect(() => {
    if (showExitIntent) {
      setShowFeedbackDialog(true)
      setShowExitIntent(false)
    }
  }, [showExitIntent, setShowExitIntent])

  // Get display values
  const getTimeframeLabel = () => {
    return careerOptions.timeframes.find((t: any) => t.value === formData.timeframe)?.label || formData.timeframe
  }

  const getPriorityLabel = () => {
    return careerOptions.priorities.find((p: any) => p.value === formData.priority)?.label || formData.priority
  }

  const getMentorStyleLabel = () => {
    return careerOptions.mentorStyles.find((s: any) => s.value === formData.mentorStyle)?.label || formData.mentorStyle
  }

  const getLocationDisplay = () => {
    const country = careerOptions.countries.find((c: any) => c.value === formData.location)
    return country ? `${country.label} ${country.emoji}` : formData.location
  }

  // Consultant types
  const { subRoles, isLoading: isLoadingSubRoles } = useSubRoles(formData.futureRole)

  // Update the consultantTypes to include the fetched sub-roles with descriptions
  const consultantTypes = [
    ...subRoles,
    {
      id: "custom",
      label: "Custom",
      description: `Create a custom ${formData.futureRole.toLowerCase()} specialization based on your unique interests and goals.`,
    },
    {
      id: "unknown",
      label: "I don't know",
      description:
        "Not sure which specialization to choose? We can help you explore your options and find the right path.",
    },
  ]

  // Skills needed for the role
  const getSkillsForRole = () => {
    // This would ideally be dynamic based on the selected role
    const skills: Skill[] = [
      {
        id: "skill1",
        name: "Strategic Thinking",
        type: "functional",
        description:
          "The ability to think long-term, identify patterns, and develop effective strategies to achieve business goals.",
        learningResource: "https://www.coursera.org/learn/strategic-thinking",
      },
      {
        id: "skill2",
        name: "Data Analysis",
        type: "functional",
        description: "Ability to interpret complex data sets, extract insights, and make data-driven decisions.",
        learningResource: "https://www.udemy.com/course/data-analysis-with-excel-pivot-tables/",
      },
      {
        id: "skill3",
        name: "Project Management",
        type: "functional",
        description:
          "Skills to plan, execute, and close projects successfully, including resource allocation and timeline management.",
        learningResource: "https://www.pmi.org/learning/courses",
      },
      {
        id: "skill4",
        name: "Communication",
        type: "soft",
        description:
          "Ability to clearly articulate ideas, listen effectively, and tailor communication to different audiences.",
        learningResource: "https://www.linkedin.com/learning/communication-foundations-4",
      },
      {
        id: "skill5",
        name: "Leadership",
        type: "soft",
        description: "Capacity to inspire and motivate teams, delegate effectively, and drive organizational change.",
        learningResource: "https://www.edx.org/learn/leadership",
      },
      {
        id: "skill6",
        name: "Problem Solving",
        type: "soft",
        description: "Ability to identify issues, analyze root causes, and develop effective solutions.",
        learningResource: "https://www.coursera.org/learn/problem-solving-skills",
      },
      {
        id: "skill7",
        name: "Industry Knowledge",
        type: "functional",
        description: "Deep understanding of industry trends, competitive landscape, and market dynamics.",
        learningResource: "https://trends.google.com/trends/",
      },
      {
        id: "skill8",
        name: "Stakeholder Management",
        type: "functional",
        description: "Skills to identify, engage, and manage relationships with key stakeholders.",
        learningResource: "https://www.udemy.com/course/stakeholder-management/",
      },
    ]
    return skills
  }

  // Book recommendations
  const getBookRecommendations = (): BookRecommendation[] => {
    return [
      {
        title: "The Lean Product Playbook",
        author: "Dan Olsen",
        chapter: "Chapter 3: Product-Market Fit",
        description: "Learn how to create products that truly resonate with customers and achieve product-market fit.",
        link: "https://www.amazon.com/Lean-Product-Playbook-Innovate-Products/dp/1118960874",
      },
      {
        title: "Inspired: How to Create Tech Products Customers Love",
        author: "Marty Cagan",
        chapter: "Chapter 7: Product Discovery",
        description: "Discover techniques for effective product discovery and validation before building.",
        link: "https://www.amazon.com/INSPIRED-Create-Tech-Products-Customers/dp/1119387507",
      },
    ]
  }

  // Handle consultant type selection
  const handleConsultantTypeClick = (type: string) => {
    tracker?.event("consultant_type_selected", {
      consultantType: type,
      isCustom: type === "custom" ? true : false,
      customValue: type === "custom" ? consultantInput : null,
      futureRole: formData.futureRole,
    })
  }

  // Handle skill selection
  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill)
    setShowSkillInfo(true)

    tracker?.event("skill_info_viewed", {
      skillName: skill.name,
      skillType: skill.type,
      futureRole: formData.futureRole,
    })
  }

  // Toggle expanded step
  const toggleExpandedStep = (index: number) => {
    if (expandedStep === index) {
      setExpandedStep(null)
      tracker?.event("roadmap_step_collapsed", {
        stepIndex: index,
        stepTitle: roadmapSteps[index]?.title,
        futureRole: formData.futureRole,
      })
    } else {
      setExpandedStep(index)
      tracker?.event("roadmap_step_expanded", {
        stepIndex: index,
        stepTitle: roadmapSteps[index]?.title,
        futureRole: formData.futureRole,
      })
    }
  }

  // Generate roadmap steps based on user inputs
  const generateRoadmapSteps = () => {
    const steps = []

    // Assessment step - this is always the first step (Week 1)
    steps.push({
      title: "Find A Career Path That Fits Your Strengths",
      description: `Explore different specializations and determine the best path forward.`,
      icon: <Target className="h-6 w-6 text-blue-400" />,
      timeframe: "Week 1",
      interactive: true,
    })

    // Add steps from fetched roadmap if available
    if (careerRoadmap && careerRoadmap.roadmap && careerRoadmap.roadmap.length > 0) {
      careerRoadmap.roadmap.forEach((step) => {
        const iconMap = {
          "Week 2": <BookOpen className="h-6 w-6 text-purple-500" />,
          "Weeks 3-4": <Code className="h-6 w-6 text-blue-400" />,
          "Month 2": <Layers className="h-6 w-6 text-purple-500" />,
          "Month 3": <Briefcase className="h-6 w-6 text-blue-400" />,
          "Final Project": <CheckCircle2 className="h-6 w-6 text-green-500" />,
        }

        steps.push({
          title: step.title,
          description: step.subtext,
          icon: iconMap[step.period] || <BookOpen className="h-6 w-6 text-purple-500" />,
          timeframe: step.period,
          learningResources: true,
          resources: step.resources,
          projects: step.projects,
        })
      })
    } else {
      // Default roadmap steps if no specific roadmap is found
      // Learning plan
      steps.push({
        title: "Create a Learning Plan",
        description: `Develop a structured learning plan focused on the key skills needed for a ${formData.futureRole} position.`,
        icon: <BookOpen className="h-6 w-6 text-purple-500" />,
        timeframe: "Week 2",
        learningResources: true,
      })

      // Networking
      steps.push({
        title: "Build Your Network",
        description: `Connect with professionals who are already ${formData.futureRole}s to gain insights and mentorship.`,
        icon: <Users className="h-6 w-6 text-blue-400" />,
        timeframe: "Week 3",
      })

      // Priority-based step
      if (formData.priority === "impact") {
        steps.push({
          title: "Identify Impact Opportunities",
          description: "Find projects where you can make meaningful contributions and demonstrate your value.",
          icon: <Zap className="h-6 w-6 text-purple-500" />,
          timeframe: "Month 1",
        })
      } else if (formData.priority === "salary") {
        steps.push({
          title: "Research Compensation",
          description: `Research salary ranges for ${formData.futureRole} positions and prepare negotiation strategies.`,
          icon: <Award className="h-6 w-6 text-purple-500" />,
          timeframe: "Month 1",
        })
      } else if (formData.priority === "balance") {
        steps.push({
          title: "Establish Boundaries",
          description: "Define your ideal work schedule and boundaries to maintain work-life balance.",
          icon: <Clock className="h-6 w-6 text-purple-500" />,
          timeframe: "Month 1",
        })
      } else if (formData.priority === "recognition") {
        steps.push({
          title: "Build Your Personal Brand",
          description: "Develop a strategy to showcase your expertise and gain recognition in your field.",
          icon: <Award className="h-6 w-6 text-purple-500" />,
          timeframe: "Month 1",
        })
      }

      // Location step
      steps.push({
        title: `Prepare for Working in ${getLocationDisplay()}`,
        description: `Research companies and opportunities in ${getLocationDisplay()} that offer ${formData.futureRole} positions.`,
        icon: <Lightbulb className="h-6 w-6 text-blue-400" />,
        timeframe: "Month 2-3",
      })

      // Final milestone
      steps.push({
        title: `Transition to ${formData.futureRole}`,
        description: `Complete your transition plan and start applying for ${formData.futureRole} positions or negotiate a promotion.`,
        icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
        timeframe: `Month ${getTimeframeLabel().split(" ")[0]}`,
      })
    }

    return steps
  }

  const roadmapSteps = generateRoadmapSteps()
  const skills = getSkillsForRole()
  const functionalSkills = skills.filter((skill) => skill.type === "functional")
  const softSkills = skills.filter((skill) => skill.type === "soft")
  const bookRecommendations = getBookRecommendations()

  // Update the getConsultantInfo function
  const getConsultantInfo = () => {
    if (selectedConsultantType === "custom") {
      return {
        title: `What is ${consultantInput} ${formData.futureRole}?`,
        description: `${consultantInput} ${formData.futureRole.toLowerCase()}s provide specialized expertise in the ${consultantInput.toLowerCase()} field, helping organizations improve their operations and achieve their goals.`,
      }
    }

    if (selectedConsultantType === "unknown") {
      return {
        title: `Unsure About Your Career Path?`,
        description: `It's completely normal to feel uncertain about your career direction. Many successful professionals have changed paths multiple times before finding their ideal role.`,
        resources: "Career Assessment, Personality Tests, Career Counseling",
      }
    }

    // Find the selected sub-role
    const selectedRole = consultantTypes.find((type) => type.id === selectedConsultantType)

    if (selectedRole) {
      return {
        title: `What is a ${selectedRole.label}?`,
        description: selectedRole.description,
      }
    }

    // Default fallback
    return {
      title: `What is a ${formData.futureRole}?`,
      description: `A ${formData.futureRole.toLowerCase()} provides expert advice to organizations to help them improve their performance, solve problems, and achieve their goals.`,
    }
  }

  const consultantInfo = getConsultantInfo()

  const handleResetForm = () => {
    tracker?.event("reset_roadmap", {
      fromRole: formData.currentRole,
      toRole: formData.futureRole,
      timeframe: formData.timeframe,
    })

    // Navigate back to the generator page
    router.push("/")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] flex flex-col p-4 md:p-8"
    >
      <div className="max-w-4xl w-full mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Link
            href="/"
            onClick={() => {
              // Store the current form data for the generator to use
              setLocalStorage(
                "savedFormData",
                JSON.stringify({
                  currentRole: formData.currentRole,
                  futureRole: formData.futureRole,
                  timeframe: formData.timeframe,
                  location: formData.location,
                  city: formData.city || "",
                  priority: formData.priority,
                  mentorStyle: formData.mentorStyle,
                  // Add flag to indicate this is from a back navigation
                  fromRoadmap: true,
                }),
              )
            }}
          >
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Generator
            </Button>
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-400">Your Career Roadmap</h1>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Your Career Journey
              {roadmapSource && roadmapSource !== formData.futureRole && (
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center justify-center rounded-full bg-blue-500/10 p-1 hover:bg-blue-500/20 transition-colors cursor-help">
                        <Info className="h-4 w-4 text-blue-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-zinc-800 text-white border border-zinc-700 p-3 rounded-md shadow-lg max-w-xs"
                    >
                      <p className="text-sm">
                        We're using the <span className="font-bold text-blue-400">{roadmapSource}</span> roadmap as a
                        template.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h2>
            <p className="text-lg text-gray-300">
              From <span className="font-bold text-blue-400">{formData.currentRole}</span> to{" "}
              <span className="font-bold text-purple-500">{formData.futureRole}</span> in{" "}
              <span className="font-bold text-blue-400">{getTimeframeLabel()}</span>, working in{" "}
              <span className="font-bold text-purple-500">{getLocationDisplay()}</span>, prioritizing{" "}
              <span className="font-bold text-blue-400">{getPriorityLabel()}</span> with a{" "}
              <span className="font-bold text-purple-500">{getMentorStyleLabel()}</span> mentoring approach.
            </p>
          </div>
        </motion.div>

        <div className="bg-zinc-900 rounded-xl p-6 md:p-8 shadow-lg border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-6">Your Action Plan</h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader className="h-8 w-8 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-300">Loading your personalized roadmap...</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-600 hidden md:block"></div>

              {/* Steps */}
              <div className="space-y-8">
                {roadmapSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex flex-col md:flex-row gap-4"
                  >
                    <div className="flex-shrink-0 flex md:flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center z-10 border-2 border-blue-500">
                        {step.icon}
                      </div>
                      <div className="ml-4 md:ml-8 md:mt-2 text-sm font-medium text-gray-400 md:w-24">
                        {step.timeframe}
                      </div>
                    </div>
                    <div className="flex-grow bg-black rounded-lg p-5 border border-zinc-800 hover:border-blue-500/50 transition-colors">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => step.learningResources && toggleExpandedStep(index)}
                      >
                        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                        {step.learningResources && (
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                            {expandedStep === index ? "Hide Resources" : "Show Resources"}
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-300">{step.description}</p>

                      {/* Learning Resources Section */}
                      {step.learningResources && expandedStep === index && (
                        <div className="mt-6 space-y-6 border-t border-zinc-800 pt-4">
                          {/* Articles */}
                          {step.resources?.articles && step.resources.articles.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-md font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-400" />
                                <span>Articles & Documentation</span>
                              </h4>
                              <div className="space-y-3">
                                {step.resources.articles.map((article, idx) => (
                                  <div key={idx} className="bg-zinc-800 rounded-md p-3">
                                    <h5 className="font-medium text-white">{article.title}</h5>
                                    {article.publication && (
                                      <p className="text-sm text-gray-400">Source: {article.publication}</p>
                                    )}
                                    {article.link && (
                                      <a
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Read Article
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Videos */}
                          {step.resources?.videos && step.resources.videos.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-md font-semibold flex items-center gap-2">
                                <Video className="h-5 w-5 text-red-400" />
                                <span>Video Tutorials</span>
                              </h4>
                              <div className="space-y-3">
                                {step.resources.videos.map((video, idx) => (
                                  <div key={idx} className="bg-zinc-800 rounded-md p-3">
                                    <h5 className="font-medium text-white">{video.title}</h5>
                                    {video.creator && <p className="text-sm text-gray-400">Creator: {video.creator}</p>}
                                    {video.link && (
                                      <a
                                        href={video.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1 mt-2"
                                      >
                                        <Youtube className="h-3 w-3" />
                                        Watch Video
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Courses */}
                          {step.resources?.courses && step.resources.courses.length > 0 && (
                            <div className="bg-zinc-900 rounded-lg p-4">
                              <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                                <Laptop className="h-5 w-5 text-blue-400" />
                                <span>Recommended Courses</span>
                              </h4>
                              <div className="space-y-3">
                                {step.resources.courses.map((course, idx) => (
                                  <div key={idx} className="flex flex-col md:flex-row gap-3">
                                    <div className="bg-zinc-800 rounded-md p-3 flex-grow">
                                      <h5 className="font-medium text-white">{course.title}</h5>
                                      {course.platform && (
                                        <p className="text-sm text-gray-400">Platform: {course.platform}</p>
                                      )}
                                    </div>
                                    {course.link && (
                                      <a
                                        href={course.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md text-sm flex items-center gap-2 justify-center md:w-32"
                                        onClick={() => {
                                          tracker?.event("resource_clicked", {
                                            resourceType: "course",
                                            resourceTitle: course.title,
                                            resourcePlatform: course.platform,
                                            stepTitle: roadmapSteps[expandedStep]?.title,
                                            futureRole: formData.futureRole,
                                          })
                                        }}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        View Course
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Books */}
                          {step.resources?.books && step.resources.books.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-md font-semibold flex items-center gap-2">
                                <BookIcon className="h-5 w-5 text-amber-400" />
                                <span>Book Recommendations</span>
                              </h4>
                              <div className="space-y-3">
                                {step.resources.books.map((book, idx) => (
                                  <div key={idx} className="bg-zinc-800 rounded-md p-3">
                                    <h5 className="font-medium text-white">{book.title}</h5>
                                    {book.author && <p className="text-sm text-gray-400">by {book.author}</p>}
                                    {book.link && (
                                      <a
                                        href={book.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2"
                                        onClick={() => {
                                          tracker?.event("resource_clicked", {
                                            resourceType: "book",
                                            resourceTitle: book.title,
                                            resourceAuthor: book.author,
                                            stepTitle: roadmapSteps[expandedStep]?.title,
                                            futureRole: formData.futureRole,
                                          })
                                        }}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        View Book
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Podcasts */}
                          {step.resources?.podcasts && step.resources.podcasts.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-md font-semibold flex items-center gap-2">
                                <Headphones className="h-5 w-5 text-purple-400" />
                                <span>Podcasts</span>
                              </h4>
                              <div className="space-y-3">
                                {step.resources.podcasts.map((podcast, idx) => (
                                  <div key={idx} className="bg-zinc-800 rounded-md p-3">
                                    <h5 className="font-medium text-white">{podcast.title}</h5>
                                    {podcast.host && <p className="text-sm text-gray-400">Host: {podcast.host}</p>}
                                    {podcast.link && (
                                      <a
                                        href={podcast.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Listen
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Projects */}
                          {step.projects && step.projects.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-md font-semibold flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                <span>Suggested Projects</span>
                              </h4>
                              <div className="bg-zinc-800 rounded-md p-3">
                                <ul className="list-disc list-inside space-y-2 text-gray-300">
                                  {step.projects.map((project, idx) => (
                                    <li key={idx}>{project}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Interactive career exploration for the first step */}
                      {index === 0 && (
                        <div className="mt-4">
                          <div className="bg-zinc-900 rounded-lg p-4 mt-2">
                            <div className="flex flex-col gap-4">
                              <div>
                                <p className="text-xl font-semibold mb-4">
                                  I want to be a <span className="text-purple-500">{formData.futureRole}</span> in
                                </p>

                                {/* Default selection buttons */}
                                <div className="space-y-2">
                                  {isLoadingSubRoles ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader className="h-5 w-5 text-blue-400 animate-spin" />
                                      <span className="ml-2 text-gray-400">Loading specializations...</span>
                                    </div>
                                  ) : (
                                    consultantTypes.map((type) => (
                                      <div key={type.id} className="space-y-2">
                                        <button
                                          onClick={() => {
                                            tracker?.event("role_option_clicked", {
                                              optionId: type.id,
                                              optionLabel: type.label,
                                              futureRole: formData.futureRole,
                                              currentRole: formData.currentRole,
                                            })
                                            setSelectedConsultantType(
                                              selectedConsultantType === type.id ? null : type.id,
                                            )
                                          }}
                                          className="flex items-center text-left w-full hover:bg-zinc-800 p-2 rounded-md transition-colors"
                                        >
                                          <ChevronRight
                                            className={`h-4 w-4 mr-2 text-gray-400 transform transition-transform duration-200 ${
                                              selectedConsultantType === type.id ? "rotate-90" : ""
                                            }`}
                                          />
                                          <span>{type.label}</span>
                                        </button>

                                        {selectedConsultantType === type.id && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="ml-6 pl-4 border-l border-zinc-700"
                                          >
                                            <div className="bg-[#141414] rounded-lg p-4 space-y-4">
                                              <h3 className="text-lg font-semibold text-white">
                                                {type.id === "custom"
                                                  ? `What is ${consultantInput} ${formData.futureRole}?`
                                                  : type.id === "unknown"
                                                    ? "Unsure About Your Career Path?"
                                                    : `What is a ${type.label}?`}
                                              </h3>
                                              <p className="text-gray-300">
                                                {type.id === "custom"
                                                  ? `${consultantInput} ${formData.futureRole.toLowerCase()}s provide specialized expertise in the ${consultantInput.toLowerCase()} field, helping organizations improve their operations and achieve their goals.`
                                                  : type.id === "unknown"
                                                    ? "It's completely normal to feel uncertain about your career direction. Many successful professionals have changed paths multiple times before finding their ideal role."
                                                    : type.description}
                                              </p>

                                              {type.id === "unknown" && (
                                                <>
                                                  <div className="pt-4 border-t border-zinc-700">
                                                    <h4 className="font-semibold text-white mb-3">
                                                      Why Take a Career Assessment?
                                                    </h4>
                                                    <div className="space-y-3 text-gray-300">
                                                      <p>
                                                        <strong>Discover your natural strengths</strong> - Uncover
                                                        talents and abilities you might not even realize you have.
                                                      </p>
                                                      <p>
                                                        <strong>Find your ideal career match</strong> - Our AI-powered
                                                        assessment analyzes your personality, skills, and preferences to
                                                        identify careers where you'll naturally excel.
                                                      </p>
                                                      <p>
                                                        <strong>Save time and reduce uncertainty</strong> - Instead of
                                                        trial and error, get data-driven insights about which career
                                                        paths align with your unique profile.
                                                      </p>
                                                    </div>
                                                    <a
                                                      href="https://theclassment.com/psychometrics"
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 inline-block text-center rounded-md font-medium"
                                                      onClick={() => {
                                                        tracker?.event("career_assessment_clicked", {
                                                          fromConsultantType: type.id,
                                                          futureRole: formData.futureRole,
                                                        })
                                                      }}
                                                    >
                                                      Take Career Assessment Test
                                                    </a>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Moved to bottom of card */}
                              <div className="mt-6 border-t border-zinc-800 pt-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <a
                                    href="https://theclassment.streamlit.app/Explorer_Lab"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center py-3 border border-zinc-700 bg-black/20 hover:bg-zinc-800 text-white hover:text-white rounded-lg font-medium transition-colors"
                                    onClick={() =>
                                      tracker?.event("explorer_graphs_clicked", {
                                        futureRole: formData.futureRole,
                                        currentRole: formData.currentRole,
                                      })
                                    }
                                  >
                                    Explore Other Career Options
                                  </a>
                                  <div className="flex flex-col">
                                    <div className="text-center text-gray-400 mb-2">
                                      Confused about which path to choose?
                                    </div>
                                    <Link
                                      href="/booking"
                                      className="w-full text-center py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25"
                                      onClick={() => {
                                        tracker?.event("confused_button_clicked", {
                                          futureRole: formData.futureRole,
                                          currentRole: formData.currentRole,
                                        })
                                        handleConsultantTypeClick("unknown")
                                      }}
                                    >
                                      <span>Book a FREE 15-minute call with a Career Counsellor</span>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-500/20">
            <h3 className="text-xl font-semibold mb-3 text-blue-400 flex items-center gap-2">
              {formData.mentorStyle === "visionary" && <span className="text-xl">🔮</span>}
              {formData.mentorStyle === "practical" && <span className="text-xl">🛠️</span>}
              {formData.mentorStyle === "challenger" && <span className="text-xl">🔥</span>}
              {formData.mentorStyle === "supportive" && <span className="text-xl">🌱</span>}
              {formData.mentorStyle === "analytical" && <span className="text-xl">📊</span>}
              Mentor Advice
            </h3>
            <p className="text-gray-300">
              {formData.mentorStyle === "visionary"
                ? `Imagine yourself as a ${formData.futureRole} in ${getTimeframeLabel()}. The path between where you are now and that vision is full of possibilities. Your experience as a ${formData.currentRole} has already given you unique perspectives that will set you apart. Focus on the big picture and don't get lost in the details.`
                : formData.mentorStyle === "practical"
                  ? `To become a ${formData.futureRole} in ${getTimeframeLabel()}, you need a step-by-step approach. Start by identifying the specific skills gap between your current role and your target. Create weekly milestones, find hands-on projects, and build a portfolio of work that demonstrates your capabilities.`
                  : formData.mentorStyle === "challenger"
                    ? `Let's be honest - becoming a ${formData.futureRole} in ${getTimeframeLabel()} will push you to your limits. You'll need to work harder than most people are willing to. Challenge yourself daily, seek difficult problems to solve, and don't shy away from constructive criticism. Comfort is the enemy of growth.`
                    : formData.mentorStyle === "supportive"
                      ? `Your journey from ${formData.currentRole} to ${formData.futureRole} is a significant transition, but I believe in you! Remember that progress isn't always linear - celebrate small wins, be kind to yourself during setbacks, and remember why you started this journey. Your unique background will be your strength.`
                      : `The data shows that transitioning to a ${formData.futureRole} position in ${getTimeframeLabel()} is achievable with the right approach. Based on industry analysis, professionals who successfully make this transition focus on measurable outcomes and track their progress with key performance indicators. This methodical approach will maximize your chances of success.`}
            </p>
          </div>

          <motion.div
            className="mt-8 flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="text-gray-400 mb-2">Find this roadmap overwhelming?</p>
            <Link
              href="/booking"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full font-bold"
              onClick={() => {
                tracker?.event("talk_to_coach_clicked", {
                  fromRole: formData.currentRole,
                  toRole: formData.futureRole,
                  timeframe: formData.timeframe,
                })
              }}
            >
              Talk to a Career Coach
            </Link>
          </motion.div>

          {/* Add the feedback button here */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowFeedbackDialog(true)}
            >
              Help us improve
            </Button>
          </div>
        </div>
      </div>

      {/* Skill Info Dialog */}
      <Dialog open={showSkillInfo} onOpenChange={setShowSkillInfo}>
        <DialogContentPrimitive className="bg-zinc-900 text-white border-zinc-700 max-w-md">
          <DialogHeaderPrimitive>
            <DialogTitlePrimitive className="text-xl font-bold flex items-center gap-2">
              {selectedSkill?.type === "functional" ? (
                <Brain className="h-5 w-5 text-green-400" />
              ) : (
                <Heart className="h-5 w-5 text-pink-400" />
              )}
              {selectedSkill?.name}
            </DialogTitlePrimitive>
            <DialogDescription className="text-gray-300 mt-2">{selectedSkill?.description}</DialogDescription>

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-md font-semibold mb-2">How to develop this skill:</h4>
              <a
                href={selectedSkill?.learningResource}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm flex items-center gap-2 justify-center w-full mt-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Learning Resource
              </a>
            </div>
          </DialogHeaderPrimitive>
        </DialogContentPrimitive>
      </Dialog>
      {/* Feedback Dialog */}
      <FeedbackDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog} userId={user?.id || null} />
    </motion.div>
  )
}

