

import { useState, useEffect, useCallback } from 'react';
import { Message, UserModel } from '../types';
import { ChatService } from '../services/chatService';
import { useAppStore } from '../store/useAppStore';

/*
 * useChat Hook
 * 
 * Abstraction Function:
 * Bridges the UI component with the ChatService.
 * Handles optimistic UI updates and history loading.
 */
export const useChat = (connectionId: string) => {
    const { currentUser } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const service = ChatService.getInstance();

    /* Load History & Subscribe */
    useEffect(() => {
        let unsubscribe: () => void;

        const initChat = async () => {
            setIsLoading(true);
            try {
                // 1. Load History
                const history = await service.getHistory(connectionId);
                setMessages(history);

                // 2. Subscribe to new messages (real-time/bot)
                unsubscribe = service.subscribe(connectionId, (incomingMessage) => {
                    setMessages(prev => [...prev, incomingMessage]);
                });
            } catch (err) {
                setError("Failed to load chat.");
            } finally {
                setIsLoading(false);
            }
        };

        if (connectionId) {
            initChat();
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [connectionId]);

    /* Send Message Handler with Optimistic UI */
    const sendMessage = useCallback(async (text: string, imageUrl?: string) => {
        if ((!text.trim() && !imageUrl) || !currentUser) return;

        // 1. Optimistic Update
        const tempId = `temp_${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            senderId: currentUser.uid,
            text: text,
            imageUrl: imageUrl,
            type: imageUrl ? 'image' : 'text',
            timestamp: Date.now(),
            status: 'sending'
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            // 2. Call Service
            const sentMessage = await service.sendMessage(connectionId, currentUser.uid, text, imageUrl);

            // 3. Replace temp message with real confirmed message
            setMessages(prev => 
                prev.map(msg => msg.id === tempId ? sentMessage : msg)
            );
        } catch (e) {
            // 4. Handle Error
            setMessages(prev => 
                prev.map(msg => msg.id === tempId ? { ...msg, status: 'error' } : msg)
            );
        }
    }, [connectionId, currentUser]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        currentUserId: currentUser?.uid
    };
};