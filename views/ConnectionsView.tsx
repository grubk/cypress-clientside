
/* This is the 'chats' view */
import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export const ConnectionsView: React.FC = () => {
    const { connections, fetchConnections, isLoading } = useAppStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChatClick = (uid: string) => {
        navigate(`/chat/${uid}`);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Connections</h2>
            
            {isLoading && connections.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : connections.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <p>No connections yet.</p>
                    <p className="text-sm">Start swiping to find friends!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {connections.map(conn => (
                        <div 
                            key={conn.uid} 
                            onClick={() => handleChatClick(conn.uid)}
                            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-pointer active:scale-[0.99]"
                        >
                            <img 
                                src={conn.photoUrl} 
                                alt={conn.displayName} 
                                className="w-14 h-14 rounded-full object-cover bg-gray-200"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{conn.displayName}</h3>
                                <p className="text-sm text-gray-500">{conn.major}</p>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-blue-50 text-ubc-blue flex items-center justify-center">
                                <i className="fas fa-comment"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
