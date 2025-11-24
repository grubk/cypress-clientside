

import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthView } from './views/AuthView';
import { ProfileView } from './views/ProfileView';
import { DiscoveryView } from './views/DiscoveryView';
import { ConnectionsView } from './views/ConnectionsView';
import { ChatView } from './views/ChatView';
import { SettingsView } from './views/SettingsView';
import { PublicProfileView } from './views/PublicProfileView';
import { useAppStore } from './store/useAppStore';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAppStore();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <MemoryRouter>
            <Layout>
                <Routes>
                    <Route path="/login" element={<AuthView />} />
                    
                    <Route path="/" element={
                        <ProtectedRoute>
                            <DiscoveryView />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfileView />
                        </ProtectedRoute>
                    } />

                    <Route path="/user/:uid" element={
                        <ProtectedRoute>
                            <PublicProfileView />
                        </ProtectedRoute>
                    } />

                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <SettingsView />
                        </ProtectedRoute>
                    } />

                    <Route path="/connections" element={
                        <ProtectedRoute>
                            <ConnectionsView />
                        </ProtectedRoute>
                    } />

                    <Route path="/chat/:uid" element={
                        <ProtectedRoute>
                            <ChatView />
                        </ProtectedRoute>
                    } />
                    
                    {/* Default redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </MemoryRouter>
    );
};

export default App;