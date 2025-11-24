
/* This is the 'chats' view */
import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { TRANSLATIONS } from '../utils/translations';

export const ConnectionsView: React.FC = () => {
    const { connections, fetchConnections, isLoading, uiLanguage } = useAppStore();
    const navigate = useNavigate();
    const t = TRANSLATIONS[uiLanguage];

    useEffect(() => {
        fetchConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChatClick = (uid: string) => {
        navigate(`/chat/${uid}`);
    };

    return (
        <div className="h-full overflow-y-auto w-full p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
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
