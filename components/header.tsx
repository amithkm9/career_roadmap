"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, LogOut, UserIcon } from "lucide-react"
import { LoginDialog } from "@/components/login-dialog"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTracker } from "@/hooks/use-tracker"
import { useRouter } from "next/navigation"

export function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const tracker = useTracker()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      // Set user ID in tracker if user is logged in
      if (session?.user?.email && tracker) {
        tracker.setUserID(session.user.email)
      }

      setLoading(false)

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null)

        // Update user ID in tracker when auth state changes
        if (session?.user?.email && tracker) {
          tracker.setUserID(session.user.email)
        } else if (!session?.user && tracker) {
          // Clear user ID when logged out
          tracker.setUserID(null)
        }
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }

    checkUser()
  }, [tracker])

  const handleSignOut = async () => {
    tracker?.event("user_signed_out", {
      userId: user?.id,
      userEmail: user?.email,
    })

    // Clear the user ID from the tracker
    if (tracker) {
      tracker.setUserID(null)
    }

    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b border-[#222222] h-14">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Left side with logo and navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-r0EXXW9jRphHeiD36UP8ZvuARCRiyD.png"
              alt="ClassMent Logo"
              className="h-7 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="https://theclassment.com/"
              className="text-[#8F9094] hover:text-[#4C8BF5] transition-colors text-sm"
            >
              Home
            </Link>
            <Link
              href="https://theclassment.vercel.app/login"
              className="text-[#8F9094] hover:text-[#4C8BF5] transition-colors text-sm"
            >
              Career Manager
            </Link>
            <Link
              href="https://theclassment.com/psychometrics"
              className="text-[#8F9094] hover:text-[#4C8BF5] transition-colors text-sm"
            >
              Psychometrics
            </Link>
            <Link
              href="https://theclassment.com/aboutus"
              className="text-[#8F9094] hover:text-[#4C8BF5] transition-colors text-sm"
            >
              About Us
            </Link>
          </nav>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-4">
          {!user ? (
            <Button
              variant="ghost"
              onClick={() => setIsLoginOpen(true)}
              className="text-[#8F9094] bg-[#141414] hover:bg-[#1a1a1a] hover:text-[#4C8BF5] border border-[#2a2a2a]"
            >
              Login
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-[#8F9094] hover:text-[#4C8BF5]">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span className="max-w-[150px] truncate">{user.email}</span>
                  <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#141414] border border-[#222222] text-[#8F9094]">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#222222]" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="hover:bg-[#1a1a1a] hover:text-[#4C8BF5] cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            className="bg-[#4C8BF5] hover:bg-[#4C8BF5]/90 text-white hidden md:inline-flex"
            onClick={() => {
              if (user) {
                // If user is logged in, navigate to booking page
                router.push("/booking")
              } else {
                // If not logged in, show login modal
                setIsLoginOpen(true)
                tracker?.event("login_prompt_for_booking", {
                  source: "header_consultation_button",
                })
              }
            }}
          >
            Book Consultation
          </Button>
        </div>
      </div>

      {/* Login Dialog with OTP verification */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  )
}

