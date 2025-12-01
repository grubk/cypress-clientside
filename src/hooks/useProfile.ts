import { useState, useEffect } from 'react'
import { profileService } from '../lib/profiles'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export const useProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    profileService.getProfile(userId)
      .then(({ data }) => setProfile(data))
      .finally(() => setLoading(false))
  }, [userId])

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!userId) return { data: null, error: new Error('No user ID') }
    
    const { data, error } = await profileService.updateProfile(userId, updates)
    if (data && !error) {
      setProfile(data)
    }
    return { data, error }
  }

  return { profile, loading, updateProfile }
}
