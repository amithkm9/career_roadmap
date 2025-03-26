"use client"

import { useState, useEffect } from "react"
import { Mail, Loader2, KeyRound } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTracker } from "@/hooks/use-tracker"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { toast } = useToast()
  const tracker = useTracker()

  // Check if user is already logged in and set tracker user ID
  useEffect(() => {
    const checkUserAndSetTracker = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.email && tracker) {
        tracker.setUserID(session.user.email)
      }
    }

    checkUserAndSetTracker()
  }, [tracker])

  const handleSendOtp = async (e) => {
    e.preventDefault()

    if (!email) return

    setIsLoading(true)
    tracker?.event("login_otp_requested", { email })

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        tracker?.event("login_otp_error", {
          email,
          error: error.message,
        })
        throw error
      }

      tracker?.event("login_otp_sent", { email })

      toast({
        title: "OTP sent!",
        description: "Check your email for the verification code.",
        variant: "default",
      })

      setShowOtpInput(true)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()

    if (!email || !otp) return

    setIsLoading(true)
    tracker?.event("login_otp_verification_attempted", { email })

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      })

      if (error) {
        tracker?.event("login_otp_verification_error", {
          email,
          error: error.message,
        })
        throw error
      }

      tracker?.event("login_successful", { email })

      // Set the user ID in the tracker for better user identification
      if (tracker) {
        tracker.setUserID(email)
      }

      toast({
        title: "Success!",
        description: "You have been logged in successfully.",
        variant: "default",
      })

      onOpenChange(false)
      setShowOtpInput(false)
      setOtp("")
      setEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    tracker?.event("google_login_attempted")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        tracker?.event("google_login_error", { error: error.message })
        throw error
      }

      tracker?.event("google_login_redirect")
      // The user will be redirected to Google for authentication,
      // so we don't need to handle success here
      // User ID will be set in the useEffect when they return
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      })
      setIsGoogleLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-card border-border rounded-2xl shadow-soft"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{showOtpInput ? "Verify OTP" : "Login to ClassMent"}</DialogTitle>
          <DialogDescription className="text-subtext">
            {showOtpInput
              ? "Enter the verification code sent to your email"
              : "Sign in to access your personalized career roadmap"}
          </DialogDescription>
        </DialogHeader>

        {!showOtpInput ? (
          <>
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-5 border-zinc-700 hover:bg-zinc-800"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

            <div className="flex items-center gap-2 my-4">
              <Separator className="flex-1 bg-zinc-700" />
              <span className="text-xs text-zinc-400">OR</span>
              <Separator className="flex-1 bg-zinc-700" />
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-subtleblue" />
                  <label className="text-sm font-medium">Email</label>
                </div>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-subtleblue to-softpurple hover:from-subtleblue/90 hover:to-softpurple/90 text-white rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-subtleblue" />
                <label className="text-sm font-medium">Verification Code</label>
              </div>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-field"
                required
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-subtleblue to-softpurple hover:from-subtleblue/90 hover:to-softpurple/90 text-white rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Login"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowOtpInput(false)}
                className="text-sm text-subtleblue hover:text-subtleblue/80"
              >
                Back to email input
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

