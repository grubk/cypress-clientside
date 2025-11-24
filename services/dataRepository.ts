

import { UserModel, MatchProfileModel, ConnectionModel, Major, Interest, Language } from '../types';

/*
 * DataRepository
 * 
 * Abstraction Function:
 * Acts as the single source of truth for the client, abstracting network calls to Firebase.
 * For this implementation, it uses LocalStorage to persist data across sessions/reloads,
 * simulating a persistent database.
 * 
 * Rep Invariant:
 * - Always returns Promises to simulate network latency.
 * - Enforces uniqueness of UIDs in mock databases.
 */
export class DataRepository {
    private static instance: DataRepository;
    private readonly STORAGE_KEY = 'cypress_users_db_v1';
    
    // Mock Database
    private mockUser: UserModel | null = null;
    
    // Simulating a database table of registered users
    private registeredUsers: Map<string, UserModel> = new Map();

    private mockMatches: MatchProfileModel[] = [
        {
            uid: 'user_2',
            displayName: 'Sarah Jenkins',
            major: Major.COMMERCE,
            commonInterests: [Interest.HIKING, Interest.STARTUPS],
            homeRegion: 'Vancouver, BC',
            languages: [Language.ENGLISH, Language.FRENCH],
            photoUrl: 'https://picsum.photos/200/200'
        },
        {
            uid: 'user_3',
            displayName: 'David Chen',
            major: Major.ENGINEERING,
            commonInterests: [Interest.VIDEO_GAMES, Interest.CODING],
            homeRegion: 'Toronto, ON',
            languages: [Language.ENGLISH, Language.MANDARIN_SIMPLIFIED],
            photoUrl: 'https://picsum.photos/201/201'
        },
        {
            uid: 'user_4',
            displayName: 'Emily Ross',
            major: Major.ARTS,
            commonInterests: [Interest.PAINTING],
            homeRegion: 'Seattle, WA',
            languages: [Language.ENGLISH],
            photoUrl: 'https://picsum.photos/202/202'
        },
        {
            uid: 'user_5',
            displayName: 'Kenji Tanaka',
            major: Major.SCIENCE,
            commonInterests: [Interest.SKIING, Interest.MUSIC],
            homeRegion: 'Osaka, Japan',
            languages: [Language.JAPANESE, Language.ENGLISH],
            photoUrl: 'https://picsum.photos/204/204'
        }
    ];

    private constructor() {
        this.loadDatabase();
        this.cleanDuplicateAccounts(); // Run cleanup on init

        // Pre-seed the "Database" with a valid user if not present (e.g. first run)
        const seedEmail = 'valid@student.ubc.ca';
        if (!this.registeredUsers.has(seedEmail)) {
            const seedUser = this.generateNewUser(seedEmail);
            seedUser.uid = 'user_1';
            seedUser.displayName = 'John Doe';
            seedUser.major = Major.COMPUTER_SCIENCE;
            seedUser.interests = [Interest.CODING, Interest.HIKING];
            seedUser.homeRegion = 'Burnaby, BC';
            seedUser.isVerified = true;
            
            this.registeredUsers.set(seedEmail, seedUser);
            this.saveDatabase();
        }
    }

