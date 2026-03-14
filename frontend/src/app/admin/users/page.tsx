'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserTable } from '@/components/admin/UserTable';
import { UserForm } from '@/components/admin/UserForm';

export default function UsersPage() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div>
            <PageHeader title="Users" description="Manage health officer accounts" />
            <UserTable onNewUser={() => setShowForm(true)} />
            {showForm && <UserForm onClose={() => setShowForm(false)} />}
        </div>
    );
}
