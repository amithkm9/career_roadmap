"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface SubRole {
  id: string
  label: string
  description: string
}

export function useSubRoles(role: string) {
  const [subRoles, setSubRoles] = useState<SubRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubRoles() {
      if (!role) {
        setSubRoles([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("roles").select("sub_role, description").eq("role", role)

        if (error) throw error

        setSubRoles(
          data?.map((item) => ({
            id: item.sub_role.toLowerCase().replace(/\s+/g, ""),
            label: item.sub_role,
            description: item.description,
          })) || [],
        )
      } catch (err) {
        console.error("Error fetching sub-roles:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubRoles()
  }, [role])

  return { subRoles, isLoading, error }
}

