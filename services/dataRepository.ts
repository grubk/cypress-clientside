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

        console.log('Updating profile with:', dbUpdates);

        const { data, error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Profile update error:', error);
            throw new Error(error.message);
        }

        console.log('Profile updated successfully:', data);

        // Fetch fresh data from DB to ensure consistency
        const updatedUser = await this.fetchUserProfile(user.id, user.email || '');
        this.currentUserCache = updatedUser;
        
        return updatedUser;
    }

    /* 
     * Discovery: Fetch Queue
     */
    public async getMatchQueue(): Promise<MatchProfileModel[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('No authenticated user');
            return [];
        }

        // Get current user's profile to access their major and interests
        const { data: currentUserProfile, error: profileError } = await supabase
            .from('profiles')
            .select('major, interests')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching current user profile:', profileError);
            return [];
        }

        if (!currentUserProfile) {
            console.log('No profile found for current user');
            return [];
        }

        const currentUserMajor = currentUserProfile.major;
        const currentUserInterests: Interest[] = currentUserProfile.interests || [];

        console.log('Current user major:', currentUserMajor);
        console.log('Current user interests:', currentUserInterests);

        // If user hasn't set their major yet, don't show matches
        if (!currentUserMajor) {
            console.log('User has not set their major - cannot fetch matches');
            return [];
        }

        // 1. Get list of users I have already swiped on (from connections table)
        const { data: existingConnections } = await supabase
            .from('connections')
            .select('user_id, target_user_id')
            .eq('user_id', user.id);
        
        const excludedIds = new Set<string>();
        excludedIds.add(user.id); // Exclude self
        
        // Add users I've already swiped on (liked or passed)
        existingConnections?.forEach((row: any) => {
            excludedIds.add(row.target_user_id);
        });

        // 2. Also exclude users I'm already mutually connected with
        const { data: mutualConnections } = await supabase
            .from('mutual_connections')
            .select('user_id_1, user_id_2')
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
        
        mutualConnections?.forEach((row: any) => {
            // Add the other user in the connection
            if (row.user_id_1 === user.id) {
                excludedIds.add(row.user_id_2);
            } else {
                excludedIds.add(row.user_id_1);
            }
        });

        console.log('Excluded user IDs (swiped + connected):', Array.from(excludedIds));

        // 3. Fetch profiles NOT in that list and NOT with the same major
        let query = supabase
            .from('profiles')
            .select('*')
            .eq('is_searchable', true)
            .neq('major', currentUserMajor) // MUST NOT have the same major
            .not('major', 'is', null) // Exclude users without a major set
            .limit(50); // Fetch more initially to have better sorting pool

        if (excludedIds.size > 0) {
             // Supabase filter for "NOT IN"
             query = query.not('id', 'in', `(${Array.from(excludedIds).join(',')})`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching match queue:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('No matching profiles found in database');
            return [];
        }

        console.log(`Found ${data.length} potential matches`);

        // 3. Map to MatchProfileModel and calculate common interests
        const profiles = data.map((p: any) => {
            const profileInterests: Interest[] = p.interests || [];
            const commonInterests = profileInterests.filter(interest => 
                currentUserInterests.includes(interest)
            );

            return {
                uid: p.id,
                displayName: p.display_name || 'Student',
                major: p.major || Major.ARTS,
                bio: p.bio,
                commonInterests: commonInterests,
                homeRegion: p.home_region,
                languages: p.languages || [],
                photoUrl: p.photo_url,
                _commonInterestCount: commonInterests.length // Temporary field for sorting
            };
        });

        // 4. Sort by number of common interests (descending)
        profiles.sort((a, b) => b._commonInterestCount - a._commonInterestCount);

        console.log('Match queue sorted by common interests:', profiles.map(p => ({
            name: p.displayName,
            major: p.major,
            commonInterests: p._commonInterestCount
        })));

        // 5. Remove the temporary sorting field and return top 20
        return profiles.slice(0, 20).map(({ _commonInterestCount, ...profile }) => profile);
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
            .eq('is_searchable', true)
            .ilike('display_name', `%${query}%`)
            .limit(10);

        if (error || !data) return [];        return data.map((p: any) => ({
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

        console.log('[RecordSwipe] Recording swipe:', { userId: user.id, targetUid, action });

        // Insert into connections table
        // The database trigger will automatically create mutual_connections if both users liked each other
        const { data, error } = await supabase.from('connections').insert({
            user_id: user.id,
            target_user_id: targetUid,
            action: action === 'CONNECT' ? 'like' : 'pass'
        }).select();

        if (error) {
            console.error('[RecordSwipe] Error recording swipe:', error);
            throw error;
        }

        console.log('[RecordSwipe] Swipe recorded successfully:', data);
    }

    public async getIncomingRequests(): Promise<MatchProfileModel[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('[IncomingRequests] No authenticated user');
            return [];
        }

        console.log('[IncomingRequests] Fetching incoming requests for:', user.id);

        // Find users who liked me, but I haven't responded to yet
        // Get all users who liked me
        const { data: incomingLikes, error } = await supabase
            .from('connections')
            .select('user_id')
            .eq('target_user_id', user.id)
            .eq('action', 'like');

        if (error || !incomingLikes || incomingLikes.length === 0) {
            console.log('[IncomingRequests] No incoming likes found');
            return [];
        }

        const likerIds = incomingLikes.map(like => like.user_id);

        // Check which ones I haven't responded to yet
        const { data: myResponses } = await supabase
            .from('connections')
            .select('target_user_id')
            .eq('user_id', user.id)
            .in('target_user_id', likerIds);

        const respondedIds = new Set((myResponses || []).map(r => r.target_user_id));
        const pendingIds = likerIds.filter(id => !respondedIds.has(id));

        if (pendingIds.length === 0) {
            console.log('[IncomingRequests] All incoming requests already responded to');
            return [];
        }

        console.log('[IncomingRequests] Found pending requests from:', pendingIds);

        // Fetch profiles of users with pending requests
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', pendingIds);

        if (profileError || !profiles) {
            console.error('[IncomingRequests] Error fetching profiles:', profileError);
            return [];
        }

        return profiles.map((p: any) => ({
            uid: p.id,
            displayName: p.display_name,
            major: p.major,
            bio: p.bio,
            commonInterests: p.interests || [],
            languages: p.languages || [],
            photoUrl: p.photo_url,
            homeRegion: p.home_region
        }));
    }

    public async respondToRequest(targetUid: string, action: 'ACCEPT' | 'DECLINE'): Promise<MatchProfileModel | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        console.log('[RespondToRequest] Responding to request:', { userId: user.id, targetUid, action });

        // Record my response (like or pass)
        const { data, error } = await supabase.from('connections').insert({
            user_id: user.id,
            target_user_id: targetUid,
            action: action === 'ACCEPT' ? 'like' : 'pass'
        }).select();

        if (error) {
            console.error('[RespondToRequest] Error recording response:', error);
            throw error;
        }

        console.log('[RespondToRequest] Response recorded:', data);

        // If accepted, the trigger will automatically create mutual_connection
        if (action === 'ACCEPT') {
            const profile = await this.getUser(targetUid);
            return {
                uid: profile.uid!,
                displayName: profile.displayName!,
                major: profile.major!,
                photoUrl: profile.photoUrl,
                commonInterests: profile.interests || [],
                languages: profile.languages || [],
                homeRegion: profile.homeRegion,
                bio: profile.bio
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
        if (!user) {
            console.log('[GetConnections] No authenticated user');
            return [];
        }

        console.log('[GetConnections] Fetching mutual connections for:', user.id);

        // Fetch mutual connections from the mutual_connections table
        const { data, error } = await supabase
            .from('mutual_connections')
            .select(`
                user_id_1,
                user_id_2,
                created_at
            `)
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

        if (error) {
            console.error('[GetConnections] Error fetching mutual connections:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('[GetConnections] No mutual connections found');
            return [];
        }

        console.log('[GetConnections] Found connections:', data);

        // Get the other user's IDs
        const otherUserIds = data.map(conn => 
            conn.user_id_1 === user.id ? conn.user_id_2 : conn.user_id_1
        );

        // Fetch profiles of connected users
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, major, photo_url')
            .in('id', otherUserIds);

        if (profileError) {
            console.error('[GetConnections] Error fetching profiles:', profileError);
            return [];
        }

        console.log('[GetConnections] Fetched profiles:', profiles);

        return (profiles || []).map((profile: any) => ({
            uid: profile.id,
            displayName: profile.display_name,
            major: profile.major,
            photoUrl: profile.photo_url,
            timestamp: Date.now()
        }));
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

    /*
     * Messaging: Send Message
     */
    public async sendMessage(receiverId: string, content: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        console.log('[SendMessage] Sending message:', { from: user.id, to: receiverId, content });
        
        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id: receiverId,
                content: content,
                is_read: false
            })
            .select()
            .single();
        
        if (error) {
            console.error('[SendMessage] Error sending message:', error);
            throw error;
        }
        
        console.log('[SendMessage] Message sent successfully:', data);
    }

    /*
     * Messaging: Get Messages with User
     */
    public async getMessagesWithUser(otherUserId: string): Promise<any[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        console.log('[GetMessages] Fetching messages between:', user.id, 'and', otherUserId);
        
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('[GetMessages] Error fetching messages:', error);
            throw error;
        }
        
        console.log('[GetMessages] Found messages:', data?.length || 0);
        return data || [];
    }

    /*
     * Messaging: Mark Messages as Read
     */
    public async markMessagesAsRead(otherUserId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('[MarkAsRead] Marking messages as read from:', otherUserId);
        
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
        
        if (error) {
            console.error('[MarkAsRead] Error marking messages as read:', error);
            throw error;
        }
        
        console.log('[MarkAsRead] Messages marked as read');
    }

    /*
     * Messaging: Get Unread Message Count
     */
    public async getUnreadMessageCount(): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;
        
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);
        
        if (error) {
            console.error('[UnreadCount] Error fetching unread count:', error);
            return 0;
        }
        
        return count || 0;
    }

    /*
     * Messaging: Subscribe to Real-time Messages
     */
    public subscribeToMessages(otherUserId: string, callback: (message: any) => void): () => void {
        console.log('[Subscribe] Setting up real-time subscription for messages with:', otherUserId);
        
        const channel = supabase
            .channel(`messages-${otherUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${otherUserId}`
                },
                (payload) => {
                    console.log('[Subscribe] New message received:', payload.new);
                    callback(payload.new);
                }
            )
            .subscribe();
        
        // Return unsubscribe function
        return () => {
            console.log('[Subscribe] Unsubscribing from messages');
            supabase.removeChannel(channel);
        };
    }
}

