

import { create } from 'zustand';
import { UserModel, MatchProfileModel, ConnectionModel, Language } from '../types';
import { DataRepository } from '../services/dataRepository';

/*
 * AppState Interface
 * Defines the shape of the global application state.
 */
interface AppState {
    // State
    currentUser: UserModel | null;
    isAuthenticated: boolean;
    matchQueue: MatchProfileModel[];
    searchResults: MatchProfileModel[]; // For Search feature
    connections: ConnectionModel[];
    isLoading: boolean;
    error: string | null;
    uiLanguage: Language;

    // Actions
    login: (email: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUserProfile: (updates: Partial<UserModel>) => Promise<void>;
    fetchMatches: () => Promise<void>;
    searchUsers: (query: string) => Promise<void>;
    handleSwipe: (targetUid: string, action: 'CONNECT' | 'DISMISS') => Promise<void>;
    fetchConnections: () => Promise<void>;
    setUiLanguage: (lang: Language) => void;
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
    matchQueue: [],
    searchResults: [],
    connections: [],
    isLoading: false,
    error: null,
    uiLanguage: Language.ENGLISH,

    login: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
            const repo = DataRepository.getInstance();
            const user = await repo.login(email);
            set({ currentUser: user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    signup: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const repo = DataRepository.getInstance();
            const user = await repo.signup(email, password);
            set({ currentUser: user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    logout: () => {
        set({ currentUser: null, isAuthenticated: false, matchQueue: [], connections: [], searchResults: [] });
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
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    setUiLanguage: (lang: Language) => {
        set({ uiLanguage: lang });
    }
}));