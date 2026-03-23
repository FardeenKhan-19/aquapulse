'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/hooks/useAuth';
import {
    LayoutDashboard, MapPin, Bell, Search, Scale, MessageSquare,
    Users, Cpu, Settings, Play, LogOut,
} from 'lucide-react';

interface MobileNavProps {
    open: boolean;
    onClose: () => void;
}

const hoLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/villages', label: 'Villages', icon: MapPin },
    { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard/forensics', label: 'Forensics', icon: Search },
    { href: '/dashboard/legal', label: 'Legal', icon: Scale },
    { href: '/dashboard/chatbot', label: 'AI Assistant', icon: MessageSquare },
];

const adminLinks = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/sensors', label: 'Sensors', icon: Cpu },
    { href: '/admin/villages', label: 'Villages', icon: MapPin },
    { href: '/admin/system', label: 'System', icon: Settings },
    { href: '/admin/demo', label: 'Demo Controls', icon: Play },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';
    const links = isAdmin ? adminLinks : hoLinks;

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 lg:hidden"
                        onClick={onClose}
                    />
                    <motion.nav
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 z-50 h-screen w-[80vw] max-w-[280px] bg-primary border-r border-accent/50 flex flex-col lg:hidden"
                    >
                        <div className="h-1 w-full bg-gradient-to-r from-cyan via-purple to-teal" />

                        <div className="flex items-center justify-between px-4 py-4">
                            <Image src="/logo-dark.svg" alt="AquaPulse AI" width={120} height={32} />
                            <button onClick={onClose} className="p-2 rounded-lg text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex-1 py-4 px-3 space-y-1">
                            {links.map((link) => {
                                const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={onClose}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all',
                                            isActive ? 'bg-accent/50 text-cyan border-l-2 border-cyan' : 'text-text-secondary hover:text-text-primary hover:bg-accent/30'
                                        )}
                                    >
                                        <link.icon className={cn('w-5 h-5', isActive ? 'text-cyan' : 'text-text-muted')} />
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="border-t border-accent/30 p-4">
                            {user && (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-cyan">
                                        {user.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{user.full_name}</p>
                                        <p className="text-xs text-text-muted">{user.email}</p>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => { logout(); onClose(); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-coral hover:bg-coral/10 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.nav>
                </>
            )}
        </AnimatePresence>
    );
}
