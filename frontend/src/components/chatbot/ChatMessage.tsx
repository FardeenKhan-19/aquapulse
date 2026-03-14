'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage as ChatMessageType } from '@/lib/api/chatbot';
import { cn } from '@/lib/utils/cn';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const highlightRiskLevels = (text: string) => {
        return text
            .replace(/\bCRITICAL\b/g, '<span class="px-1.5 py-0.5 rounded bg-coral/20 text-coral text-xs font-bold">CRITICAL</span>')
            .replace(/\bHIGH\b/g, '<span class="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs font-bold">HIGH</span>')
            .replace(/\bMEDIUM\b/g, '<span class="px-1.5 py-0.5 rounded bg-amber/20 text-amber text-xs font-bold">MEDIUM</span>');
    };

    return (
        <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3 relative group',
                    isUser
                        ? 'bg-cyan/15 text-text-primary rounded-br-sm'
                        : 'bg-surface border border-accent/30 text-text-primary rounded-bl-sm border-l-2 border-l-purple'
                )}
            >
                {!isUser && (
                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-text-primary transition-all"
                    >
                        {copied ? <Check className="w-3 h-3 text-teal" /> : <Copy className="w-3 h-3" />}
                    </button>
                )}
                <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
                    <ReactMarkdown
                        components={{
                            code: ({ className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const inline = !match;
                                return inline ? (
                                    <code className="px-1.5 py-0.5 bg-accent/30 rounded text-xs font-mono text-cyan" {...props}>{children}</code>
                                ) : (
                                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: '8px', fontSize: '12px' }}>
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                );
                            },
                            table: ({ children }) => (
                                <div className="overflow-x-auto my-2">
                                    <table className="w-full text-xs border border-accent/30 rounded">{children}</table>
                                </div>
                            ),
                            th: ({ children }) => <th className="border border-accent/20 px-3 py-1.5 bg-accent/10 text-left">{children}</th>,
                            td: ({ children }) => <td className="border border-accent/20 px-3 py-1.5">{children}</td>,
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
                <p className="text-[9px] text-text-muted mt-2 text-right">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
}
