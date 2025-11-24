
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Link, useLocation } from 'react-router-dom';
import { TRANSLATIONS } from '../utils/translations';

/*
 * Layout Component
 * Wraps pages in a responsive container.
 * Mobile: Bottom Navigation, constrained width.
 * Desktop: Sidebar Navigation, fills screen with dashboard layout.
 */
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, logout, uiLanguage } = useAppStore();
    const location = useLocation();
    const t = TRANSLATIONS[uiLanguage];

    // Helper to check active route for styling
    const isActive = (path: string) => location.pathname === path ? 'text-ubc-blue' : 'text-gray-400';
    const isActiveDesktop = (path: string) => location.pathname === path ? 'bg-blue-800/50 border-l-4 border-ubc-gold' : 'hover:bg-blue-800/30';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row h-screen overflow-hidden">
            
            {/* Desktop/Laptop Sidebar Navigation */}
            {isAuthenticated && (
                <aside className="hidden md:flex flex-col w-64 bg-ubc-blue text-white shadow-xl z-20 shrink-0">
                    <div className="p-6 flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                            <i className="fas fa-tree text-ubc-gold text-xl"></i>
                         </div>
                        <h1 className="text-2xl font-bold tracking-tight">Cypress</h1>
                    </div>
                    
                    <nav className="flex-1 px-4 space-y-2 mt-4">
                        <Link to="/" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActiveDesktop('/')}`}>
                            <i className="fas fa-fire w-6 text-center"></i>
                            <span className="font-medium">{t.nav_discover}</span>
                        </Link>
                        <Link to="/connections" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActiveDesktop('/connections')}`}>
                            <i className="fas fa-comments w-6 text-center"></i>
                            <span className="font-medium">{t.nav_chats}</span>
                        </Link>
                        <Link to="/profile" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActiveDesktop('/profile')}`}>
                            <i className="fas fa-user w-6 text-center"></i>
                            <span className="font-medium">{t.nav_profile}</span>
                        </Link>
                        <Link to="/settings" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActiveDesktop('/settings')}`}>
                            <i className="fas fa-cog w-6 text-center"></i>
                            <span className="font-medium">{t.nav_settings}</span>
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-blue-900/50">
                        <button 
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-red-500/20 w-full rounded-lg transition"
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            <span>{t.logout}</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                
                {/* Mobile Header */}
                <header className="md:hidden bg-ubc-blue text-white p-4 text-center font-bold text-xl sticky top-0 z-50 shadow-md shrink-0">
                    Cypress
                </header>

                {/* Content Frame */}
                <main className="flex-1 relative w-full h-full bg-gray-100 md:bg-gray-50">
                    {/* On Desktop, we center content for some views, or fill for others */}
                    <div className="w-full h-full">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                {isAuthenticated && (
                    <nav className="md:hidden shrink-0 bg-white border-t border-gray-200 flex justify-around py-3 pb-5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
                        <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
                            <i className="fas fa-fire text-xl mb-1"></i>
                            <span className="text-xs">{t.nav_discover}</span>
                        </Link>
                        <Link to="/connections" className={`flex flex-col items-center ${isActive('/connections')}`}>
                            <i className="fas fa-comments text-xl mb-1"></i>
                            <span className="text-xs">{t.nav_chats}</span>
                        </Link>
                        <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile')}`}>
                            <i className="fas fa-user text-xl mb-1"></i>
                            <span className="text-xs">{t.nav_profile}</span>
                        </Link>
                        <Link to="/settings" className={`flex flex-col items-center ${isActive('/settings')}`}>
                            <i className="fas fa-cog text-xl mb-1"></i>
                            <span className="text-xs">{t.nav_settings}</span>
                        </Link>
                    </nav>
                )}
            </div>
        </div>
    );
};
