import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { DataRepository } from '../services/dataRepository';
import { UserModel, Message } from '../types';
import { useAppStore } from '../store/useAppStore';
import { TRANSLATIONS } from '../utils/translations';

/*
 * ChatView
 * 
 * Abstraction Function:
 * Renders the conversation interface between the current user and a connection.
 * Handles auto-scrolling, message grouping, and input capture.
 */
export const ChatView: React.FC = () => {
    const { uid } = useParams<{ uid: string }>();
    const navigate = useNavigate();
    const [recipient, setRecipient] = useState<Partial<UserModel> | null>(null);
    const [inputText, setInputText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Core Logic Hook
    const { messages, isLoading, sendMessage, currentUserId } = useChat(uid || '');
    const { uiLanguage } = useAppStore();
    const t = TRANSLATIONS[uiLanguage];
    
    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch Recipient Details for Header
    useEffect(() => {
        const fetchUser = async () => {
            if (uid) {
                const user = await DataRepository.getInstance().getUser(uid);
                setRecipient(user);
            }
        };
        fetchUser();
    }, [uid]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (inputText.trim()) {
            sendMessage(inputText);
            setInputText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle Image Upload
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Resize/Process image logic could go here
                const imageUrl = reader.result as string;
                sendMessage('', imageUrl); // Send as image message
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Helper to format time
    const formatTime = (timestamp: number) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(new Date(timestamp));
    };

    if (!uid) return <div>{t.chat_invalid}</div>;

    return (
        <div className="h-full w-full flex flex-col md:justify-center md:items-center p-0 md:p-6">
            <div className="flex flex-col h-full w-full bg-gray-50 md:bg-white md:rounded-2xl md:shadow-xl md:border md:border-gray-200 md:h-[80vh] md:max-w-4xl overflow-hidden">
                {/* Header */}
                <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-200 flex items-center sticky top-0 z-10">
                    <button 
                        onClick={() => navigate('/connections')} 
                        className="mr-3 text-gray-500 hover:text-ubc-blue md:hidden"
                    >
                        <i className="fas fa-arrow-left text-lg"></i>
                    </button>
                    {recipient ? (
                        <div className="flex items-center gap-3">
                            <img 
                                src={recipient.photoUrl || `https://ui-avatars.com/api/?name=${recipient.displayName}`} 
                                alt="avatar" 
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div>
                                <h2 className="font-bold text-gray-800 leading-tight">{recipient.displayName}</h2>
                                <p className="text-xs text-gray-500">{recipient.major || 'Student'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-pulse flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        </div>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                    {isLoading && (
                        <div className="flex justify-center pt-10 text-gray-400">
                            <i className="fas fa-circle-notch fa-spin text-2xl"></i>
                        </div>
                    )}

                    {!isLoading && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <i className="fas fa-comments text-4xl mb-2"></i>
                            <p>{t.chat_empty}</p>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        const isMe = msg.senderId === currentUserId;
                        const prevMsg = messages[index - 1];
                        
                        // Grouping Logic: Check if previous message was from same sender and within 5 minutes
                        const isSequence = prevMsg && 
                                           prevMsg.senderId === msg.senderId && 
                                           (msg.timestamp - prevMsg.timestamp < 5 * 60 * 1000);

                        return (
                            <div 
                                key={msg.id} 
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSequence ? 'mt-1' : 'mt-4'}`}
                            >
                                <div 
                                    className={`max-w-[80%] rounded-2xl relative group overflow-hidden
                                        ${msg.type === 'text' 
                                            ? (isMe 
                                                ? 'bg-ubc-blue text-white rounded-br-none px-4 py-2' 
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm px-4 py-2')
                                            : 'bg-transparent'
                                        }
                                    `}
                                >
                                    {msg.type === 'image' ? (
                                        <img 
                                            src={msg.imageUrl} 
                                            alt="Shared" 
                                            className="rounded-2xl max-w-full max-h-60 border border-gray-200 shadow-sm"
                                        />
                                    ) : (
                                        msg.text
                                    )}
                                    
                                    {/* Status Indicator for 'Me' */}
                                    {isMe && (
                                        <div className="absolute -bottom-4 right-0 text-[10px] text-gray-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {msg.status === 'sending' ? (
                                                <>
                                                    <span>{t.chat_sending}</span>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                </>
                                            ) : msg.status === 'error' ? (
                                                <span className="text-red-500">{t.chat_failed}</span>
                                            ) : (
                                                <span>{formatTime(msg.timestamp)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Timestamp for Other (only show if not sequence) */}
                                {!isMe && !isSequence && (
                                    <span className="text-[10px] text-gray-400 ml-2 mt-1">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-3 border-t border-gray-200 flex items-end gap-2">
                    <textarea
                        className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ubc-blue/50 resize-none max-h-32"
                        rows={1}
                        placeholder={t.chat_placeholder}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="w-10 h-10 rounded-full bg-ubc-blue text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ubc-blue/90 transition shrink-0"
                    >
                        <i className="fas fa-paper-plane text-sm pl-0.5 pt-0.5"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};
