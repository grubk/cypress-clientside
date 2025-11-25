

/* This is the 'chats' view */
import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { TRANSLATIONS } from '../utils/translations';
import { Link } from 'react-router-dom';

export const ConnectionsView: React.FC = () => {
    const { connections, fetchConnections, incomingRequests, fetchIncomingRequests, respondToRequest, isLoading, uiLanguage } = useAppStore();
    const navigate = useNavigate();
    const t = TRANSLATIONS[uiLanguage];

    useEffect(() => {
        fetchConnections();
        fetchIncomingRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChatClick = (uid: string) => {
        navigate(`/chat/${uid}`);
    };

    return (
        <div className="h-full overflow-y-auto w-full p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                
                {/* Friend Requests Box */}
                {incomingRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                            Friend Requests
                            <span className="bg-red-500 text-white text-xs py-0.5 px-2 rounded-full">{incomingRequests.length}</span>
                        </h2>
                        <div className="space-y-3">
                            {incomingRequests.map(req => (
                                <div key={req.uid} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 border-l-4 border-l-ubc-gold flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up">
                                    <img 
                                        src={req.photoUrl} 
                                        alt={req.displayName} 
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                    <div className="flex-1 text-center sm:text-left">
                                        <Link to={`/user/${req.uid}`} className="font-bold text-gray-900 text-lg hover:underline">{req.displayName}</Link>
                                        <p className="text-sm text-ubc-blue font-medium">{req.major}</p>
                                        {req.commonInterests.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                <i className="fas fa-star text-ubc-gold mr-1"></i>
                                                {req.commonInterests.length} common interests
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                            onClick={() => respondToRequest(req.uid, 'DECLINE')}
                                            className="flex-1 sm:flex-none py-2 px-4 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition"
                                        >
                                            Decline
                                        </button>
                                        <button 
                                            onClick={() => respondToRequest(req.uid, 'ACCEPT')}
                                            className="flex-1 sm:flex-none py-2 px-6 rounded-lg font-bold text-white bg-ubc-blue hover:bg-ubc-blue/90 shadow-md shadow-ubc-blue/20 transition"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">{t.conn_title}</h2>
                
                {isLoading && connections.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">{t.conn_loading}</div>
                ) : connections.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-user-friends text-2xl text-gray-400"></i>
                        </div>
                        <p className="text-gray-900 font-bold">{t.conn_empty}</p>
                        <p className="text-sm text-gray-500 mt-1">{t.conn_empty_sub}</p>
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {connections.map(conn => (
                            <div 
                                key={conn.uid} 
                                onClick={() => handleChatClick(conn.uid)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md hover:border-ubc-blue/30 transition cursor-pointer active:scale-[0.99] group"
                            >
                                <img 
                                    src={conn.photoUrl} 
                                    alt={conn.displayName} 
                                    className="w-14 h-14 rounded-full object-cover bg-gray-200 border border-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{conn.displayName}</h3>
                                    <p className="text-sm text-gray-500 truncate">{conn.major}</p>
                                </div>
                                <button className="w-10 h-10 rounded-full bg-blue-50 text-ubc-blue flex items-center justify-center group-hover:bg-ubc-blue group-hover:text-white transition-colors">
                                    <i className="fas fa-comment"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};