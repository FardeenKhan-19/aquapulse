'use client';

interface AlertFiltersProps {
    filters: Record<string, string>;
    onFiltersChange: (filters: Record<string, string>) => void;
}

export function AlertFilters({ filters, onFiltersChange }: AlertFiltersProps) {
    const severities = ['all', 'critical', 'high', 'medium', 'low', 'info'];
    const statuses = ['all', 'unacknowledged', 'acknowledged'];

    const update = (key: string, value: string) => {
        const next = { ...filters };
        if (value === 'all') {
            delete next[key];
        } else {
            next[key] = value;
        }
        onFiltersChange(next);
    };

    return (
        <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Severity:</span>
                <div className="flex gap-1">
                    {severities.map((s) => (
                        <button
                            key={s}
                            onClick={() => update('severity', s)}
                            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${(filters.severity || 'all') === s
                                    ? 'bg-cyan/20 text-cyan font-medium'
                                    : 'text-text-secondary hover:bg-accent/30'
                                }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Status:</span>
                <div className="flex gap-1">
                    {statuses.map((s) => (
                        <button
                            key={s}
                            onClick={() => update('acknowledged', s === 'acknowledged' ? 'true' : s === 'unacknowledged' ? 'false' : 'all')}
                            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${(filters.acknowledged === 'true' && s === 'acknowledged') ||
                                    (filters.acknowledged === 'false' && s === 'unacknowledged') ||
                                    (!filters.acknowledged && s === 'all')
                                    ? 'bg-cyan/20 text-cyan font-medium'
                                    : 'text-text-secondary hover:bg-accent/30'
                                }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
