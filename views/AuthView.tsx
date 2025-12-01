
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

export const AuthView: React.FC = () => {
    const navigate = useNavigate();
    const { login, signup, error, isLoading, uiLanguage, setUiLanguage } = useAppStore();

    // UI Language State
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    
    const t = TRANSLATIONS[uiLanguage];

    // Mode Toggle
    const [isSignup, setIsSignup] = useState(false);

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showEmailWarning, setShowEmailWarning] = useState(false);

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

    const handleEmailBlur = () => {
        if (email.length > 0 && !email.endsWith('@student.ubc.ca')) {
            setShowEmailWarning(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Client-side Validation
        if (!email.endsWith('@student.ubc.ca')) {
            setFormError(t.emailError);
            setShowEmailWarning(true);
            return;
        }

        if (password.length < 6) {
            setFormError(t.passError);
            return;
        }

        if (isSignup && password !== confirmPassword) {
            setFormError(t.matchError);
            return;
        }

        // Execute Action
        if (isSignup) {
            await signup(email, password);
        } else {
            await login(email, password); 
        }

        // Navigation handled after state update check
        if (!useAppStore.getState().error && !useAppStore.getState().isLoading) {
            navigate('/profile');
        }
    };

    const toggleMode = () => {
        setIsSignup(!isSignup);
        setFormError(null);
        useAppStore.setState({ error: null }); 
        setPassword('');
        setConfirmPassword('');
    };

    // Full screen loading animation
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center animate-fade-in">
                <div className="relative">
                    {/* Pulsing circles */}
                    <div className="absolute inset-0 bg-ubc-blue opacity-20 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 bg-ubc-gold opacity-30 rounded-full animate-pulse delay-75"></div>
                    
                    <div className="relative z-10 w-24 h-24 bg-ubc-blue rounded-3xl flex items-center justify-center shadow-xl animate-bounce-slight">
                        <i className="fas fa-tree text-white text-5xl"></i>
                    </div>
                </div>
                <h2 className="mt-8 text-2xl font-bold text-ubc-blue tracking-wider animate-pulse">
                    {isSignup ? t.signupBtn : t.loginBtn}...
                </h2>
                <p className="text-gray-400 mt-2 text-sm">{t.subtitle}</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex bg-white overflow-hidden">
            
            {/* Warning Popup for Invalid Email */}
            {showEmailWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in px-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-scale-in border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce-slight">
                            <i className="fas fa-university text-red-500 text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Student Verification</h3>
                        <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
                            Cypress is exclusive to UBC students. Please use your <strong>@student.ubc.ca</strong> email address to access the platform.
                        </p>
                        <button 
                            onClick={() => setShowEmailWarning(false)}
                            className="w-full py-3.5 bg-ubc-blue text-white rounded-xl font-bold hover:bg-ubc-blue/90 transition shadow-lg shadow-ubc-blue/20"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            {/* Left Side - Desktop Only - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-ubc-blue relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-ubc-blue to-[#001529] z-0"></div>
                
                {/* Abstract Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-ubc-gold rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 text-center p-12 text-white max-w-lg">
                     <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-3xl rotate-6 shadow-2xl flex items-center justify-center mx-auto mb-10 animate-float border border-white/20">
                        <i className="fas fa-tree text-ubc-gold text-5xl drop-shadow-lg"></i>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight mb-6">Cypress</h1>
                    <p className="text-xl text-blue-100/90 leading-relaxed font-light">
                        Discover connections beyond the classroom. Match based on majors, interests, and languages.
                    </p>
                    
                    <div className="mt-12 flex justify-center gap-4 text-sm font-medium text-blue-200">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
                            <i className="fas fa-check-circle text-ubc-gold"></i>
                            Verified Students
                        </div>
                         <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
                            <i className="fas fa-shield-alt text-ubc-gold"></i>
                            Secure Chat
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-gray-50 lg:bg-white overflow-y-auto">
                
                {/* Language Selector */}
                <div className="absolute top-6 right-6 z-20" ref={langMenuRef}>
                    <div className="relative">
                        <button 
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-white lg:bg-gray-50 rounded-xl shadow-sm border border-gray-200 text-sm font-bold text-gray-600 hover:text-ubc-blue hover:border-ubc-blue/30 transition-all"
                        >
                            <i className="fas fa-globe text-ubc-blue"></i>
                            <span className="max-w-[100px] truncate">{uiLanguage}</span>
                            <i className={`fas fa-chevron-down text-xs ml-1 opacity-50 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`}></i>
                        </button>
                        
                        {isLangMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30 max-h-80 overflow-y-auto animate-fade-in-up">
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

                <div className="w-full max-w-md">
                    {/* Mobile Branding (Hidden on Desktop) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-20 h-20 bg-ubc-blue rounded-2xl rotate-3 shadow-lg flex items-center justify-center mx-auto mb-5 transition-transform hover:rotate-6 group">
                            <i className="fas fa-tree text-white text-4xl group-hover:scale-110 transition-transform"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-ubc-blue tracking-tight">Cypress</h1>
                        <p className="text-gray-500 text-sm mt-2">{t.subtitle}</p>
                    </div>

                    {/* Auth Card Content */}
                    <div className="lg:p-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            {isSignup ? t.create : t.welcome}
                        </h2>
                        <p className="text-gray-500 mb-8">{t.subtitle}</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1 uppercase" htmlFor="email">Student Email</label>
                                <div className="relative group">
                                    <i className="fas fa-envelope absolute left-4 top-3.5 text-gray-400 group-focus-within:text-ubc-blue transition-colors"></i>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        autoComplete="username"
                                        required
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-ubc-blue outline-none transition-all placeholder-gray-400 text-sm font-medium
                                            ${showEmailWarning ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200'}
                                        `}
                                        placeholder={t.placeholderEmail}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={handleEmailBlur}
                                    />
                                    {showEmailWarning && <i className="fas fa-exclamation-circle absolute right-4 top-3.5 text-red-400 animate-pulse"></i>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1 uppercase" htmlFor="password">Password</label>
                                <div className="relative group">
                                    <i className="fas fa-lock absolute left-4 top-3.5 text-gray-400 group-focus-within:text-ubc-blue transition-colors"></i>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        autoComplete={isSignup ? "new-password" : "current-password"}
                                        required
                                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-ubc-blue outline-none transition-all placeholder-gray-400 text-sm font-medium"
                                        placeholder={t.placeholderPass}
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
                            </div>

                            {isSignup && (
                                <div className="space-y-1 animate-fade-in-up">
                                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase" htmlFor="confirmPassword">Confirm</label>
                                    <div className="relative group">
                                        <i className="fas fa-check-circle absolute left-4 top-3.5 text-gray-400 group-focus-within:text-ubc-blue transition-colors"></i>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            autoComplete="new-password"
                                            required
                                            className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white focus:bg-white focus:ring-4 outline-none transition-all placeholder-gray-400 text-sm font-medium
                                                ${confirmPassword && password !== confirmPassword 
                                                    ? 'border-red-300 focus:ring-red-50' 
                                                    : 'border-gray-200 focus:ring-blue-50 focus:border-ubc-blue'
                                                }`}
                                            placeholder={t.placeholderConfirm}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error Messages */}
                            {(error || formError) && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-shake border border-red-100">
                                    <i className="fas fa-exclamation-circle text-lg"></i>
                                    <span>{formError || (error === "The email is already been used." ? t.emailInUse : error)}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-ubc-blue text-white font-bold py-4 rounded-xl hover:bg-ubc-blue/90 active:scale-[0.98] transition-all shadow-xl shadow-ubc-blue/20 text-base"
                            >
                                {isSignup ? t.signupBtn : t.loginBtn}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-500 mb-2">
                                {isSignup ? t.haveAccount : t.noAccount}
                            </p>
                            <button
                                onClick={toggleMode}
                                className="text-ubc-blue font-bold text-sm hover:underline focus:outline-none p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                {isSignup ? t.toggleLogin : t.toggleSignup}
                            </button>
                        </div>
                        
                        <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                             <p className="text-xs text-gray-400 max-w-xs mx-auto">
                                {t.terms}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
