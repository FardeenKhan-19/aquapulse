'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/hooks/useAuth';
import {
    LayoutDashboard,
    MapPin,
    Bell,
    Search,
    Scale,
    MessageSquare,
    Users,
    Cpu,
    Settings,
    Play,
    LogOut,
    ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
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

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';
    const links = isAdmin ? adminLinks : hoLinks;

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-primary border-r border-accent/50 transition-all duration-300 flex flex-col',
                collapsed ? 'w-[68px]' : 'w-[240px]',
                'hidden lg:flex'
            )}
        >
            <div className="h-1 w-full bg-gradient-to-r from-cyan via-purple to-teal" />

            <div className="flex items-center gap-3 px-4 py-5 border-b border-accent/30">
                <Image
                    src="/logo-dark.svg"
                    alt="AquaPulse AI"
                    width={collapsed ? 36 : 140}
                    height={36}
                    className="transition-all duration-300"
                />
                {!collapsed && (
                    <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase',
                        isAdmin ? 'bg-coral/20 text-coral' : 'bg-cyan/20 text-cyan'
                    )}>
                        {isAdmin ? 'Admin' : 'Health Officer'}
                    </span>
                )}
            </div>

            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href));
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                                isActive
                                    ? 'bg-accent/50 text-cyan border-l-2 border-cyan'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-accent/30'
                            )}
                        >
                            <link.icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-cyan' : 'text-text-muted group-hover:text-text-secondary')} />
                            {!collapsed && <span>{link.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-accent/30 p-3">
                {!collapsed && user && (
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-cyan">
                            {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{user.full_name}</p>
                            <p className="text-xs text-text-muted truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-coral hover:bg-coral/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                    <button
                        onClick={onToggle}
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent/30 transition-colors"
                    >
                        <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
