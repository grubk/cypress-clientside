

import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Major, Interest, Language } from '../types';
import { useNavigate } from 'react-router-dom';
import { TRANSLATIONS } from '../utils/translations';

export const ProfileView: React.FC = () => {
    const { currentUser, updateUserProfile, logout, uiLanguage } = useAppStore();
    const navigate = useNavigate();
    const t = TRANSLATIONS[uiLanguage];
    
    // Local state for form handling
    const [displayName, setDisplayName] = useState('');
    const [major, setMajor] = useState<Major | ''>('');
    const [bio, setBio] = useState('');
    const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
    const [homeRegion, setHomeRegion] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

    // Camera & Upload Refs/State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Detect mobile device for conditional camera button
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Initialize local state from global store
    useEffect(() => {
        if (currentUser) {
            setDisplayName(currentUser.displayName);
            setMajor(currentUser.major || '');
            setBio(currentUser.bio || '');
            setSelectedInterests(currentUser.interests);
            setSelectedLanguages(currentUser.languages || []);
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

    const handleLanguageToggle = (lang: Language) => {
        if (selectedLanguages.includes(lang)) {
            setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
        } else {
            setSelectedLanguages([...selectedLanguages, lang]);
        }
    };

    const handleSave = async () => {
        if (!displayName || !major || selectedInterests.length === 0 || selectedLanguages.length === 0) {
            alert(t.profile_fill_error);
            return;
        }

        await updateUserProfile({
            displayName,
            major: major as Major,
            bio,
            interests: selectedInterests,
            languages: selectedLanguages,
            homeRegion
        });
        setIsEditing(false);
    };

    const handlePhotoSelect = async (url: string) => {
        await updateUserProfile({ photoUrl: url });
        setIsPhotoModalOpen(false);
        stopCamera();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // File Upload Handler
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxSize = 300; 
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    handlePhotoSelect(dataUrl);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    // Camera Logic
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            setStream(mediaStream);
            setIsCameraActive(true);
        } catch (err) {
            alert(t.profile_photo_camera_error);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = 300;
            canvas.height = 300;
            
            const startX = (video.videoWidth - size) / 2;
            const startY = (video.videoHeight - size) / 2;
            
            if (context) {
                context.drawImage(video, startX, startY, size, size, 0, 0, 300, 300);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                handlePhotoSelect(dataUrl);
            }
        }
    };

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isCameraActive]);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Avatar Galleries
    const initialsUrl = `https://ui-avatars.com/api/?name=${displayName}&background=random`;
    
    const abstractAvatars = [
        "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
        "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/bottts/svg?seed=Zoe",
        "https://api.dicebear.com/7.x/bottts/svg?seed=Jack"
    ];
    
    // Feature 1: More Styles
    const personaAvatars = [
        "https://api.dicebear.com/7.x/personas/svg?seed=Alex",
        "https://api.dicebear.com/7.x/personas/svg?seed=Maria",
        "https://api.dicebear.com/7.x/personas/svg?seed=John",
        "https://api.dicebear.com/7.x/personas/svg?seed=Sophie"
    ];

    const pixelAvatars = [
         "https://api.dicebear.com/7.x/pixel-art/svg?seed=Gamer",
         "https://api.dicebear.com/7.x/pixel-art/svg?seed=Coder",
         "https://api.dicebear.com/7.x/pixel-art/svg?seed=Artist",
         "https://api.dicebear.com/7.x/pixel-art/svg?seed=UBC"
    ];

    const colorAvatars = [
        `https://ui-avatars.com/api/?name=${displayName}&background=002145&color=fff`, // UBC Blue
        `https://ui-avatars.com/api/?name=${displayName}&background=E2A829&color=fff`, // UBC Gold
        `https://ui-avatars.com/api/?name=${displayName}&background=ef4444&color=fff`, // Red
        `https://ui-avatars.com/api/?name=${displayName}&background=10b981&color=fff`, // Green
    ];

    // Feature 4: Pets, Animals, Landscapes (Unsplash Source)
    const petsAvatars = [
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&h=200", // Dog
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&h=200", // Cat
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=200&h=200", // Dog 2
        "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=200&h=200"  // Cat 2
    ];

    const animalAvatars = [
        "https://images.unsplash.com/photo-1546182990-dced7187161b?auto=format&fit=crop&w=200&h=200", // Panda
        "https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=200&h=200", // Fox
        "https://images.unsplash.com/photo-1505624198937-c704aff7260c?auto=format&fit=crop&w=200&h=200", // Rabbit
        "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=200&h=200"  // Koala
    ];

    const landscapeAvatars = [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&h=200", // Mountain
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&h=200", // Beach
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&h=200", // Forest
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=200&h=200"  // Trees/Cypress
    ];

    return (
        <div className="h-full overflow-y-auto w-full">
            <div className="max-w-2xl mx-auto p-4 pb-20 md:p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">{t.profile_title}</h2>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-ubc-blue font-bold px-4 py-2 hover:bg-blue-50 rounded-lg transition">
                                <i className="fas fa-pencil-alt mr-2"></i>
                                {t.profile_edit}
                            </button>
                        )}
                    </div>

                    <div className="flex justify-center mb-8">
                        <div 
                            className={`relative group ${isEditing ? 'cursor-pointer' : ''}`}
                            onClick={() => isEditing && setIsPhotoModalOpen(true)}
                        >
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-ubc-gold bg-gray-200 shadow-lg">
                                <img 
                                    src={currentUser?.photoUrl || initialsUrl} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                                    <i className="fas fa-camera text-2xl"></i>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.profile_name}</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ubc-blue focus:border-transparent outline-none"
                                />
                            ) : (
                                <p className="text-lg font-medium border-b border-gray-100 pb-2">{displayName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.profile_major}</label>
                            {isEditing ? (
                                <select 
                                    value={major} 
                                    onChange={(e) => setMajor(e.target.value as Major)}
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-ubc-blue outline-none"
                                >
                                    <option value="" disabled>{t.profile_major_select}</option>
                                    {Object.values(Major).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-lg border-b border-gray-100 pb-2">{major || t.profile_major_none}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.profile_bio}</label>
                            {isEditing ? (
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ubc-blue focus:border-transparent outline-none resize-none h-24"
                                    placeholder={t.profile_bio_hint}
                                />
                            ) : (
                                <p className="text-base text-gray-600 border-b border-gray-100 pb-2 italic">
                                    {bio || t.profile_bio_none}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.profile_langs}</label>
                            {isEditing && <p className="text-xs text-gray-400 mb-2">{t.profile_langs_hint}</p>}
                            <div className="flex flex-wrap gap-2">
                                {Object.values(Language).map(lang => {
                                    const isSelected = selectedLanguages.includes(lang);
                                    if (!isEditing && !isSelected) return null;

                                    return (
                                        <button
                                            key={lang}
                                            disabled={!isEditing}
                                            onClick={() => handleLanguageToggle(lang)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition border
                                                ${isSelected 
                                                    ? 'bg-ubc-gold border-ubc-gold text-white shadow-sm' 
                                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {lang}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.profile_interests}</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(Interest).map(interest => {
                                    const isSelected = selectedInterests.includes(interest);
                                    if (!isEditing && !isSelected) return null;

                                    return (
                                        <button
                                            key={interest}
                                            disabled={!isEditing}
                                            onClick={() => handleInterestToggle(interest)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition border
                                                ${isSelected 
                                                    ? 'bg-ubc-gold border-ubc-gold text-white shadow-sm' 
                                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {interest}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.profile_region}</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={homeRegion}
                                    onChange={(e) => setHomeRegion(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ubc-blue outline-none"
                                    placeholder={t.profile_region_hint}
                                />
                            ) : (
                                <p className="text-lg border-b border-gray-100 pb-2">{homeRegion || t.profile_region_none}</p>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex gap-4 pt-8">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                            >
                                {t.profile_cancel}
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 py-3 text-white font-bold bg-ubc-blue rounded-xl shadow-lg hover:bg-ubc-blue/90 transition transform hover:-translate-y-1"
                            >
                                {t.profile_save}
                            </button>
                        </div>
                    )}

                    {!isEditing && (
                        <div className="md:hidden mt-8 pt-6 border-t border-gray-100">
                             <button 
                                onClick={handleLogout}
                                className="w-full py-3 text-red-500 font-medium border border-red-100 rounded-lg hover:bg-red-50"
                            >
                                {t.logout}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Selection Modal */}
            {isPhotoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-scale-in">
                        
                        {isCameraActive ? (
                            <div className="flex flex-col items-center">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">{t.profile_photo_take}</h3>
                                <div className="w-full aspect-square bg-black rounded-xl overflow-hidden mb-4 relative">
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="w-full h-full object-cover"
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                                <div className="flex gap-4 w-full">
                                    <button 
                                        onClick={stopCamera}
                                        className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                                    >
                                        {t.profile_photo_cancel}
                                    </button>
                                    <button 
                                        onClick={capturePhoto}
                                        className="flex-1 py-3 text-white font-bold bg-ubc-blue rounded-xl hover:bg-ubc-blue/90 transition"
                                    >
                                        {t.profile_photo_snap}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-800">{t.profile_photo_title}</h3>
                                    <button 
                                        onClick={() => setIsPhotoModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{t.profile_photo_custom}</h4>
                                        <div className="flex gap-3">
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
                                            >
                                                <i className="fas fa-upload text-ubc-blue"></i>
                                                {t.profile_photo_upload}
                                            </button>

                                            {isMobile && (
                                                <button 
                                                    onClick={startCamera}
                                                    className="flex-1 py-3 px-4 bg-ubc-blue text-white rounded-xl font-medium hover:bg-ubc-blue/90 transition flex items-center justify-center gap-2 shadow-md shadow-ubc-blue/20"
                                                >
                                                    <i className="fas fa-camera"></i>
                                                    {t.profile_photo_take}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{t.profile_photo_initials}</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {colorAvatars.map((url, index) => (
                                                <button 
                                                    key={index}
                                                    onClick={() => handlePhotoSelect(url)}
                                                    className="aspect-square rounded-full overflow-hidden hover:ring-4 ring-ubc-blue/30 transition-all active:scale-95"
                                                >
                                                    <img src={url} alt="Option" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Personality</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {personaAvatars.map((url, index) => (
                                                <button 
                                                    key={index}
                                                    onClick={() => handlePhotoSelect(url)}
                                                    className="aspect-square rounded-full overflow-hidden hover:ring-4 ring-ubc-blue/30 transition-all active:scale-95 bg-gray-50"
                                                >
                                                    <img src={url} alt="Option" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                     <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Pixel Art</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {pixelAvatars.map((url, index) => (
                                                <button 
                                                    key={index}
                                                    onClick={() => handlePhotoSelect(url)}
                                                    className="aspect-square rounded-full overflow-hidden hover:ring-4 ring-ubc-blue/30 transition-all active:scale-95 bg-gray-50"
                                                >
                                                    <img src={url} alt="Option" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Pets</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {petsAvatars.map((url, index) => (
                                                <button 
                                                    key={index}
                                                    onClick={() => handlePhotoSelect(url)}
                                                    className="aspect-square rounded-full overflow-hidden hover:ring-4 ring-ubc-blue/30 transition-all active:scale-95 bg-gray-50"
                                                >
                                                    <img src={url} alt="Pet" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Wildlife</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {animalAvatars.map((url, index) => (
                                                <button 
                                                    key={index}
                                                    onClick={() => handlePhotoSelect(url)}
                                                    className="aspect-square rounded-full overflow-hidden hover:ring-4 ring-ubc-blue/30 transition-all active:scale-95 bg-gray-50"
                                                >
                                                    <img src={url} alt="Animal" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Landscapes</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {landscapeAvatars.map((url, index) => (
                                                <button 
                                                    key={index}
                                                    onClick={() => handlePhotoSelect(url)}
                                                    className="aspect-square rounded-full overflow-hidden hover:ring-4 ring-ubc-blue/30 transition-all active:scale-95 bg-gray-50"
                                                >
                                                    <img src={url} alt="Landscape" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{t.profile_photo_abstract}</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {abstractAvatars.map((url, index) => (
                                                <button 
                                                    key={index}
                                                    onClick={() => handlePhotoSelect(url)}
                                                    className="aspect-square rounded-full overflow-hidden hover:ring-4 ring-ubc-blue/30 transition-all active:scale-95 bg-gray-50"
                                                >
                                                    <img src={url} alt="Option" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
