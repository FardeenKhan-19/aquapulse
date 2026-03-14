'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cn } from '@/lib/utils/cn';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <ProtectedRoute requiredRole="health_officer">
            <div className="min-h-screen bg-primary">
                <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
                <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]')}>
                    <TopBar title="AquaPulse AI" onMenuClick={() => setMobileNavOpen(true)} />
                    <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
