import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Major, Interest } from '../types';
import { useNavigate } from 'react-router-dom';

export const ProfileView: React.FC = () => {
    const { currentUser, updateUserProfile, logout } = useAppStore();
    const navigate = useNavigate();
    
    // Local state for form handling
    const [displayName, setDisplayName] = useState('');
    const [major, setMajor] = useState<Major | ''>('');
    const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
    const [homeRegion, setHomeRegion] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Initialize local state from global store
    useEffect(() => {
        if (currentUser) {
            setDisplayName(currentUser.displayName);
            setMajor(currentUser.major || '');
            setSelectedInterests(currentUser.interests);
            setHomeRegion(currentUser.homeRegion);
        }
    }, [currentUser]);

    const handleInterestToggle = (interest: Interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const handleSave = async () => {
        if (!displayName || !major || selectedInterests.length === 0) {
            alert("Please fill in all mandatory fields (Name, Major, Interests)");
            return;
        }

        await updateUserProfile({
            displayName,
            major: major as Major,
            interests: selectedInterests,
            homeRegion
        });
        setIsEditing(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-ubc-blue font-semibold">
                        Edit
                    </button>
                )}
            </div>

            {/* Profile Photo Placeholder */}
            <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-ubc-gold bg-gray-200">
                    <img 
                        src={currentUser?.photoUrl || `https://ui-avatars.com/api/?name=${displayName}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {/* Display Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    ) : (
                        <p className="text-lg font-medium">{displayName}</p>
                    )}
                </div>

                {/* Major */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Major</label>
                    {isEditing ? (
                        <select 
                            value={major} 
                            onChange={(e) => setMajor(e.target.value as Major)}
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option value="" disabled>Select a major</option>
                            {Object.values(Major).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-lg">{major || 'Not Selected'}</p>
                    )}
                </div>

                {/* Interests */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Interests</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(Interest).map(interest => {
                            const isSelected = selectedInterests.includes(interest);
                            if (!isEditing && !isSelected) return null; // Only show selected in view mode

                            return (
                                <button
                                    key={interest}
                                    disabled={!isEditing}
                                    onClick={() => handleInterestToggle(interest)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition
                                        ${isSelected 
                                            ? 'bg-ubc-blue text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {interest}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Home Region */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Home Region</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={homeRegion}
                            onChange={(e) => setHomeRegion(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="e.g. Vancouver, BC"
                        />
                    ) : (
                        <p className="text-lg">{homeRegion || 'Not specified'}</p>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="flex gap-3 pt-4">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-3 text-white font-bold bg-ubc-blue rounded-lg shadow-lg"
                    >
                        Save Profile
                    </button>
                </div>
            )}

            {!isEditing && (
                <button 
                    onClick={handleLogout}
                    className="w-full py-3 mt-8 text-red-500 font-medium border border-red-100 rounded-lg hover:bg-red-50"
                >
                    Log Out
                </button>
            )}
        </div>
    );
};