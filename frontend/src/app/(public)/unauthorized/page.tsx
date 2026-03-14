'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-primary flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 text-coral" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
                <p className="text-text-secondary mb-6">
                    You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-cyan hover:bg-cyan/90 text-primary font-semibold rounded-lg transition-colors"
                >
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
