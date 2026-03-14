'use client';

import { useChat } from '@/lib/hooks/useChat';
import { ChatWindow } from '@/components/chatbot/ChatWindow';
import { SuggestedQueries } from '@/components/chatbot/SuggestedQueries';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/formatters';

function ChatContent() {
    const { messages, sessions, suggestions, isTyping, isSending, sendMessage, loadSession, startNewSession } = useChat();
    const searchParams = useSearchParams();
    const [initialQuery, setInitialQuery] = useState<string | null>(null);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q && messages.length === 0 && !initialQuery) {
            setInitialQuery(q);
            sendMessage(q);
        }
    }, [searchParams]);

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4">
            <div className="hidden lg:flex flex-col w-[240px] bg-surface border border-accent/30 rounded-xl overflow-hidden shrink-0">
                <div className="p-3 border-b border-accent/20 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-text-primary uppercase">Sessions</h3>
                    <button onClick={startNewSession} className="p-1 text-text-muted hover:text-cyan transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                    {sessions.map((s) => (
                        <button key={s.id} onClick={() => loadSession(s.id)} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-accent/30 transition-colors">
                            <p className="text-text-primary truncate">{s.title || 'New session'}</p>
                            <p className="text-[10px] text-text-muted">{formatRelativeTime(s.updated_at)}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-surface border border-accent/30 rounded-xl overflow-hidden flex flex-col">
                <ChatWindow messages={messages} onSend={sendMessage} isTyping={isTyping} isSending={isSending} />
            </div>

            <div className="hidden xl:flex flex-col w-[280px] bg-surface border border-accent/30 rounded-xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-accent/20">
                    <h3 className="text-xs font-semibold text-text-primary uppercase">Context</h3>
                </div>
                <div className="p-4 space-y-4">
                    <SuggestedQueries suggestions={suggestions} onSelect={sendMessage} />
                </div>
            </div>

            <div className="lg:hidden fixed bottom-20 left-4 right-4">
                {suggestions.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {suggestions.map((s, i) => (
                            <button key={i} onClick={() => sendMessage(s)} className="px-3 py-1.5 text-xs text-text-secondary bg-surface border border-accent/30 rounded-full whitespace-nowrap">
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatbotPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-8rem)]"><div className="w-10 h-10 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" /></div>}>
            <ChatContent />
        </Suspense>
    );
}
