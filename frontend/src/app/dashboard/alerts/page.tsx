'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { AlertPanel } from '@/components/alerts/AlertPanel';

export default function AlertsPage() {
    return (
        <div>
            <PageHeader title="Alerts" description="Manage and acknowledge active alerts across your villages" />
            <AlertPanel />
        </div>
    );
}
