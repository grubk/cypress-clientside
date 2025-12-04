
import { create } from 'zustand';
import { UserModel, MatchProfileModel, ConnectionModel, Language, AppNotification, Major, DbMessage } from '../types';
import { DataRepository } from '../services/dataRepository';

/*
 * AppState Interface
 * Defines the shape of the global application state.
 */
interface AppState {
    // State
    currentUser: UserModel | null;
    isAuthenticated: boolean;
    isSessionChecked: boolean; // Flag to indicate if we've checked for an existing session
    matchQueue: MatchProfileModel[];
    incomingRequests: MatchProfileModel[];
    searchResults: MatchProfileModel[]; // For Search feature
    connections: ConnectionModel[];
    notifications: AppNotification[];
    messages: Record<string, DbMessage[]>; // userId -> messages array
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    uiLanguage: Language;

    // Actions
    checkSession: () => Promise<void>; // Init action
    login: (email: string, password?: string) => Promise<void>; // Changed signature
    signup: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUserProfile: (updates: Partial<UserModel>) => Promise<void>;
    fetchMatches: () => Promise<void>;
    fetchIncomingRequests: () => Promise<void>;
    respondToRequest: (targetUid: string, action: 'ACCEPT' | 'DECLINE') => Promise<void>;
    simulateIncomingRequest: () => Promise<void>; // Demo Action
    searchUsers: (query: string) => Promise<void>;
    handleSwipe: (targetUid: string, action: 'CONNECT' | 'DISMISS') => Promise<void>;
    fetchConnections: () => Promise<void>;
    sendMessage: (receiverId: string, content: string) => Promise<void>;
    loadMessages: (otherUserId: string) => Promise<void>;
    markAsRead: (otherUserId: string) => Promise<void>;
    subscribeToUserMessages: (otherUserId: string) => () => void;
    fetchUnreadCount: () => Promise<void>;
    setUiLanguage: (lang: Language) => void;
    addNotification: (message: string, type: 'success' | 'info' | 'error') => void;
    removeNotification: (id: string) => void;
}

/*
 * useAppStore
 * 
 * Abstraction Function:
 * Provides a reactive global state for UI components to consume. 
 * Connects UI actions to the DataRepository.
 */
