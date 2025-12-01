import { useState, useEffect } from 'react'
import { authService } from '../lib/auth'
import { profileService } from '../lib/profiles'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(setUser)

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, profileData?: any) => {
    const { data, error } = await authService.signUp(email, password)
    if (data?.user && !error) {
      // Create profile after signup
      await profileService.createProfile({
        id: data.user.id,
        email: data.user.email,
        ...profileData,
      })
    }
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    return await authService.signIn(email, password)
  }

  const signOut = async () => {
    return await authService.signOut()
  }

  return { user, loading, signUp, signIn, signOut }
}
