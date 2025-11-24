

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Language, NotificationSettings } from '../types';
import { TRANSLATIONS } from '../utils/translations';

export const SettingsView: React.FC = () => {
    const { currentUser, updateUserProfile, uiLanguage, setUiLanguage } = useAppStore();
    const t = TRANSLATIONS[uiLanguage];
    
    // UI for Language Dropdown
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    // Notification State Management
    // Fallback default if user model is older
    const settings = currentUser?.settings || { general: true, dailyMatches: true, directMessages: true };
    const isSearchable = currentUser?.isSearchable ?? true;

    const handleNotificationChange = async (key: keyof NotificationSettings) => {
        // Handle General Switch specifically
        if (key === 'general') {
            const isTurningOn = !settings.general;
            
            if (isTurningOn) {
                // Check browser support
                if (!('Notification' in window)) {
                    alert("Notifications are not supported by this browser.");
                    return;
                }

                // Check current permission
                if (Notification.permission === 'granted') {
                     updateUserProfile({ settings: { ...settings, general: true } });
                } else if (Notification.permission !== 'denied') {
                    // Request permission
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        updateUserProfile({ settings: { ...settings, general: true } });
                    }
                    // If dismissed/denied, do nothing (switch remains off)
                } else {
                    // Previously denied
                    alert("Notifications are blocked in your browser settings. Please enable them to receive updates.");
                }
            } else {
                // Turning OFF is always allowed
                updateUserProfile({ settings: { ...settings, general: false } });
            }
        } else {
            // Handle sub-switches (Daily, DM)
            // Only allow toggling if General is ON (though UI disables them, safe to check)
            if (settings.general) {
                 updateUserProfile({ settings: { ...settings, [key]: !settings[key] } });
            }
        }
    };

    const handlePrivacyChange = () => {
        updateUserProfile({ isSearchable: !isSearchable });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="h-full overflow-y-auto w-full p-4 md:p-8">
            <div className="max-w-2xl mx-auto pb-20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">{t.settings_title}</h2>
                
                {/* Language Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-globe text-ubc-blue"></i>
                        {t.settings_lang}
                    </h3>
                    
                    <div className="relative" ref={langMenuRef}>
                        <button 
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-ubc-blue/50 transition-colors"
                        >
                            <span className="font-medium text-gray-700">{uiLanguage}</span>
                            <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`}></i>
                        </button>
                        
                        {isLangMenuOpen && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30 max-h-60 overflow-y-auto animate-fade-in-up">
                                {Object.values(Language).map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setUiLanguage(lang);
                                            setIsLangMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between
                                            ${uiLanguage === lang ? 'bg-blue-50 text-ubc-blue font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {lang}
                                        {uiLanguage === lang && <i className="fas fa-check text-xs"></i>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i className="fas fa-lock text-ubc-blue"></i>
                        {t.settings_privacy}
                    </h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-700">{t.privacy_searchable}</h4>
                            <p className="text-sm text-gray-400">{t.privacy_searchable_desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isSearchable}
                                onChange={handlePrivacyChange}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ubc-gold"></div>
                        </label>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i className="fas fa-bell text-ubc-blue"></i>
                        {t.settings_notif}
                    </h3>

                    <div className="space-y-6">
                        {/* General Master Switch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-gray-700">{t.notif_general}</h4>
                                <p className="text-sm text-gray-400">{t.notif_general_desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={settings.general}
                                    onChange={() => handleNotificationChange('general')}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ubc-gold"></div>
                            </label>
                        </div>

                        <div className="border-t border-gray-100 my-4"></div>

                        {/* Specific Settings (Disabled visually if General is off) */}
                        <div className={`space-y-6 transition-opacity duration-300 ${!settings.general ? 'opacity-50 pointer-events-none' : ''}`}>
                            
                            {/* Daily Smart Matches */}
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <h4 className="font-medium text-gray-700">{t.notif_daily}</h4>
                                    <p className="text-xs text-gray-400 mt-1">{t.notif_daily_desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={settings.dailyMatches}
                                        onChange={() => handleNotificationChange('dailyMatches')}
                                        disabled={!settings.general}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ubc-gold"></div>
                                </label>
                            </div>

                            {/* Direct Messages */}
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <h4 className="font-medium text-gray-700">{t.notif_dm}</h4>
                                    <p className="text-xs text-gray-400 mt-1">{t.notif_dm_desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={settings.directMessages}
                                        onChange={() => handleNotificationChange('directMessages')}
                                        disabled={!settings.general}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ubc-gold"></div>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};