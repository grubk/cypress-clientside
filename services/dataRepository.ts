
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
    // UPDATED KEY: Changing this wipes previous data (Fix 1)
    private readonly STORAGE_KEY = 'cypress_users_db_v2';
    
    // Mock Database
    private mockUser: UserModel | null = null;
    
    // Simulating a database table of registered users
    private registeredUsers: Map<string, UserModel> = new Map();

    // Simulating a Feedback Table
    private feedbackLog: { userId: string, text: string, timestamp: number }[] = [];

    private mockMatches: MatchProfileModel[] = [
        {
            uid: 'user_2',
            displayName: 'Sarah Jenkins',
            major: Major.COMMERCE,
            bio: "Love exploring new coffee shops and hiking on weekends!",
            commonInterests: [Interest.HIKING, Interest.STARTUPS],
            homeRegion: 'Vancouver, BC',
            languages: [Language.ENGLISH, Language.FRENCH],
            photoUrl: 'https://picsum.photos/200/200'
        },
        {
            uid: 'user_3',
            displayName: 'David Chen',
            major: Major.ENGINEERING,
            bio: "Building things and breaking them. Gamer at heart.",
            commonInterests: [Interest.VIDEO_GAMES, Interest.CODING],
            homeRegion: 'Toronto, ON',
            languages: [Language.ENGLISH, Language.MANDARIN_SIMPLIFIED],
            photoUrl: 'https://picsum.photos/201/201'
        },
        {
            uid: 'user_4',
            displayName: 'Emily Ross',
            major: Major.ARTS,
            bio: "Art history major. Always down for a museum trip.",
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

    // Mock "Pending Requests" for the current user
    // Fix 2: Changed to Cypress Team
    private incomingRequests: MatchProfileModel[] = [
        {
            uid: 'cypress_team',
            displayName: 'Cypress Team',
            major: Major.COMPUTER_SCIENCE,
            bio: "We are the development team behind Cypress. We'd love to hear your thoughts!",
            commonInterests: [Interest.CODING, Interest.STARTUPS],
            homeRegion: 'UBC Campus',
            languages: [Language.ENGLISH],
            photoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&h=200'
        }
    ];

    private constructor() {
        this.loadDatabase();
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
            bio: '',
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

                const user = this.registeredUsers.get(normalizedEmail);
                
                if (!user) {
                    // Fail if account doesn't exist (Strict Login)
                    reject(new Error("Account not found. Please sign up."));
                    return;
                }

                this.mockUser = user;
                resolve(this.mockUser);
            }, 1000); 
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
                newUser.isVerified = true;

                // Save to "Database"
                this.registeredUsers.set(normalizedEmail, newUser);
                this.mockUser = newUser;
                this.saveDatabase();

                resolve(newUser);
            }, 1500); 
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
     * Fix 2: Explicitly ensure registered users are included.
     */
    public async getMatchQueue(): Promise<MatchProfileModel[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 1. Start with mock matches
                let matches: MatchProfileModel[] = [...this.mockMatches];

                // 2. Mix in real registered users (excluding self)
                if (this.mockUser) {
                    const myUid = this.mockUser.uid;
                    
                    // Force refresh from localStorage in case another tab updated it
                    this.loadDatabase();

                    this.registeredUsers.forEach(user => {
                        // Don't show myself
                        if (user.uid === myUid) return;
                        
                        // Check privacy setting (default true if undefined)
                        const isVisible = user.isSearchable !== false;
                        
                        if (isVisible) {
                            const commonInterests = user.interests.filter(i => 
                                this.mockUser?.interests.includes(i)
                            );

                            matches.push({
                                uid: user.uid,
                                displayName: user.displayName,
                                major: user.major || Major.ARTS,
                                bio: user.bio,
                                commonInterests: commonInterests,
                                homeRegion: user.homeRegion,
                                languages: user.languages,
                                photoUrl: user.photoUrl
                            });
                        }
                    });
                }
                
                // 3. Prioritize by Language Similarity
                if (this.mockUser && this.mockUser.languages.length > 0) {
                    const userLangs = new Set(this.mockUser.languages);
                    
                    matches.sort((a, b) => {
                        const aShared = a.languages.filter(l => userLangs.has(l)).length;
                        const bShared = b.languages.filter(l => userLangs.has(l)).length;
                        return bShared - aShared; // Descending order of shared languages
                    });
                }
                
                // Deduplicate by UID
                const uniqueMatches = Array.from(new Map(matches.map(m => [m.uid, m])).values());
                
                resolve(uniqueMatches);
            }, 600);
        });
    }

    /* 
     * Discovery: Search
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
                
                // Refresh data
                this.loadDatabase();

                // Search through registered users
                this.registeredUsers.forEach((user) => {
                    if (user.isSearchable === false) return;
                    if (user.uid === currentUserUid) return;

                    const nameMatch = user.displayName.toLowerCase().includes(lowerQuery);
                    const majorMatch = user.major?.toLowerCase().includes(lowerQuery);
                    const emailMatch = user.email.toLowerCase().includes(lowerQuery);

                    if (nameMatch || majorMatch || emailMatch) {
                        const commonInterests = user.interests.filter(i => 
                            this.mockUser?.interests.includes(i)
                        );

                        results.push({
                            uid: user.uid,
                            displayName: user.displayName,
                            major: user.major || Major.ARTS,
                            bio: user.bio,
                            commonInterests: commonInterests,
                            languages: user.languages,
                            homeRegion: user.homeRegion,
                            photoUrl: user.photoUrl
                        });
                    }
                });

                // Also search the mock matches array
                this.mockMatches.forEach((match) => {
                    if (match.uid === currentUserUid) return;
                    const nameMatch = match.displayName.toLowerCase().includes(lowerQuery);
                    const majorMatch = match.major.toLowerCase().includes(lowerQuery);
                    
                    if (nameMatch || majorMatch) {
                        if (!results.some(r => r.uid === match.uid)) {
                            results.push(match);
                        }
                    }
                });

                resolve(results);
            }, 500);
        });
    }

    public async recordSwipe(targetUid: string, action: 'CONNECT' | 'DISMISS'): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Recorded ${action} on ${targetUid}`);
                resolve();
            }, 300);
        });
    }

    public async getIncomingRequests(): Promise<MatchProfileModel[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...this.incomingRequests]);
            }, 400);
        });
    }

    public async respondToRequest(targetUid: string, action: 'ACCEPT' | 'DECLINE'): Promise<MatchProfileModel | null> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const requestIndex = this.incomingRequests.findIndex(r => r.uid === targetUid);
                let acceptedUser: MatchProfileModel | null = null;

                if (requestIndex !== -1) {
                    if (action === 'ACCEPT') {
                        acceptedUser = this.incomingRequests[requestIndex];

                        // FIX 3: Add to registeredUsers to ensure getUser() finds them later
                        // Even if they are just a "mock" match, we promote them to the persistent store
                        // so they don't disappear from the connections list.
                        const pseudoEmail = `${targetUid}@simulated.com`;
                        if (!this.registeredUsers.has(pseudoEmail) && acceptedUser) {
                            const persistedProfile: UserModel = {
                                uid: acceptedUser.uid,
                                email: pseudoEmail,
                                displayName: acceptedUser.displayName,
                                major: acceptedUser.major,
                                bio: acceptedUser.bio,
                                interests: acceptedUser.commonInterests,
                                languages: acceptedUser.languages || [],
                                homeRegion: acceptedUser.homeRegion || '',
                                isVerified: true,
                                isSearchable: true,
                                photoUrl: acceptedUser.photoUrl,
                                settings: { general: true, dailyMatches: true, directMessages: true }
                            };
                            this.registeredUsers.set(pseudoEmail, persistedProfile);
                            // We don't necessarily need to saveDatabase() for this session-only fix, 
                            // but it helps if we reload.
                        }
                    }
                    this.incomingRequests.splice(requestIndex, 1);
                }
                resolve(acceptedUser);
            }, 300);
        });
    }

    public async simulateIncomingRequest(fakeUser: MatchProfileModel): Promise<void> {
        return new Promise((resolve) => {
            if (!this.incomingRequests.some(r => r.uid === fakeUser.uid)) {
                this.incomingRequests.push(fakeUser);
            }
            resolve();
        });
    }

    // Fix 2: Collect Feedback
    public async saveFeedback(userId: string, text: string): Promise<void> {
        return new Promise((resolve) => {
            this.feedbackLog.push({
                userId,
                text,
                timestamp: Date.now()
            });
            console.log("Feedback Recorded:", text);
            resolve();
        });
    }

    /* 
     * Connections: Get Mutuals
     * Specification: Returns list of mutual connections.
     * Fix 1: Bot photo same as App Icon (using a similar tree icon or high quality image)
     */
    public async getConnections(): Promise<ConnectionModel[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        uid: 'cypress_bot',
                        displayName: 'Cypress Bot',
                        major: Major.COMPUTER_SCIENCE,
                        // Fix 1: Updated to a tree image to match app logo concept
                        photoUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=200&h=200',
                        timestamp: Date.now()
                    }
                ]);
            }, 400);
        });
    }

    /*
     * General: Get User by ID
     */
    public async getUser(uid: string): Promise<Partial<UserModel>> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 0. Check for Bot
                if (uid === 'cypress_bot') {
                    resolve({
                        uid: 'cypress_bot',
                        displayName: 'Cypress Bot',
                        major: Major.COMPUTER_SCIENCE,
                        bio: "I'm here to help you navigate Cypress! Ask me about privacy or how to use the app.",
                        photoUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=200&h=200',
                        interests: [Interest.CODING, Interest.STARTUPS],
                        homeRegion: 'Server Room',
                        languages: [Language.ENGLISH]
                    });
                    return;
                }

                // Check for Team
                if (uid === 'cypress_team') {
                    resolve({
                        uid: 'cypress_team',
                        displayName: 'Cypress Team',
                        major: Major.COMPUTER_SCIENCE,
                        bio: "We build Cypress for you. Let us know how we can improve!",
                        photoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&h=200',
                        interests: [Interest.CODING],
                        homeRegion: 'UBC',
                        languages: [Language.ENGLISH]
                    });
                    return;
                }

                // 1. Try to find in registered users
                this.loadDatabase(); // Ensure fresh
                
                // Search values because keys are emails
                for (const user of this.registeredUsers.values()) {
                    if (user.uid === uid) {
                        resolve(user);
                        return;
                    }
                }

                // 2. Try mock matches
                const match = this.mockMatches.find(m => m.uid === uid);
                if (match) {
                    resolve({
                        uid: match.uid,
                        displayName: match.displayName,
                        major: match.major,
                        bio: match.bio,
                        photoUrl: match.photoUrl,
                        interests: match.commonInterests, 
                        homeRegion: match.homeRegion,
                        languages: match.languages
                    });
                    return;
                }

                // 3. Try incoming requests
                const request = this.incomingRequests.find(m => m.uid === uid);
                if (request) {
                    resolve({
                        uid: request.uid,
                        displayName: request.displayName,
                        major: request.major,
                        bio: request.bio,
                        photoUrl: request.photoUrl,
                        interests: request.commonInterests,
                        homeRegion: request.homeRegion,
                        languages: request.languages
                    });
                    return;
                }
                
                resolve({
                    uid: uid,
                    displayName: 'Unknown User',
                    major: Major.ARTS
                });
            }, 300);
        });
    }
}
