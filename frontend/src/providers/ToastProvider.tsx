'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/providers/ThemeProvider';

export function ToastProvider() {
    const { resolvedTheme } = useTheme();

    return (
        <Toaster
            theme={resolvedTheme}
            position="top-right"
            toastOptions={{
                style: {
                    background: resolvedTheme === 'dark' ? '#16213e' : '#ffffff',
                    border: `1px solid ${resolvedTheme === 'dark' ? '#0f3460' : '#e2e8f0'}`,
                    color: resolvedTheme === 'dark' ? '#e2e8f0' : '#1a1a2e',
                },
                classNames: {
                    error: 'bg-coral/10 border-coral/30',
                    warning: 'bg-amber/10 border-amber/30',
                    success: 'bg-teal/10 border-teal/30',
                    info: 'bg-cyan/10 border-cyan/30',
                },
            }}
            richColors
            closeButton
            expand={false}
            visibleToasts={5}
        />
    );
}
