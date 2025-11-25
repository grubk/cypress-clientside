
import { Message } from '../types';
import { DataRepository } from './dataRepository';

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
                // Feature 2: Special history for Bot
                if (connectionId === 'cypress_bot') {
                    resolve([
                        {
                            id: 'msg_bot_intro',
                            senderId: 'cypress_bot',
                            text: 'Hi! I am the Cypress Bot 🤖. Ask me "How to use" or about "Privacy"!',
                            type: 'text',
                            timestamp: Date.now() - 1000 * 60 * 60 * 24,
                            status: 'sent'
                        }
                    ]);
                    return;
                }

                // Fix 2: Special history for Team
                if (connectionId === 'cypress_team') {
                    resolve([
                        {
                            id: 'msg_team_intro',
                            senderId: 'cypress_team',
                            text: 'Welcome to Cypress! We are the development team. Please reply to this message with any feedback or suggestions you have for the app!',
                            type: 'text',
                            timestamp: Date.now() - 1000 * 60 * 60 * 5,
                            status: 'sent'
                        }
                    ]);
                    return;
                }

                // Mock history for others
                const history: Message[] = [
                    {
                        id: 'msg_1',
                        senderId: connectionId, // The other person
                        text: 'Hey! I saw you like hiking too?',
                        type: 'text',
                        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
                        status: 'sent'
                    }
                ];
                resolve(history);
            }, 500); 
        });
    }

    /*
     * Send a message.
     * Simulates network request and triggers a bot reply.
     */
    public async sendMessage(connectionId: string, senderId: string, text: string, imageUrl?: string): Promise<Message> {
        return new Promise((resolve) => {
            // Simulate network latency (300ms)
            setTimeout(() => {
                const newMessage: Message = {
                    id: `msg_${Date.now()}`,
                    senderId: senderId,
                    text: text,
                    imageUrl: imageUrl,
                    type: imageUrl ? 'image' : 'text',
                    timestamp: Date.now(),
                    status: 'sent'
                };

                resolve(newMessage);
                
                // Trigger Bot Reply
                if (connectionId === 'cypress_bot') {
                    this.triggerSupportBotReply(connectionId, text);
                } else if (connectionId === 'cypress_team') {
                    // Fix 2: Trigger Team Feedback Reply
                    this.triggerTeamFeedbackReply(connectionId, senderId, text);
                } else {
                    this.triggerBotReply(connectionId);
                }

            }, 300);
        });
    }

    private triggerSupportBotReply(connectionId: string, userText: string) {
        setTimeout(() => {
            let replyText = "I'm not sure I understand. Try asking about 'privacy', 'how to use', or 'matches'.";
            const lower = userText.toLowerCase();

            if (lower.includes('how to use') || lower.includes('help')) {
                replyText = "It's easy! Go to 'Discover' to find students. Swipe Right to connect, Left to pass. If they swipe back, it's a match! 🌲";
            } else if (lower.includes('privacy') || lower.includes('data')) {
                replyText = "We take privacy seriously. Your data is currently stored locally on your device for this demo. You can toggle your visibility in Settings. 🔒";
            } else if (lower.includes('match') || lower.includes('friend')) {
                replyText = "Matches are based on shared majors, interests, and languages. Make sure your profile is complete to get the best matches! 🤝";
            } else if (lower.includes('hello') || lower.includes('hi')) {
                replyText = "Beep boop! Hello there! 👋";
            }

            const botMessage: Message = {
                id: `msg_${Date.now()}_bot`,
                senderId: connectionId,
                text: replyText,
                type: 'text',
                timestamp: Date.now(),
                status: 'sent'
            };

            const subs = this.listeners.get(connectionId);
            if (subs) subs.forEach(cb => cb(botMessage));
        }, 1500);
    }

    // Fix 2: Team Auto-Reply and Feedback Collection
    private async triggerTeamFeedbackReply(connectionId: string, senderId: string, text: string) {
        // Save Feedback to DB
        await DataRepository.getInstance().saveFeedback(senderId, text);

        setTimeout(() => {
            const botMessage: Message = {
                id: `msg_${Date.now()}_team`,
                senderId: connectionId,
                text: "Thanks for your feedback! We've recorded it in our database and will use it to improve Cypress. 🌲",
                type: 'text',
                timestamp: Date.now(),
                status: 'sent'
            };

            const subs = this.listeners.get(connectionId);
            if (subs) {
                subs.forEach(cb => cb(botMessage));
            }
        }, 2000);
    }

    private triggerBotReply(connectionId: string) {
        setTimeout(() => {
            const botMessage: Message = {
                id: `msg_${Date.now()}_bot`,
                senderId: connectionId,
                text: "That sounds awesome! We should definitely organize a trip sometime soon.",
                type: 'text',
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
