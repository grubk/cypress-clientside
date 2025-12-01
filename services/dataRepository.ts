import { UserModel, MatchProfileModel, ConnectionModel, Major, Interest, Language } from '../types';
import { supabase } from './supabaseClient';

/*
 * DataRepository
 * 
 * Abstraction Function:
 * Acts as the single source of truth for the client, abstracting network calls to Supabase.
 */
export class DataRepository {
    private static instance: DataRepository;
    
    // Cache the current user to reduce redundant DB calls
    private currentUserCache: UserModel | null = null;

    private readonly TREE_ICON_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMDAyMTQ1IiBkPSJNMzY4LjUgMzYwSDQ0OGMtMTguNiAwLTMwLjktMjEuMi0xOS45LTM0LjRMMjcyLjggMjQuMmMtOS4zLTExLjEtMjYuNC0xMS4xtmMzNS43IDBMNDMuOSAzMjUuNmMtMTEgMTMuMiAyMy40IDM0LjQgMTkuOSAzNC40aDc5LjVsLTk1LjIgMTQzLjJjLTEwLjkgMTYuNCAuOCAzOC44IDIwLjUgMzguOGgxMDcuNHY3MS40YzAgMTAuMyA4LjMgMTguNiAxOC42IDE4LjZoMzJjMTAuMyAwIDE4LjYtOC4zIDE4LjYtMTguNnYtNzEuNGgxMDcuNGMxOS43IDAgMzEuNC0yMi40IDIwLjUtMzguOEwzNjguNSAzNjB6Ii8+PC9zdmc+";

    private constructor() {}

    /* Singleton Accessor */
    public static getInstance(): DataRepository {
        if (!DataRepository.instance) {
            DataRepository.instance = new DataRepository();
        }
        return DataRepository.instance;
    }

