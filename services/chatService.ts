import { Message } from '../types';
import { supabase } from './supabaseClient';

type MessageListener = (message: Message) => void;

/*
 * ChatService
 * 
 * Abstraction Function:
 * Manages the connection for real-time messaging using Supabase Realtime.
 */
export class ChatService {
    private static instance: ChatService;
    private activeSubscription: any = null;

    private constructor() {}

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    /*
     * Subscribe to incoming messages for a specific conversation.
     */
    public subscribe(connectionId: string, callback: MessageListener): () => void {
        // Remove existing sub if any
        if (this.activeSubscription) {
            this.activeSubscription.unsubscribe();
        }

        // Subscribe to INSERT events on messages table
        // Filter where sender is the connectionId
        this.activeSubscription = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${connectionId}`,
                },
                async (payload) => {
                    const newMsg = payload.new;
                    
                    // Security/Logic Check: Verify the message is actually sent TO me.
                    // Without this, if User A (Connection) sends a message to User B,
                    // I (User C) might receive it if I am also subscribed to User A.
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (user && newMsg.receiver_id === user.id) {
                         const message: Message = {
                            id: newMsg.id.toString(),
                            senderId: newMsg.sender_id,
                            text: newMsg.content,
                            imageUrl: newMsg.image_url,
                            type: newMsg.image_url ? 'image' : 'text',
                            timestamp: new Date(newMsg.created_at).getTime(),
                            status: 'sent'
                        };
                        callback(message);
                    }
                }
            )
            .subscribe();

        // Return unsubscribe function
        return () => {
            if (this.activeSubscription) {
                supabase.removeChannel(this.activeSubscription);
                this.activeSubscription = null;
            }
        };
    }

    /*
     * Fetch initial history from DB.
     */
    public async getHistory(connectionId: string): Promise<Message[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        if (connectionId === 'cypress_bot' || connectionId === 'cypress_team') {
             return [{
                id: 'bot_intro',
                senderId: connectionId,
                text: "Welcome to Cypress! (System Message)",
                type: 'text',
                timestamp: Date.now(),
                status: 'sent'
             }];
        }

        // Fetch messages between Me and Them
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${connectionId}),and(sender_id.eq.${connectionId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error || !data) return [];

        return data.map((row: any) => ({
            id: row.id.toString(),
            senderId: row.sender_id,
            text: row.content,
            imageUrl: row.image_url,
            type: row.image_url ? 'image' : 'text',
            timestamp: new Date(row.created_at).getTime(),
            status: 'sent'
        }));
    }

    /*
     * Send a message to DB.
     */
    public async sendMessage(connectionId: string, senderId: string, text: string, imageUrl?: string): Promise<Message> {
        
        if (connectionId === 'cypress_bot' || connectionId === 'cypress_team') {
            return {
                id: Math.random().toString(),
                senderId,
                text,
                type: 'text',
                timestamp: Date.now(),
                status: 'sent'
            };
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: connectionId,
                content: text,
                image_url: imageUrl
            })
            .select()
            .single();

        if (error || !data) {
            console.error("Send error", error);
            throw new Error("Failed to send message");
        }

        return {
            id: data.id.toString(),
            senderId: data.sender_id,
            text: data.content,
            imageUrl: data.image_url,
            type: data.image_url ? 'image' : 'text',
            timestamp: new Date(data.created_at).getTime(),
            status: 'sent'
        };
    }
}