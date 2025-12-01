import { supabase } from '../supabaseClient'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export const profileService = {
  // Get profile by user ID
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Create profile
  createProfile: async (profile: ProfileInsert) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
    return { data, error }
  },

  // Update profile
  updateProfile: async (userId: string, updates: ProfileUpdate) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Get all searchable profiles
  getSearchableProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_searchable', true)
    return { data, error }
  },
}
