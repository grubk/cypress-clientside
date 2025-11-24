import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Link, useLocation } from 'react-router-dom';

/*
 * Layout Component
 * Wraps pages in a mobile-constrained container with navigation.
 */
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAppStore();
    const location = useLocation();

    // Helper to check active route for styling
    const isActive = (path: string) => location.pathname === path ? 'text-ubc-blue' : 'text-gray-400';

    return (
        <div className="min-h-screen bg-gray-200 flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative flex flex-col">
                {/* Header */}
                <header className="bg-ubc-blue text-white p-4 text-center font-bold text-xl sticky top-0 z-50">
                    Cypress
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 pb-20">
                    {children}
                </main>

                {/* Bottom Navigation (Only if authenticated) */}
                {isAuthenticated && (
                    <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 pb-5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                        <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
                            <i className="fas fa-fire text-xl mb-1"></i>
                            <span className="text-xs">Discover</span>
                        </Link>
                        <Link to="/connections" className={`flex flex-col items-center ${isActive('/connections')}`}>
                            <i className="fas fa-comments text-xl mb-1"></i>
                            <span className="text-xs">Chats</span>
                        </Link>
                        <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile')}`}>
                            <i className="fas fa-user text-xl mb-1"></i>
                            <span className="text-xs">Profile</span>
                        </Link>
                    </nav>
                )}
            </div>
        </div>
    );
};