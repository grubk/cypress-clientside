import { useState, useEffect } from 'react'
import { messageService } from '../lib/messages'
import type { Database } from '../types/database.types'

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export const useMessages = (userId: string | null, otherUserId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !otherUserId) {
      setMessages([])
      setLoading(false)
      return
    }

    // Load initial messages
    messageService.getConversation(userId, otherUserId)
      .then(({ data }) => setMessages(data || []))
      .finally(() => setLoading(false))

    // Subscribe to new messages
    const subscription = messageService.subscribeToMessages(userId, (newMessage) => {
      if (newMessage.sender_id === otherUserId || newMessage.receiver_id === otherUserId) {
        setMessages(prev => [...prev, newMessage])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, otherUserId])

  const sendMessage = async (text: string, imageUrl?: string) => {
    if (!userId || !otherUserId) return { data: null, error: new Error('Missing user IDs') }

    const message: MessageInsert = {
      sender_id: userId,
      receiver_id: otherUserId,
      text,
      image_url: imageUrl,
      type: imageUrl ? 'image' : 'text',
    }

    const { data, error } = await messageService.sendMessage(message)
    if (data && !error) {
      setMessages(prev => [...prev, data])
    }
    return { data, error }
  }

  return { messages, loading, sendMessage }
}
