'use client';

import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface SuggestedQueriesProps {
    suggestions: string[];
    onSelect: (query: string) => void;
}

export function SuggestedQueries({ suggestions, onSelect }: SuggestedQueriesProps) {
    const queryClient = useQueryClient();

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['chatbot', 'suggestions'] });
    };

    if (suggestions.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-text-muted uppercase">Suggested Questions</h4>
                <button
                    onClick={handleRefresh}
                    className="p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(s)}
                        className="px-3 py-1.5 text-xs text-text-secondary bg-accent/20 hover:bg-accent/40 rounded-full transition-colors text-left"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}
