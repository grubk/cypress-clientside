

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TRANSLATIONS } from '../utils/translations';
import { Link } from 'react-router-dom';

/*
 * DiscoveryView
 * 
 * Abstraction Function:
 * Renders the top card from the match queue.
 * Provides controls for Dismiss/Connect.
 * Responsive: Cards expand or center based on viewport.
 */
export const DiscoveryView: React.FC = () => {
    const { matchQueue, fetchMatches, handleSwipe, isLoading, uiLanguage, searchUsers, searchResults } = useAppStore();
    const t = TRANSLATIONS[uiLanguage];
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (matchQueue.length === 0) {
            fetchMatches();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchUsers(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, searchUsers]);

    const activeCard = matchQueue[0];

    // Toggle view mode based on search input
    const showSearchResults = searchQuery.length > 0;

    if (isLoading && matchQueue.length === 0 && !showSearchResults) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-ubc-blue rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 font-medium">{t.disc_finding}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full relative">
            
            {/* Search Bar - Floating or Fixed */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-center pointer-events-none">
                <div className="w-full max-w-md pointer-events-auto shadow-lg rounded-2xl">
                    <div className="relative group">
                        <i className="fas fa-search absolute left-4 top-3.5 text-gray-400 group-focus-within:text-ubc-blue transition-colors"></i>
                        <input
                            type="text"
                            placeholder={t.disc_search_placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl focus:ring-2 focus:ring-ubc-blue focus:border-transparent outline-none transition-all shadow-sm font-medium"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3 w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-300"
                            >
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 pt-20 p-4 overflow-y-auto">
                
                {/* Search Results Mode */}
                {showSearchResults ? (
                    <div className="max-w-2xl mx-auto pb-20">
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                            {t.disc_search_results} ({searchResults.length})
                        </h3>
                        
                        {searchResults.length === 0 && !isLoading ? (
                            <div className="text-center py-10 text-gray-500 bg-white/50 rounded-xl">
                                <i className="fas fa-user-slash text-2xl mb-2 text-gray-400"></i>
                                <p>{t.disc_search_none}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {searchResults.map(profile => (
                                    <div key={profile.uid} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                                        <img 
                                            src={profile.photoUrl} 
                                            alt={profile.displayName} 
                                            className="w-16 h-16 rounded-full object-cover bg-gray-100"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/user/${profile.uid}`} className="font-bold text-gray-800 text-lg hover:text-ubc-blue hover:underline decoration-2 underline-offset-2">
                                                {profile.displayName}
                                            </Link>
                                            <p className="text-ubc-blue text-sm font-medium">{profile.major}</p>
                                            {profile.homeRegion && <p className="text-gray-400 text-xs mt-0.5"><i className="fas fa-map-marker-alt mr-1"></i>{profile.homeRegion}</p>}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                handleSwipe(profile.uid, 'CONNECT');
                                                setSearchQuery(''); // Clear search on connect
                                            }}
                                            className="w-10 h-10 rounded-full bg-blue-50 text-ubc-blue hover:bg-ubc-blue hover:text-white flex items-center justify-center transition-colors"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Swipe Card Mode */
                    <div className="h-full flex flex-col justify-center items-center pb-10">
                        {!activeCard ? (
                             <div className="flex flex-col items-center justify-center text-center max-w-sm">
                                <div className="bg-white p-8 rounded-2xl shadow-sm w-full">
                                    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                        <i className="fas fa-search text-4xl text-gray-400"></i>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-700">{t.disc_no_new}</h3>
                                    <p className="text-gray-500 mt-2">{t.disc_check_later}</p>
                                    <button onClick={() => fetchMatches()} className="mt-6 w-full py-3 bg-ubc-blue text-white rounded-xl font-bold shadow hover:bg-ubc-blue/90 transition">
                                        {t.disc_refresh}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-md md:max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row h-[80vh] md:h-[600px] relative transition-all duration-300">
                                {/* Photo Section */}
                                <div className="h-3/5 md:h-full md:w-1/2 bg-gray-200 relative">
                                    <img 
                                        src={activeCard.photoUrl} 
                                        alt={activeCard.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10"></div>
                                    
                                    <div className="absolute bottom-0 left-0 w-full p-6 text-white md:hidden">
                                        <Link to={`/user/${activeCard.uid}`} className="text-3xl font-bold shadow-black drop-shadow-md hover:underline decoration-2 underline-offset-4 decoration-ubc-gold">
                                            {activeCard.displayName}
                                        </Link>
                                        <p className="text-lg opacity-90 drop-shadow-md">{activeCard.major}</p>
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="flex-1 flex flex-col p-6 md:p-8 bg-white relative">
                                    <div className="hidden md:block mb-6 border-b border-gray-100 pb-4">
                                        <Link to={`/user/${activeCard.uid}`} className="text-3xl font-bold text-gray-900 hover:text-ubc-blue hover:underline decoration-4 underline-offset-4 decoration-ubc-gold transition-all">
                                            {activeCard.displayName}
                                        </Link>
                                        <p className="text-xl text-ubc-blue font-medium">{activeCard.major}</p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-6">
                                        {activeCard.bio && (
                                             <div className="text-gray-600 italic">
                                                "{activeCard.bio}"
                                            </div>
                                        )}

                                        {activeCard.homeRegion && (
                                            <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                <i className="fas fa-map-marker-alt w-8 text-center text-ubc-gold text-lg"></i>
                                                <span className="font-medium">{activeCard.homeRegion}</span>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{t.disc_common}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {activeCard.commonInterests.map(interest => (
                                                    <span key={interest} className="bg-blue-50 text-ubc-blue px-4 py-2 rounded-full text-sm font-bold border border-blue-100">
                                                        {interest}
                                                    </span>
                                                ))}
                                                {activeCard.commonInterests.length === 0 && <p className="text-sm text-gray-400 italic">{t.disc_common_none}</p>}
                                            </div>
                                        </div>

                                        {activeCard.languages && activeCard.languages.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{t.disc_langs}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeCard.languages.map(lang => (
                                                        <span key={lang} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-8 md:justify-around">
                                        <button 
                                            onClick={() => handleSwipe(activeCard.uid, 'DISMISS')}
                                            className="w-16 h-16 rounded-full bg-white shadow-lg text-gray-400 text-3xl hover:bg-red-50 hover:text-red-500 hover:scale-110 transition-all border border-gray-200 flex items-center justify-center group"
                                            aria-label="Dismiss"
                                        >
                                            <i className="fas fa-times group-hover:rotate-90 transition-transform duration-300"></i>
                                        </button>

                                        <button 
                                            onClick={() => handleSwipe(activeCard.uid, 'CONNECT')}
                                            className="w-20 h-20 rounded-full bg-ubc-blue shadow-xl shadow-ubc-blue/30 text-white text-4xl hover:bg-ubc-blue/90 hover:scale-110 transition-all flex items-center justify-center"
                                            aria-label="Connect"
                                        >
                                            <i className="fas fa-heart animate-pulse"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};