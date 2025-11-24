
import { UserModel, MatchProfileModel, ConnectionModel, Major, Interest } from '../types';

/*
 * DataRepository
 * 
 * Abstraction Function:
 * Acts as the single source of truth for the client, abstracting network calls to Firebase.
 * For this implementation, it uses in-memory mock data to simulate async server operations.
 * 
 * Rep Invariant:
 * - Always returns Promises to simulate network latency.
 * - Enforces uniqueness of UIDs in mock databases.
 */
export class DataRepository {
    private static instance: DataRepository;
    
    // Mock Database
    private mockUser: UserModel | null = null;
    
    // Simulating a database table of registered users
    // In a real app, this would be your Firebase Auth / Firestore Users collection
    private registeredUsers: Map<string, UserModel> = new Map();

    private mockMatches: MatchProfileModel[] = [
        {
            uid: 'user_2',
            displayName: 'Sarah Jenkins',
            major: Major.COMMERCE,
            commonInterests: [Interest.HIKING, Interest.STARTUPS],
            homeRegion: 'Vancouver, BC',
            languages: ['English', 'French'],
            photoUrl: 'https://picsum.photos/200/200'
        },
        {
            uid: 'user_3',
            displayName: 'David Chen',
            major: Major.ENGINEERING,
            commonInterests: [Interest.VIDEO_GAMES, Interest.CODING],
            homeRegion: 'Toronto, ON',
            languages: ['English', 'Mandarin'],
            photoUrl: 'https://picsum.photos/201/201'
        },
        {
            uid: 'user_4',
            displayName: 'Emily Ross',
            major: Major.ARTS,
            commonInterests: [Interest.PAINTING],
            homeRegion: 'Seattle, WA',
            languages: ['English'],
            photoUrl: 'https://picsum.photos/202/202'
        }
    ];

    private constructor() {
        // Pre-seed the "Database" with a valid user for testing login immediately
        const seedEmail = 'valid@student.ubc.ca';
        this.registeredUsers.set(seedEmail, {
            uid: 'user_1',
            email: seedEmail,
            displayName: 'John Doe',
            major: Major.COMPUTER_SCIENCE,
            interests: [Interest.CODING, Interest.HIKING],
            homeRegion: 'Burnaby, BC',
            languages: ['English'],
            isVerified: true
        });
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
                if (!email.endsWith('@student.ubc.ca')) {
                    reject(new Error("Email must be a @student.ubc.ca address"));
                    return;
                }

                // Check against our in-memory "database"
                // In production, this call would be: firebase.auth().signInWithEmailAndPassword(email, password)
                const user = this.registeredUsers.get(email);
                
                if (user) {
                    this.mockUser = user;
                    resolve(this.mockUser);
                } else {
                    // For the sake of this demo, if the user doesn't exist in our map but has a valid domain,
                    // we reject it to force them to use Signup, OR we could auto-create. 
                    // Let's force Signup to test the new UI.
                    reject(new Error("User not found. Please sign up first."));
                }
            }, 800);
        });
    }

    /*
     * Authentication: Signup
     * Specification: Creates a new user in the mock DB.
     */
    public async signup(email: string, password: string): Promise<UserModel> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!email.endsWith('@student.ubc.ca')) {
                    reject(new Error("Email must be a @student.ubc.ca address"));
                    return;
                }

                if (password.length < 6) {
                    reject(new Error("Password must be at least 6 characters"));
                    return;
                }

                // DUPLICATE CHECK
                // TODO: When connecting to Real API, perform a query to check if email exists
                // e.g., const methods = await fetchSignInMethodsForEmail(auth, email);
                if (this.registeredUsers.has(email)) {
                    reject(new Error("Account already exists for this email. Please login."));
                    return;
                }

                // Create new user
                const newUser: UserModel = {
                    uid: `user_${Date.now()}`,
                    email: email,
                    displayName: 'New Student', // Default
                    major: null,
                    interests: [],
                    homeRegion: '',
                    languages: [],
                    isVerified: false
                };

                // Save to "Database"
                this.registeredUsers.set(email, newUser);
                this.mockUser = newUser;

                resolve(newUser);
            }, 1000);
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
                this.registeredUsers.set(this.mockUser.email, updatedUser);
                
                resolve(this.mockUser);
            }, 500);
        });
    }

    /* 
     * Discovery: Fetch Queue
     * Specification: Retrieves the prioritized match queue for the active user.
     */
    public async getMatchQueue(): Promise<MatchProfileModel[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...this.mockMatches]);
            }, 600);
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
                // In a real app, this would trigger Cloud Functions
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
