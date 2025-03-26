"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useTracker } from "@/hooks/use-tracker"
import { CheckCircle } from "lucide-react"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
}

export function FeedbackDialog({ open, onOpenChange, userId }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()
  const tracker = useTracker()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide some feedback before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Track feedback submission
      tracker?.event("feedback_submitted", {
        userId: userId || "anonymous",
        providedPhoneNumber: phoneNumber ? true : false,
      })

      // Insert feedback into Supabase
      const { error } = await supabase.from("roadmap_feedback").insert({
        user_id: userId || null,
        feedback: feedback.trim(),
        phone_number: phoneNumber.trim() || null,
      })

      if (error) throw error

      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve the platform.",
      })

      // Show success state instead of closing
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Something went wrong",
        description: "We couldn't save your feedback. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset the form state after closing
    setTimeout(() => {
      setIsSubmitted(false)
      setFeedback("")
      setPhoneNumber("")
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border rounded-2xl shadow-soft max-w-md">
        {isSubmitted ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-bold mb-2">Thank You for Your Feedback!</DialogTitle>
            <DialogDescription className="text-subtext mb-6">
              Your insights are incredibly valuable to us. They'll directly help us improve and create better career
              tools for everyone.
            </DialogDescription>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">We'd Love Your Feedback!</DialogTitle>
              <DialogDescription className="text-subtext">
                You're a valued beta tester, and your feedback directly shapes the future of this product.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Help us improve</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Tell us your thoughts about the roadmap generator tool.
                </p>
                <Textarea
                  placeholder="What did you like? Did you find it helpful? What could we do better?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[120px] bg-muted border border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone number (optional)</label>
                <p className="text-xs text-muted-foreground">
                  Please drop in your number for a quick feedback call, we will just take 10 minutes. We promise.
                </p>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-muted border border-border"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Skip
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

