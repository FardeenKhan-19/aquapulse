'use client';

import { Bell, Moon, Sun, Monitor, Menu } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useWsStore } from '@/lib/stores/wsStore';
import { useAlertStore } from '@/lib/stores/alertStore';
import { cn } from '@/lib/utils/cn';

interface TopBarProps {
    title: string;
    onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const connectionStatus = useWsStore((s) => s.connectionStatus);
    const unreadCount = useAlertStore((s) => s.unreadCount);

    const statusColor = connectionStatus === 'connected'
        ? 'bg-cyan animate-pulse-cyan'
        : connectionStatus === 'reconnecting'
            ? 'bg-amber'
            : 'bg-text-muted';

    const statusLabel = connectionStatus === 'connected' ? 'Live' : connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline';

    const cycleTheme = () => {
        const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
        setTheme(next);
    };

    const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

    return (
        <header className="sticky top-0 z-30 h-16 bg-primary/80 backdrop-blur-xl border-b border-accent/30 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-accent/30 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/50 border border-accent/30">
                    <div className={cn('w-2 h-2 rounded-full', statusColor)} />
                    <span className="text-xs text-text-secondary hidden sm:inline">{statusLabel}</span>
                </div>

                <button className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-accent/30 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={cycleTheme}
                    className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-accent/30 transition-colors"
                    title={`Theme: ${theme}`}
                >
                    <ThemeIcon className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
