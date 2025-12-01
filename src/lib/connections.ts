import { supabase } from '../supabaseClient'
import type { Database } from '../types/database.types'

type Connection = Database['public']['Tables']['connections']['Row']
type ConnectionInsert = Database['public']['Tables']['connections']['Insert']

export const connectionService = {
  // Send connection request
  sendRequest: async (receiverId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
        status: 'PENDING',
      })
      .select()
      .single()
    return { data, error }
  },

  // Accept connection request
  acceptRequest: async (connectionId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'CONNECTED' })
      .eq('id', connectionId)
      .select()
      .single()
    return { data, error }
  },

  // Dismiss connection request
  dismissRequest: async (connectionId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'DISMISSED' })
      .eq('id', connectionId)
      .select()
      .single()
    return { data, error }
  },

  // Get user's connections
  getUserConnections: async (userId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .select('*, profiles!connections_receiver_id_fkey(*)')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'CONNECTED')
    return { data, error }
  },

  // Get pending requests
  getPendingRequests: async (userId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .select('*, profiles!connections_requester_id_fkey(*)')
      .eq('receiver_id', userId)
      .eq('status', 'PENDING')
    return { data, error }
  },
}