export const useAppStore = create<AppState>((set, get) => ({
    currentUser: null,
    isAuthenticated: false,
    isSessionChecked: false,
    matchQueue: [],
    incomingRequests: [],
    searchResults: [],
    connections: [],
    notifications: [],
    messages: {},
    unreadCount: 0,
    isLoading: false,
    error: null,
    uiLanguage: Language.ENGLISH,

    checkSession: async () => {
        try {
            const repo = DataRepository.getInstance();
            const user = await repo.restoreSession();
            if (user) {
                set({ currentUser: user, isAuthenticated: true });
                // Optimistically fetch data
                get().fetchIncomingRequests();
            }
        } catch (err) {
            console.error("Session restore failed", err);
        } finally {
            set({ isSessionChecked: true });
        }
    },

    login: async (email: string, password?: string) => {
        set({ isLoading: true, error: null });
        try {
            const repo = DataRepository.getInstance();
            if (!password) {
                throw new Error("Password required for Supabase login");
            }
            const user = await repo.loginWithPassword(email, password);
            set({ currentUser: user, isAuthenticated: true, isLoading: false });
            // Fetch initial data
            get().fetchIncomingRequests(); 
        } catch (err: any) {
            let errorMessage = err.message;
            
            // Handle common Supabase errors with user-friendly messages
            if (err.message?.includes('rate limit')) {
                errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
            } else if (err.message?.includes('Email rate limit exceeded')) {
                errorMessage = 'Too many login attempts. Please wait 60 seconds and try again.';
            } else if (err.message?.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (err.message?.includes('Email not confirmed')) {
                errorMessage = 'Please check your email and confirm your account first.';
            }
            
            set({ error: errorMessage, isLoading: false });
        }
    },

    signup: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const repo = DataRepository.getInstance();
            const user = await repo.signup(email, password);
            set({ currentUser: user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            let errorMessage = err.message;
            
            // Handle common Supabase errors with user-friendly messages
            if (err.message?.includes('rate limit')) {
                errorMessage = 'Too many attempts. Please wait a few minutes and try again.';
            } else if (err.message?.includes('Email rate limit exceeded')) {
                errorMessage = 'Too many signup attempts. Please wait 60 seconds and try again.';
            } else if (err.message?.includes('already registered')) {
                errorMessage = 'This email is already registered. Try logging in instead.';
            } else if (err.message?.includes('invalid email')) {
                errorMessage = 'Please enter a valid email address.';
            }
            
            set({ error: errorMessage, isLoading: false });
        }
    },

    logout: async () => {
        const repo = DataRepository.getInstance();
        await repo.logout();
        set({ currentUser: null, isAuthenticated: false, matchQueue: [], connections: [], searchResults: [], incomingRequests: [], notifications: [] });
    },

    updateUserProfile: async (updates: Partial<UserModel>) => {
        set({ isLoading: true });
        try {
            const repo = DataRepository.getInstance();
            const updatedUser = await repo.updateProfile(updates);
            set({ currentUser: updatedUser, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchMatches: async () => {
        set({ isLoading: true });
        try {
            const repo = DataRepository.getInstance();
            const matches = await repo.getMatchQueue();
            set({ matchQueue: matches, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchIncomingRequests: async () => {
        try {
            const repo = DataRepository.getInstance();
            const requests = await repo.getIncomingRequests();
            set({ incomingRequests: requests });
        } catch (err: any) {
            console.error(err);
        }
    },

    respondToRequest: async (targetUid: string, action: 'ACCEPT' | 'DECLINE') => {
        const repo = DataRepository.getInstance();
        const currentRequests = get().incomingRequests;
        
        // Optimistic Update
        set({ incomingRequests: currentRequests.filter(r => r.uid !== targetUid) });

        try {
            const acceptedProfile = await repo.respondToRequest(targetUid, action);
            
            if (action === 'ACCEPT' && acceptedProfile) {
                // Add to connections
                const newConnection: ConnectionModel = {
                    uid: acceptedProfile.uid,
                    displayName: acceptedProfile.displayName,
                    major: acceptedProfile.major,
                    photoUrl: acceptedProfile.photoUrl,
                    timestamp: Date.now()
                };
                set(state => ({ 
                    connections: [...state.connections, newConnection] 
                }));
                get().addNotification(`You are now friends with ${acceptedProfile.displayName}!`, 'success');
            } else {
                get().addNotification("Request declined.", 'info');
            }
        } catch (err) {
            // Revert on error
            set({ incomingRequests: currentRequests, error: "Failed to process request" });
        }
    },

    simulateIncomingRequest: async () => {
        // Demo feature to show popup
        const repo = DataRepository.getInstance();
        const fakeUser: MatchProfileModel = {
            uid: `demo_req_${Date.now()}`,
            displayName: "Maria Garcia",
            major: Major.ARTS,
            bio: "International student from Spain. Love painting!",
            commonInterests: [],
            languages: [Language.SPANISH, Language.ENGLISH],
            photoUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Maria"
        };
        await repo.simulateIncomingRequest(fakeUser);
        
        // Update State
        await get().fetchIncomingRequests();
        
        // Trigger Notification
        get().addNotification(`New friend request from ${fakeUser.displayName}`, 'info');
    },

    searchUsers: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [] });
            return;
        }
        set({ isLoading: true });
        try {
            const repo = DataRepository.getInstance();
            const results = await repo.searchUsers(query);
            set({ searchResults: results, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    handleSwipe: async (targetUid: string, action: 'CONNECT' | 'DISMISS') => {
        // Optimistic UI update: Remove card immediately
        const currentQueue = get().matchQueue;
        set({ matchQueue: currentQueue.filter(m => m.uid !== targetUid) });

        try {
            const repo = DataRepository.getInstance();
            await repo.recordSwipe(targetUid, action);
            
            if (action === 'CONNECT') {
                get().addNotification("Friend Request Sent!", "success");
            }
        } catch (err: any) {
            // Revert on failure (simplified)
            set({ error: "Failed to record action", matchQueue: currentQueue });
        }
    },

    fetchConnections: async () => {
        set({ isLoading: true });
        try {
            const repo = DataRepository.getInstance();
            const conns = await repo.getConnections();
            set({ connections: conns, isLoading: false });
            // Also refresh requests when checking chats
            await get().fetchIncomingRequests();
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    sendMessage: async (receiverId: string, content: string) => {
        const repo = DataRepository.getInstance();
        await repo.sendMessage(receiverId, content);
        // Reload messages to get the new one
        await get().loadMessages(receiverId);
    },

    loadMessages: async (otherUserId: string) => {
        const repo = DataRepository.getInstance();
        const messages = await repo.getMessagesWithUser(otherUserId);
        set((state) => ({
            messages: {
                ...state.messages,
                [otherUserId]: messages
            }
        }));
    },

    markAsRead: async (otherUserId: string) => {
        const repo = DataRepository.getInstance();
        await repo.markMessagesAsRead(otherUserId);
        await get().fetchUnreadCount();
    },

    subscribeToUserMessages: (otherUserId: string) => {
        const repo = DataRepository.getInstance();
        return repo.subscribeToMessages(otherUserId, (newMessage) => {
            set((state) => {
                const existingMessages = state.messages[otherUserId] || [];
                return {
                    messages: {
                        ...state.messages,
                        [otherUserId]: [...existingMessages, newMessage]
                    }
                };
            });
            // Update unread count
            get().fetchUnreadCount();
        });
    },

    fetchUnreadCount: async () => {
        const repo = DataRepository.getInstance();
        const count = await repo.getUnreadMessageCount();
        set({ unreadCount: count });
    },

    setUiLanguage: (lang: Language) => {
        set({ uiLanguage: lang });
    },

    addNotification: (message: string, type: 'success' | 'info' | 'error') => {
        const id = Math.random().toString(36).substring(7);
        const newNotif = { id, message, type, duration: 3000 };
        set(state => ({ notifications: [...state.notifications, newNotif] }));

        // Auto remove
        setTimeout(() => {
            get().removeNotification(id);
        }, 3000);
    },

    removeNotification: (id: string) => {
        set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
        }));
    }
}));
