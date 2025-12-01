import { supabase } from '../supabaseClient'
import type { Database } from '../types/database.types'

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export const messageService = {
  // Send a message
  sendMessage: async (message: MessageInsert) => {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()
    return { data, error }
  },

  // Get messages between two users
  getConversation: async (userId1: string, userId2: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  // Get all conversations for a user
  getUserConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Subscribe to new messages
  subscribeToMessages: (userId: string, callback: (message: Message) => void) => {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => callback(payload.new as Message)
      )
      .subscribe()
  },
}
