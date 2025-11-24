import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/*
 * DiscoveryView
 * 
 * Abstraction Function:
 * Renders the top card from the match queue.
 * Provides controls for Dismiss/Connect.
 */
export const DiscoveryView: React.FC = () => {
    const { matchQueue, fetchMatches, handleSwipe, isLoading } = useAppStore();

    useEffect(() => {
        if (matchQueue.length === 0) {
            fetchMatches();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeCard = matchQueue[0];

    if (isLoading && matchQueue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <i className="fas fa-circle-notch fa-spin text-3xl mb-3"></i>
                <p>Finding students...</p>
            </div>
        );
    }

    if (!activeCard) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <i className="fas fa-search text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-700">No new matches</h3>
                <p className="text-gray-500 mt-2">Check back later for more students in your area!</p>
                <button onClick={() => fetchMatches()} className="mt-6 text-ubc-blue font-bold">
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Card Container */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col relative">
                {/* Photo */}
                <div className="h-3/5 bg-gray-200 relative">
                    <img 
                        src={activeCard.photoUrl} 
                        alt={activeCard.displayName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                         <h2 className="text-white text-3xl font-bold">{activeCard.displayName}</h2>
                         <p className="text-white/90 text-lg">{activeCard.major}</p>
                    </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {activeCard.homeRegion && (
                        <div className="mb-4 flex items-center text-gray-600">
                            <i className="fas fa-map-marker-alt w-6 text-center mr-2"></i>
                            <span>{activeCard.homeRegion}</span>
                        </div>
                    )}
                    
                    <div className="mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Common Interests</h4>
                        <div className="flex flex-wrap gap-2">
                            {activeCard.commonInterests.map(interest => (
                                <span key={interest} className="bg-ubc-gold/20 text-ubc-blue px-3 py-1 rounded-full text-sm font-medium">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>

                    {activeCard.languages && (
                        <div className="mt-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Languages</h4>
                            <p className="text-gray-700 text-sm">{activeCard.languages.join(', ')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="h-24 flex items-center justify-center gap-8 px-4">
                <button 
                    onClick={() => handleSwipe(activeCard.uid, 'DISMISS')}
                    className="w-14 h-14 rounded-full bg-white shadow-lg text-gray-400 text-2xl hover:bg-gray-50 hover:text-red-500 transition border border-gray-200 flex items-center justify-center"
                    aria-label="Dismiss"
                >
                    <i className="fas fa-times"></i>
                </button>

                <button 
                    onClick={() => handleSwipe(activeCard.uid, 'CONNECT')}
                    className="w-16 h-16 rounded-full bg-ubc-blue shadow-lg shadow-ubc-blue/30 text-white text-3xl hover:bg-opacity-90 transition flex items-center justify-center transform hover:scale-105"
                    aria-label="Connect"
                >
                    <i className="fas fa-heart"></i>
                </button>
            </div>
        </div>
    );
};