    /*
     * Session Management: Restore
     */
    public async restoreSession(): Promise<UserModel | null> {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            return await this.fetchUserProfile(session.user.id, session.user.email || '');
        }
        return null;
    }

    /*
     * Authentication: Logout
     */
    public async logout(): Promise<void> {
        await supabase.auth.signOut();
        this.currentUserCache = null;
    }

    public async login(email: string): Promise<UserModel> {
        throw new Error("For Supabase, please use 'Sign Up' to create the account/profile first, or use loginWithPassword.");
    }
    
    public async loginWithPassword(email: string, password: string): Promise<UserModel> {
         const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Login failed");

        return await this.fetchUserProfile(data.user.id, email);
    }

    /*
     * Authentication: Signup
     */
    public async signup(email: string, password: string): Promise<UserModel> {
        // 1. Create Auth User
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Signup failed");

        // 2. Create Profile Entry
        const newUser: UserModel = {
            uid: data.user.id,
            email: email,
            displayName: email.split('@')[0], // Default name
            major: null,
            bio: '',
            interests: [],
            homeRegion: '',
            languages: [Language.ENGLISH],
            isVerified: true,
            isSearchable: true,
            settings: { general: true, dailyMatches: true, directMessages: true }
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: newUser.uid,
                email: newUser.email,
                display_name: newUser.displayName,
                major: newUser.major,
                bio: newUser.bio,
                interests: newUser.interests,
                languages: newUser.languages,
                home_region: newUser.homeRegion,
                is_searchable: newUser.isSearchable
            });

        if (profileError) {
            console.error("Profile creation error", profileError);
        }

        this.currentUserCache = newUser;
        return newUser;
    }

    /* Helper: Fetch Profile from DB */
    private async fetchUserProfile(uid: string, email: string): Promise<UserModel> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

        if (error || !data) {
            // Fallback if auth exists but profile doesn't (rare)
            return {
                uid,
                email,
                displayName: 'User',
                major: null,
                interests: [],
                languages: [],
                homeRegion: '',
                isVerified: true,
                isSearchable: true,
                settings: { general: true, dailyMatches: true, directMessages: true }
            };
        }

        const user: UserModel = {
            uid: data.id,
            email: data.email || email,
            displayName: data.display_name,
            major: data.major as Major,
            bio: data.bio,
            interests: data.interests || [],
            languages: data.languages || [],
            homeRegion: data.home_region,
            photoUrl: data.photo_url,
            isVerified: true,
            isSearchable: data.is_searchable,
            settings: { general: true, dailyMatches: true, directMessages: true }
        };

        this.currentUserCache = user;
        return user;
    }

    /* 
     * Profile: Update
     */
    public async updateProfile(updates: Partial<UserModel>): Promise<UserModel> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user logged in");

        // Map frontend camelCase to DB snake_case
        const dbUpdates: any = {};
        if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
        if (updates.major !== undefined) dbUpdates.major = updates.major;
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
        if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
        if (updates.languages !== undefined) dbUpdates.languages = updates.languages;
        if (updates.homeRegion !== undefined) dbUpdates.home_region = updates.homeRegion;
        if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
        if (updates.isSearchable !== undefined) dbUpdates.is_searchable = updates.isSearchable;

        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id);

        if (error) throw new Error(error.message);

        // Update cache
        if (this.currentUserCache) {
            this.currentUserCache = { ...this.currentUserCache, ...updates };
        }
        
        return this.currentUserCache!;
    }

    /* 
     * Discovery: Fetch Queue
     */
    public async getMatchQueue(): Promise<MatchProfileModel[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // 1. Get list of users I have already swiped on (Connected or Dismissed)
        const { data: existingConnections } = await supabase
            .from('connections')
            .select('user_a, user_b')
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
        
        const excludedIds = new Set<string>();
        excludedIds.add(user.id); // Exclude self
        
        existingConnections?.forEach((row: any) => {
            if (row.user_a === user.id) excludedIds.add(row.user_b);
            if (row.user_b === user.id) excludedIds.add(row.user_a);
        });

        // 2. Fetch profiles NOT in that list
        let query = supabase
            .from('profiles')
            .select('*')
            .eq('is_searchable', true)
            .limit(20);

        if (excludedIds.size > 0) {
             // Supabase filter for "NOT IN"
             query = query.not('id', 'in', `(${Array.from(excludedIds).join(',')})`);
        }

        const { data, error } = await query;

        if (error || !data) return [];

        return data.map((p: any) => ({
            uid: p.id,
            displayName: p.display_name || 'Student',
            major: p.major || Major.ARTS,
            bio: p.bio,
            commonInterests: p.interests || [],
            homeRegion: p.home_region,
            languages: p.languages || [],
            photoUrl: p.photo_url
        }));
    }

    /* 
     * Discovery: Search
     */
    public async searchUsers(query: string): Promise<MatchProfileModel[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .ilike('display_name', `%${query}%`)
            .limit(10);

        if (error || !data) return [];

        return data.map((p: any) => ({
            uid: p.id,
            displayName: p.display_name || 'Student',
            major: p.major || Major.ARTS,
            bio: p.bio,
            commonInterests: p.interests || [],
            languages: p.languages || [],
            homeRegion: p.home_region,
            photoUrl: p.photo_url
        }));
    }

    /* 
     * Connections: Swipe Logic
     */
    public async recordSwipe(targetUid: string, action: 'CONNECT' | 'DISMISS'): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Insert into connections with appropriate status
        // If 'CONNECT', status is PENDING
        // If 'DISMISS', status is DISMISSED (so they don't show up again)
        await supabase.from('connections').insert({
            user_a: user.id,
            user_b: targetUid,
            status: action === 'CONNECT' ? 'PENDING' : 'DISMISSED'
        });
    }

    public async getIncomingRequests(): Promise<MatchProfileModel[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Find connections where user_b is ME and status is PENDING
        // We use the explicit Foreign Key name provided in the SQL schema below
        const { data, error } = await supabase
            .from('connections')
            .select(`
                user_a, 
                profiles!connections_user_a_fkey(*)
            `)
            .eq('user_b', user.id)
            .eq('status', 'PENDING');

        if (error || !data) return [];

        // Map the joined profile data
        return data.map((row: any) => {
            const p = row.profiles;
            return {
                uid: p.id,
                displayName: p.display_name,
                major: p.major,
                bio: p.bio,
                commonInterests: p.interests || [],
                languages: p.languages || [],
                photoUrl: p.photo_url
            };
        });
    }

    public async respondToRequest(targetUid: string, action: 'ACCEPT' | 'DECLINE'): Promise<MatchProfileModel | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const status = action === 'ACCEPT' ? 'CONNECTED' : 'DISMISSED';

        await supabase
            .from('connections')
            .update({ status })
            .eq('user_b', user.id)
            .eq('user_a', targetUid);

        if (action === 'ACCEPT') {
            const profile = await this.getUser(targetUid);
            return {
                uid: profile.uid!,
                displayName: profile.displayName!,
                major: profile.major!,
                photoUrl: profile.photoUrl,
                commonInterests: [],
                languages: []
            };
        }
        return null;
    }

    public async simulateIncomingRequest(fakeUser: MatchProfileModel): Promise<void> {
        // No-op for prod
    }

    public async saveFeedback(userId: string, text: string): Promise<void> {
        // No-op for prod
    }

    /* 
     * Connections: Get Mutuals
     */
    public async getConnections(): Promise<ConnectionModel[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Fetch connected friends
        // Uses explicit FK names to avoid ambiguity
        const { data, error } = await supabase
            .from('connections')
            .select(`
                user_a, 
                user_b,
                profile_a:profiles!connections_user_a_fkey(id, display_name, major, photo_url),
                profile_b:profiles!connections_user_b_fkey(id, display_name, major, photo_url)
            `)
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
            .eq('status', 'CONNECTED');

        if (error || !data) return [];

        return data.map((row: any) => {
            // Determine which profile is the "other" person
            const otherProfile = row.user_a === user.id ? row.profile_b : row.profile_a;
            return {
                uid: otherProfile.id,
                displayName: otherProfile.display_name,
                major: otherProfile.major,
                photoUrl: otherProfile.photo_url,
                timestamp: Date.now()
            };
        });
    }

    /*
     * General: Get User by ID
     */
    public async getUser(uid: string): Promise<Partial<UserModel>> {
        if (uid === 'cypress_bot' || uid === 'cypress_team') {
            return {
                uid,
                displayName: uid === 'cypress_bot' ? 'Cypress Bot' : 'Cypress Team',
                major: Major.COMPUTER_SCIENCE,
                bio: "Official System Account",
                photoUrl: this.TREE_ICON_URL,
                interests: [],
                languages: [Language.ENGLISH]
            };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

        if (error || !data) {
            return { uid, displayName: 'Unknown User' };
        }

        return {
            uid: data.id,
            displayName: data.display_name,
            major: data.major,
            bio: data.bio,
            interests: data.interests,
            languages: data.languages,
            homeRegion: data.home_region,
            photoUrl: data.photo_url
        };
    }
}