    private loadDatabase() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    this.registeredUsers = new Map(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load user database", e);
        }
    }

    private saveDatabase() {
        try {
            const data = JSON.stringify(Array.from(this.registeredUsers.entries()));
            localStorage.setItem(this.STORAGE_KEY, data);
        } catch (e) {
            console.error("Failed to save user database", e);
        }
    }

    /**
     * Cleans up duplicate accounts by normalizing emails to lowercase.
     * Keeps the most recently created account (based on UID timestamp if available)
     */
    private cleanDuplicateAccounts() {
        const cleanedMap = new Map<string, UserModel>();
        let hasChanges = false;

        for (const [rawEmail, user] of this.registeredUsers.entries()) {
            const normalizedEmail = user.email.toLowerCase();
            const existingUser = cleanedMap.get(normalizedEmail);

            if (existingUser) {
                // Collision detected. Determine which one is newer.
                const existingTime = this.extractTimestampFromUid(existingUser.uid);
                const currentTime = this.extractTimestampFromUid(user.uid);

                if (currentTime > existingTime) {
                    // Current is newer, replace existing
                    cleanedMap.set(normalizedEmail, user);
                }
                // Else keep existing (implied discard of current 'user')
                hasChanges = true;
            } else {
                cleanedMap.set(normalizedEmail, user);
                // If the key was not lowercase, we are effectively changing the map
                if (rawEmail !== normalizedEmail) hasChanges = true;
            }
        }

        if (hasChanges) {
            this.registeredUsers = cleanedMap;
            this.saveDatabase();
            console.debug("Database cleaned of duplicates/normalized.");
        }
    }

    private extractTimestampFromUid(uid: string): number {
        try {
            const parts = uid.split('_');
            if (parts.length >= 2) {
                return parseInt(parts[1], 10);
            }
        } catch (e) {}
        return 0;
    }

    /* Helper to create a consistent new user object */
    private generateNewUser(email: string): UserModel {
        // Try to derive a display name from email (e.g. jane.doe@... -> Jane Doe)
        let displayName = 'New Student';
        try {
            const namePart = email.split('@')[0];
            if (namePart) {
                displayName = namePart.split('.')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ');
            }
        } catch (e) { /* ignore */ }

        return {
            uid: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            email: email, // Will be stored normalized in logic
            displayName: displayName,
            major: null,
            interests: [],
            homeRegion: '',
            languages: [Language.ENGLISH], // Default
            isVerified: false,
            isSearchable: true, // Default Privacy: Visible
            settings: {
                general: true,
                dailyMatches: true,
                directMessages: true
            }
        };
    }

    /* Singleton Accessor */
    public static getInstance(): DataRepository {
        if (!DataRepository.instance) {
            DataRepository.instance = new DataRepository();
        }
        return DataRepository.instance;
    }

    /* 
     * Authentication: Login
     * Specification: Authenticates user against mock DB. Throws error if email doesn't end in ubc.ca
     */
    public async login(email: string): Promise<UserModel> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const normalizedEmail = email.toLowerCase().trim();

                if (!normalizedEmail.endsWith('@student.ubc.ca')) {
                    reject(new Error("Email must be a @student.ubc.ca address"));
                    return;
                }

                let user = this.registeredUsers.get(normalizedEmail);
                
                // DEMO FIX: If user doesn't exist in local storage (new device), 
                // auto-provision them to simulate cloud retrieval.
                // This prevents "User not found" when switching devices in the prototype.
                if (!user) {
                    user = this.generateNewUser(normalizedEmail);
                    user.isVerified = true; // Assume verified if they are "logging in"
                    this.registeredUsers.set(normalizedEmail, user);
                    this.saveDatabase();
                }

                this.mockUser = user;
                
                // Ensure settings/privacy exist for legacy users from previous sessions
                if (!this.mockUser.settings) {
                    this.mockUser.settings = {
                        general: true,
                        dailyMatches: true,
                        directMessages: true
                    };
                }
                if (this.mockUser.isSearchable === undefined) {
                    this.mockUser.isSearchable = true;
                }
                resolve(this.mockUser);
            }, 1200); // Increased delay for animation
        });
    }

    /*
     * Authentication: Signup
     * Specification: Creates a new user in the mock DB.
     */
    public async signup(email: string, password: string): Promise<UserModel> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const normalizedEmail = email.toLowerCase().trim();

                if (!normalizedEmail.endsWith('@student.ubc.ca')) {
                    reject(new Error("Email must be a @student.ubc.ca address"));
                    return;
                }

                if (password.length < 6) {
                    reject(new Error("Password must be at least 6 characters"));
                    return;
                }

                if (this.registeredUsers.has(normalizedEmail)) {
                    reject(new Error("The email is already been used."));
                    return;
                }

                // Create new user using shared helper
                const newUser = this.generateNewUser(normalizedEmail);

                // Save to "Database"
                this.registeredUsers.set(normalizedEmail, newUser);
                this.mockUser = newUser;
                this.saveDatabase();

                resolve(newUser);
            }, 2000); // Increased delay to show off the animation
        });
    }

    /* 
     * Profile: Update
     * Specification: Updates the current user model on the server.
     */
    public async updateProfile(updates: Partial<UserModel>): Promise<UserModel> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!this.mockUser) {
                    reject(new Error("No user logged in"));
                    return;
                }
                
                const updatedUser = { ...this.mockUser, ...updates };
                
                this.mockUser = updatedUser;
                // Update the "Database" too
                const normalizedEmail = this.mockUser.email.toLowerCase();
                this.registeredUsers.set(normalizedEmail, updatedUser);
                this.saveDatabase();
                
                resolve(this.mockUser);
            }, 800);
        });
    }

    /* 
     * Discovery: Fetch Queue
     * Specification: Retrieves the prioritized match queue for the active user.
     * Logic: Sorts potential matches to prioritize those with shared languages.
     */
    public async getMatchQueue(): Promise<MatchProfileModel[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                let matches = [...this.mockMatches];
                
                // Prioritize by Language Similarity
                if (this.mockUser && this.mockUser.languages.length > 0) {
                    const userLangs = new Set(this.mockUser.languages);
                    
                    matches.sort((a, b) => {
                        const aShared = a.languages.filter(l => userLangs.has(l)).length;
                        const bShared = b.languages.filter(l => userLangs.has(l)).length;
                        return bShared - aShared; // Descending order of shared languages
                    });
                }
                
                resolve(matches);
            }, 600);
        });
    }

    /* 
     * Discovery: Search
     * Specification: Searches the database for users matching the query who have privacy enabled.
     */
    public async searchUsers(query: string): Promise<MatchProfileModel[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const lowerQuery = query.toLowerCase().trim();
                if (!lowerQuery) {
                    resolve([]);
                    return;
                }

                const results: MatchProfileModel[] = [];
                const currentUserUid = this.mockUser?.uid;

                // Search through registered users (simulating backend query)
                this.registeredUsers.forEach((user) => {
                    // Privacy Check
                    if (user.isSearchable === false) return;
                    if (user.uid === currentUserUid) return;

                    // Match Logic (Name or Major)
                    const nameMatch = user.displayName.toLowerCase().includes(lowerQuery);
                    const majorMatch = user.major?.toLowerCase().includes(lowerQuery);

                    if (nameMatch || majorMatch) {
                        // Calculate common interests/langs for the preview model
                        const commonInterests = user.interests.filter(i => 
                            this.mockUser?.interests.includes(i)
                        );

                        results.push({
                            uid: user.uid,
                            displayName: user.displayName,
                            major: user.major || Major.ARTS, // Fallback
                            commonInterests: commonInterests,
                            languages: user.languages,
                            homeRegion: user.homeRegion,
                            photoUrl: user.photoUrl
                        });
                    }
                });

                // Also search the mock matches array (for demo data consistency)
                this.mockMatches.forEach((match) => {
                    if (match.uid === currentUserUid) return;
                    const nameMatch = match.displayName.toLowerCase().includes(lowerQuery);
                    const majorMatch = match.major.toLowerCase().includes(lowerQuery);
                    
                    if (nameMatch || majorMatch) {
                        // Avoid duplicates if mock match is also in registeredUsers
                        if (!results.some(r => r.uid === match.uid)) {
                            results.push(match);
                        }
                    }
                });

                resolve(results);
            }, 500);
        });
    }

    /* 
     * Discovery: Swipe Action
     * Specification: Records a swipe (Connect/Dismiss) logic.
     */
    public async recordSwipe(targetUid: string, action: 'CONNECT' | 'DISMISS'): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Recorded ${action} on ${targetUid}`);
                // In a real app, if action is CONNECT, check if mutual, then add to connections.
                // For demo, we just log it.
                resolve();
            }, 300);
        });
    }

    /* 
     * Connections: Get Mutuals
     * Specification: Returns list of mutual connections.
     */
    public async getConnections(): Promise<ConnectionModel[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        uid: 'user_99',
                        displayName: 'Jennifer Wang',
                        major: Major.KINESIOLOGY,
                        photoUrl: 'https://picsum.photos/203/203',
                        timestamp: Date.now()
                    }
                ]);
            }, 400);
        });
    }

    /*
     * General: Get User by ID
     * Specification: Fetches public profile of a user. Used for Chat Header.
     */
    public async getUser(uid: string): Promise<Partial<UserModel>> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Return a mock user based on the connection ID
                resolve({
                    uid: uid,
                    displayName: uid === 'user_99' ? 'Jennifer Wang' : 'Unknown User',
                    photoUrl: uid === 'user_99' ? 'https://picsum.photos/203/203' : undefined,
                    major: uid === 'user_99' ? Major.KINESIOLOGY : Major.ARTS
                });
            }, 300);
        });
    }
}