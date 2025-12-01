import { useState, useEffect } from 'react'
import { connectionService } from '../lib/connections'
import type { Database } from '../types/database.types'

type Connection = Database['public']['Tables']['connections']['Row']

export const useConnections = (userId: string | null) => {
  const [connections, setConnections] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!userId) {
      setConnections([])
      setPendingRequests([])
      setLoading(false)
      return
    }

    const [connectionsRes, requestsRes] = await Promise.all([
      connectionService.getUserConnections(userId),
      connectionService.getPendingRequests(userId),
    ])

    setConnections(connectionsRes.data || [])
    setPendingRequests(requestsRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const sendRequest = async (receiverId: string) => {
    const result = await connectionService.sendRequest(receiverId)
    await loadData() // Refresh data
    return result
  }

  const acceptRequest = async (connectionId: string) => {
    const result = await connectionService.acceptRequest(connectionId)
    await loadData() // Refresh data
    return result
  }

  const dismissRequest = async (connectionId: string) => {
    const result = await connectionService.dismissRequest(connectionId)
    await loadData() // Refresh data
    return result
  }

  return {
    connections,
    pendingRequests,
    loading,
    sendRequest,
    acceptRequest,
    dismissRequest,
  }
}
