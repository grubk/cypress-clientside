
import { Message } from '../types';

type MessageListener = (message: Message) => void;

/*
 * ChatService
 * 
 * Abstraction Function:
 * Manages the "WebSocket" connection for real-time messaging.
 * Currently mocks network latency and auto-replies.
 */
export class ChatService {
    private static instance: ChatService;
    private listeners: Map<string, MessageListener[]> = new Map();

    private constructor() {}

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    /*
     * Subscribe to incoming messages for a specific chat room/connection.
     */
    public subscribe(connectionId: string, callback: MessageListener): () => void {
        if (!this.listeners.has(connectionId)) {
            this.listeners.set(connectionId, []);
        }
        this.listeners.get(connectionId)?.push(callback);

        // Return unsubscribe function
        return () => {
            const subs = this.listeners.get(connectionId) || [];
            this.listeners.set(connectionId, subs.filter(cb => cb !== callback));
        };
    }

    /*
     * Fetch initial history.
     */
    public async getHistory(connectionId: string): Promise<Message[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock history
                const history: Message[] = [
                    {
                        id: 'msg_1',
                        senderId: connectionId, // The other person
                        text: 'Hey! I saw you like hiking too?',
                        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
                        status: 'sent'
                    },
                    {
                        id: 'msg_2',
                        senderId: connectionId,
                        text: 'Have you been to Garibaldi Lake?',
                        timestamp: Date.now() - 1000 * 60 * 60 * 2 + 5000,
                        status: 'sent'
                    }
                ];
                resolve(history);
            }, 500); // 500ms load time
        });
    }

    /*
     * Send a message.
     * Simulates network request and triggers a bot reply.
     */
    public async sendMessage(connectionId: string, senderId: string, text: string): Promise<Message> {
        return new Promise((resolve) => {
            // Simulate network latency (300ms)
            setTimeout(() => {
                const newMessage: Message = {
                    id: `msg_${Date.now()}`,
                    senderId: senderId,
                    text: text,
                    timestamp: Date.now(),
                    status: 'sent'
                };

                resolve(newMessage);
                
                // Trigger Bot Reply after 2 seconds
                this.triggerBotReply(connectionId);

            }, 300);
        });
    }

    private triggerBotReply(connectionId: string) {
        setTimeout(() => {
            const botMessage: Message = {
                id: `msg_${Date.now()}_bot`,
                senderId: connectionId,
                text: "That sounds awesome! We should definitely organize a trip sometime soon.",
                timestamp: Date.now(),
                status: 'sent'
            };

            // Notify listeners
            const subs = this.listeners.get(connectionId);
            if (subs) {
                subs.forEach(cb => cb(botMessage));
            }
        }, 2000);
    }
}