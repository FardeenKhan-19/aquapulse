'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/utils/validators';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginForm() {
    const { login, error, clearError } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true);
        clearError();
        try {
            await login(data);
            const redirect = searchParams.get('redirect');
            if (redirect) {
                router.push(redirect);
            }
        } catch {
            // Error handled by store
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                    Email Address
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className="w-full px-4 py-3 bg-surface border border-accent/50 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                    placeholder="officer@aquapulse.in"
                />
                {errors.email && <p className="mt-1 text-xs text-coral">{errors.email.message}</p>}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                    Password
                </label>
                <div className="relative">
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...register('password')}
                        className="w-full px-4 py-3 pr-12 bg-surface border border-accent/50 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-coral">{errors.password.message}</p>}
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-coral/10 border border-coral/30">
                    <p className="text-sm text-coral">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-cyan hover:bg-cyan/90 disabled:bg-cyan/50 text-primary font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                    </>
                ) : (
                    <span>Sign In</span>
                )}
            </button>
        </form>
    );
}
