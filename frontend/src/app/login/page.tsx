'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Droplets, Shield, Scale, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { useAuthStore } from '@/lib/stores/authStore';

interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

const MOCK_CREDENTIALS = {
    healthOfficer: { email: 'priya.sharma@aquapulse.gov.in', password: 'AquaPulse@2025', role: 'health_officer' },
    admin: { email: 'admin@aquapulse.ai', password: 'ChangeThisInProduction@2026', role: 'admin' },
};

function AnimatedGradientBg() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10"
                style={{
                    background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)',
                    animation: 'float1 12s ease-in-out infinite',
                }}
            />
            <div
                className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-8"
                style={{
                    background: 'radial-gradient(circle, #7f77dd 0%, transparent 70%)',
                    animation: 'float2 15s ease-in-out infinite',
                }}
            />
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
                style={{
                    background: 'radial-gradient(circle, #1d9e75 0%, transparent 60%)',
                    animation: 'float3 20s ease-in-out infinite',
                }}
            />
            {/* Grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />
            <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-50px, 30px) scale(1.08); }
          70% { transform: translate(20px, -20px) scale(0.92); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
        </div>
    );
}

function WaterWaveIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="23" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
            <circle cx="24" cy="24" r="16" fill="rgba(0,212,255,0.08)" stroke="#00d4ff" strokeWidth="1" opacity="0.8" />
            <path d="M14 26c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M14 22c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <circle cx="24" cy="17" r="2.5" fill="#00d4ff" opacity="0.8" />
            <path d="M24 14.5v-2M21.5 15.5l-1.5-1.5M26.5 15.5l1.5-1.5" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export default function SignUpLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<LoginFormData>({
        defaultValues: { email: '', password: '', rememberMe: false },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setApiError(null);

        const { email, password } = data;

        try {
            await login({ email, password });

            setLoginSuccess(true);
            const user = useAuthStore.getState().user;

            toast.success(
                user?.role === 'admin'
                    ? 'Welcome back, Admin. Redirecting...'
                    : 'Welcome. Loading your dashboard...',
                {
                    style: { background: '#1d9e75', color: '#fff', border: 'none' },
                }
            );

            if (user?.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setApiError(error.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fillCredentials = (type: 'healthOfficer' | 'admin') => {
        const creds = MOCK_CREDENTIALS[type];
        setValue('email', creds.email);
        setValue('password', creds.password);
    };

    return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center relative overflow-hidden px-4">
            <AnimatedGradientBg />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo + Tagline */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <WaterWaveIcon />
                        <div className="flex items-center gap-2">
                            <AppLogo size={36} />
                            <span className="text-2xl font-bold text-white tracking-tight">AquaPulse AI</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                            Water Safety
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-teal-400" />
                            Disease Prevention
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-purple-400" />
                            Justice
                        </span>
                    </div>
                </div>

                {/* Login Card */}
                <div
                    className="bg-navy-800 border border-navy-600 rounded-2xl p-8 shadow-2xl"
                    style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.05)' }}
                >
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold text-white mb-1">Sign in to your account</h1>
                        <p className="text-sm text-slate-400">
                            Accounts are provisioned by system administrators only.
                        </p>
                    </div>

                    {/* Success State */}
                    {loginSuccess && (
                        <div className="mb-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center gap-2 text-teal-400 text-sm animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            Authentication successful. Redirecting...
                        </div>
                    )}

                    {/* API Error */}
                    {apiError && (
                        <div className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/30 flex items-start gap-2 text-coral text-sm animate-fade-in">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{apiError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email address
                            </label>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.gov.in"
                                className={`w-full bg-navy-900 border rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-150 focus:ring-1 focus:ring-cyan-400/60 focus:border-cyan-400/60 ${errors.email ? 'border-coral/60 bg-coral/5' : 'border-navy-600 hover:border-navy-500'
                                    }`}
                                {...register('email', {
                                    required: 'Email address is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Enter a valid email address',
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-coral flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••••••"
                                    className={`w-full bg-navy-900 border rounded-lg px-4 py-2.5 pr-11 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-150 focus:ring-1 focus:ring-cyan-400/60 focus:border-cyan-400/60 ${errors.password ? 'border-coral/60 bg-coral/5' : 'border-navy-600 hover:border-navy-500'
                                        }`}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-coral flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2.5">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                className="w-4 h-4 rounded border-navy-600 bg-navy-900 accent-cyan-400 cursor-pointer"
                                {...register('rememberMe')}
                            />
                            <label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer select-none">
                                Keep me signed in for 7 days
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || loginSuccess}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold text-navy-900 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{
                                background: isLoading || loginSuccess
                                    ? 'rgba(0,212,255,0.5)'
                                    : 'linear-gradient(135deg, #00d4ff 0%, #00b8e0 100%)',
                                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(0,212,255,0.3)',
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Authenticating...
                                </>
                            ) : loginSuccess ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Redirecting...
                                </>
                            ) : (
                                'Sign in to AquaPulse AI'
                            )}
                        </button>
                    </form>

                    {/* WebSocket status indicator */}
                    <div className="mt-5 pt-5 border-t border-navy-600 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Wifi className="w-3.5 h-3.5" />
                        <span>End-to-end encrypted · HTTPS only · MeitY compliant</span>
                    </div>
                </div>

                {/* Demo Credentials Box */}
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                    <p className="text-xs font-semibold text-cyan-400 mb-3 uppercase tracking-wider">
                        Demo Credentials
                    </p>
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-400">Health Officer</span>
                                <button
                                    onClick={() => fillCredentials('healthOfficer')}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                                >
                                    Auto-fill →
                                </button>
                            </div>
                            <div className="font-mono text-xs text-slate-300 bg-navy-900 rounded-lg px-3 py-2 space-y-0.5">
                                <div><span className="text-slate-500">Email:</span> {MOCK_CREDENTIALS.healthOfficer.email}</div>
                                <div><span className="text-slate-500">Pass:</span> {MOCK_CREDENTIALS.healthOfficer.password}</div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-400">Administrator</span>
                                <button
                                    onClick={() => fillCredentials('admin')}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                                >
                                    Auto-fill →
                                </button>
                            </div>
                            <div className="font-mono text-xs text-slate-300 bg-navy-900 rounded-lg px-3 py-2 space-y-0.5">
                                <div><span className="text-slate-500">Email:</span> {MOCK_CREDENTIALS.admin.email}</div>
                                <div><span className="text-slate-500">Pass:</span> {MOCK_CREDENTIALS.admin.password}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    AquaPulse AI v2.4.1 · Ministry of Jal Shakti Initiative · © 2026
                </p>
            </div>
        </div>
    );
}