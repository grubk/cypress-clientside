

/**
 * Global Type Definitions for Cypress
 * 
 * Abstraction Function:
 * Represents the core data structures used across the Model-View-Controller architecture.
 * 
 * Rep Invariant:
 * - Enums are used to enforce restricted values for Majors and Interests.
 * - Models mirror the backend Firestore schema requirements.
 */

export enum Major {
    COMPUTER_SCIENCE = "Computer Science",
    ARTS = "Arts",
    ENGINEERING = "Engineering",
    COMMERCE = "Commerce",
    SCIENCE = "Science",
    FORESTRY = "Forestry",
    KINESIOLOGY = "Kinesiology"
}

export enum Interest {
    HIKING = "Hiking",
    VIDEO_GAMES = "Video Games",
    PAINTING = "Painting",
    STARTUPS = "Startups",
    READING = "Reading",
    SKIING = "Skiing",
    CODING = "Coding",
    MUSIC = "Music"
}

export enum Language {
    ENGLISH = "English",
    MANDARIN_SIMPLIFIED = "Mandarin (Simplified)",
    MANDARIN_TRADITIONAL = "Mandarin (Traditional)",
    SPANISH = "Spanish",
    JAPANESE = "Japanese",
    KOREAN = "Korean",
    FRENCH = "French",
    ITALIAN = "Italian",
    PORTUGUESE = "Portuguese"
}

export enum ConnectionStatus {
    PENDING = "PENDING",
    CONNECTED = "CONNECTED",
    DISMISSED = "DISMISSED"
}

export interface NotificationSettings {
    general: boolean;
    dailyMatches: boolean; // "everyday push with people sharing the same hobbies or languages (sum >= 3)"
    directMessages: boolean;
}

/* 
 * Represents the currently logged-in user.
 * Corresponds to UserModel in Architecture.
 */
export interface UserModel {
    uid: string;
    email: string;
    displayName: string;
    major: Major | null;
    interests: Interest[];
    homeRegion: string;
    languages: Language[];
    photoUrl?: string;
    isVerified: boolean;
    isSearchable: boolean; // Privacy Setting
    settings: NotificationSettings;
}

/* 
 * Represents a potential match card.
 * Corresponds to MatchProfileModel in Architecture.
 */
export interface MatchProfileModel {
    uid: string;
    displayName: string;
    major: Major;
    commonInterests: Interest[];
    homeRegion?: string;
    languages: Language[];
    photoUrl?: string;
}

/* 
 * Represents a mutual connection.
 * Corresponds to ConnectionModel in Architecture.
 */
export interface ConnectionModel {
    uid: string;
    displayName: string;
    major: Major;
    photoUrl?: string;
    timestamp: number;
}

/*
 * Chat Types
 */
export type MessageStatus = 'sending' | 'sent' | 'error';
export type MessageType = 'text' | 'image';

export interface Message {
    id: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    type: MessageType;
    timestamp: number;
    status: MessageStatus;
}