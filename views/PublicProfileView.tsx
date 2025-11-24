

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataRepository } from '../services/dataRepository';
import { UserModel, MatchProfileModel } from '../types';
import { useAppStore } from '../store/useAppStore';
import { TRANSLATIONS } from '../utils/translations';

/*
 * PublicProfileView
 * 
 * Abstraction Function:
 * Renders a read-only profile view of another user.
 * Allows 'Add Friend' (Connect) or 'Pass'.
 */
export const PublicProfileView: React.FC = () => {
    const { uid } = useParams<{ uid: string }>();
    const navigate = useNavigate();
    const { handleSwipe, uiLanguage } = useAppStore();
    const t = TRANSLATIONS[uiLanguage];

    const [profile, setProfile] = useState<Partial<UserModel> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (uid) {
                setIsLoading(true);
                try {
                    const user = await DataRepository.getInstance().getUser(uid);
                    setProfile(user);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchUser();
    }, [uid]);

    const handleConnect = async () => {
        if (uid) {
            await handleSwipe(uid, 'CONNECT');
            navigate('/'); // Go back to discovery after connecting
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-circle-notch fa-spin text-ubc-blue text-2xl"></i>
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8 text-center text-gray-500">User not found</div>;
    }

    return (
        <div className="h-full overflow-y-auto w-full p-4 md:p-8 bg-gray-50">
            <div className="max-w-2xl mx-auto">
                <button 
                    onClick={handleBack}
                    className="mb-4 text-gray-500 hover:text-ubc-blue font-bold flex items-center gap-2"
                >
                    <i className="fas fa-arrow-left"></i> Back
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Image Area */}
                    <div className="h-48 bg-ubc-blue relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
                    </div>
                    
                    <div className="px-8 pb-8 relative">
                        {/* Profile Pic overlapping header */}
                        <div className="-mt-16 mb-4 flex justify-between items-end">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                                <img 
                                    src={profile.photoUrl || `https://ui-avatars.com/api/?name=${profile.displayName}`} 
                                    alt={profile.displayName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            {/* Action Buttons */}
                            <button 
                                onClick={handleConnect}
                                className="mb-2 px-6 py-2.5 bg-ubc-blue text-white font-bold rounded-xl hover:bg-ubc-blue/90 shadow-lg shadow-ubc-blue/20 transition-transform active:scale-95 flex items-center gap-2"
                            >
                                <i className="fas fa-user-plus"></i>
                                {t.public_connect}
                            </button>
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{profile.displayName}</h1>
                            <p className="text-xl text-ubc-blue font-medium mt-1">{profile.major}</p>
                            
                            {profile.homeRegion && (
                                <p className="text-gray-500 mt-2 flex items-center gap-2">
                                    <i className="fas fa-map-marker-alt text-ubc-gold"></i>
                                    {profile.homeRegion}
                                </p>
                            )}
                        </div>

                        {/* Bio Section */}
                        <div className="mt-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.profile_bio}</h3>
                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 italic border border-gray-100">
                                "{profile.bio || t.profile_bio_none}"
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-8">
                            {/* Interests */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.profile_interests}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.interests?.map(interest => (
                                        <span key={interest} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                                            {interest}
                                        </span>
                                    ))}
                                    {(!profile.interests || profile.interests.length === 0) && <span className="text-gray-400 text-sm">None listed</span>}
                                </div>
                            </div>

                            {/* Languages */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.disc_langs}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.languages?.map(lang => (
                                        <span key={lang} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};