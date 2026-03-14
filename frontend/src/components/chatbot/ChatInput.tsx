'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    initialValue?: string;
}

export function ChatInput({ onSend, disabled, initialValue }: ChatInputProps) {
    const [value, setValue] = useState(initialValue || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (initialValue) setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [value]);

    const handleSend = () => {
        if (!value.trim() || disabled) return;
        onSend(value.trim());
        setValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-end gap-2">
            <div className="flex-1 relative">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="Ask AquaPulse AI..."
                    rows={1}
                    className="w-full px-4 py-3 bg-surface border border-accent/50 rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/30 resize-none disabled:opacity-50"
                />
                {value.length > 3600 && (
                    <span className="absolute bottom-1 right-2 text-[10px] text-text-muted">{value.length}/4000</span>
                )}
            </div>
            <button
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                className="p-3 rounded-xl bg-cyan hover:bg-cyan/90 disabled:bg-accent/30 disabled:text-text-muted text-primary transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
    );
}
