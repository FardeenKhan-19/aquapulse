'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/api/chatbot';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
    messages: ChatMessageType[];
    onSend: (message: string) => void;
    isTyping: boolean;
    isSending: boolean;
}

export function ChatWindow({ messages, onSend, isTyping, isSending }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-cyan/10 flex items-center justify-center mb-4">
                            <span className="text-2xl">🤖</span>
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary">AquaPulse AI Assistant</h3>
                        <p className="text-sm text-text-muted mt-2 max-w-md">
                            Ask me about water quality, disease predictions, contamination sources, or village risk assessments.
                        </p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                ))}
                {isTyping && (
                    <div className="flex items-center gap-2 text-text-muted">
                        <Loader2 className="w-4 h-4 animate-spin text-purple" />
                        <span className="text-xs">AquaPulse AI is thinking...</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
            <div className="border-t border-accent/20 p-4">
                <ChatInput onSend={onSend} disabled={isSending} />
            </div>
        </div>
    );
}
