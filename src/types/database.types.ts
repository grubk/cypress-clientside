export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          major: string | null
          bio: string | null
          interests: string[] | null
          languages: string[] | null
          home_region: string | null
          photo_url: string | null
          is_searchable: boolean | null
          settings: {
            general: boolean
            dailyMatches: boolean
            directMessages: boolean
          } | null
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          major?: string | null
          bio?: string | null
          interests?: string[] | null
          languages?: string[] | null
          home_region?: string | null
          photo_url?: string | null
          is_searchable?: boolean | null
          settings?: {
            general: boolean
            dailyMatches: boolean
            directMessages: boolean
          } | null
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          major?: string | null
          bio?: string | null
          interests?: string[] | null
          languages?: string[] | null
          home_region?: string | null
          photo_url?: string | null
          is_searchable?: boolean | null
          settings?: {
            general: boolean
            dailyMatches: boolean
            directMessages: boolean
          } | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          text: string | null
          image_url: string | null
          type: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          text?: string | null
          image_url?: string | null
          type?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          text?: string | null
          image_url?: string | null
          type?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      connections: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: 'PENDING' | 'CONNECTED' | 'DISMISSED' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status: 'PENDING' | 'CONNECTED' | 'DISMISSED' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          requester_id?: string
          receiver_id?: string
          status?: 'PENDING' | 'CONNECTED' | 'DISMISSED' | null
          created_at?: string | null
        }
      }
    }
  }
}
