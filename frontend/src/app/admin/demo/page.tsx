'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { DemoControls } from '@/components/admin/DemoControls';

export default function DemoPage() {
    return (
        <div>
            <PageHeader title="Demo Controls" description="Trigger demo scenarios for live demonstrations" />
            <DemoControls />
        </div>
    );
}
