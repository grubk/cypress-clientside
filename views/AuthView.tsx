
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export const AuthView: React.FC = () => {
    const navigate = useNavigate();
    const { login, signup, error, isLoading } = useAppStore();

    // Mode Toggle
    const [isSignup, setIsSignup] = useState(false);

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Client-side Validation
        if (!email.endsWith('@student.ubc.ca')) {
            setFormError('Please use a valid @student.ubc.ca email address.');
            return;
        }

        if (password.length < 6) {
            setFormError('Password must be at least 6 characters.');
            return;
        }

        if (isSignup && password !== confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }

        // Execute Action
        if (isSignup) {
            await signup(email, password);
        } else {
            await login(email); // Password would be passed here in real app
        }

        // Navigation handled after state update check
        if (!useAppStore.getState().error && !useAppStore.getState().isLoading) {
            // If signup, we probably want to send them to profile creation
            // If login, maybe discovery or profile. 
            navigate('/profile');
        }
    };

    const toggleMode = () => {
        setIsSignup(!isSignup);
        setFormError(null);
        useAppStore.setState({ error: null }); // Clear global error
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">
            {/* Logo / Branding */}
            <div className="mb-8 text-center animate-fade-in-down">
                <div className="w-20 h-20 bg-ubc-blue rounded-2xl rotate-3 shadow-lg flex items-center justify-center mx-auto mb-5 transition-transform hover:rotate-6">
                    <i className="fas fa-tree text-white text-4xl"></i>
                </div>
                <h1 className="text-3xl font-bold text-ubc-blue tracking-tight">Cypress</h1>
                <p className="text-gray-500 text-sm mt-2">Connect with your UBC peers</p>
            </div>

            {/* Auth Card */}
            <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden relative">
                
                {/* Header Text */}
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                    {isSignup ? 'Create an Account' : 'Welcome Back'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Email Input */}
                    <div className="relative">
                        <i className="fas fa-envelope absolute left-4 top-3.5 text-gray-400"></i>
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-ubc-blue focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm"
                            placeholder="cwl@student.ubc.ca"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <i className="fas fa-lock absolute left-4 top-3.5 text-gray-400"></i>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-ubc-blue focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>

                    {/* Confirm Password (Signup Only) */}
                    {isSignup && (
                        <div className="relative animate-fade-in-up">
                            <i className="fas fa-check-circle absolute left-4 top-3.5 text-gray-400"></i>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:ring-2 outline-none transition-all placeholder-gray-400 text-sm
                                    ${confirmPassword && password !== confirmPassword 
                                        ? 'border-red-300 focus:ring-red-200' 
                                        : 'border-gray-200 focus:ring-ubc-blue focus:border-transparent'
                                    }`}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Error Messages */}
                    {(error || formError) && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-pulse">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{formError || error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-ubc-blue text-white font-bold py-3.5 rounded-xl hover:bg-ubc-blue/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-ubc-blue/20"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fas fa-circle-notch fa-spin"></i>
                                {isSignup ? 'Creating Account...' : 'Logging In...'}
                            </span>
                        ) : (
                            isSignup ? 'Sign Up' : 'Log In'
                        )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-6 text-center border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500">
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}
                    </p>
                    <button
                        onClick={toggleMode}
                        className="text-ubc-blue font-bold text-sm mt-1 hover:underline focus:outline-none"
                    >
                        {isSignup ? 'Log in here' : 'Sign up now'}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-xs text-gray-400 text-center max-w-xs">
                By continuing, you agree to our Terms of Service & Privacy Policy.
            </p>
        </div>
    );
};
