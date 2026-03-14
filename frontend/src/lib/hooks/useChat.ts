'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotApi, type ChatMessage } from '@/lib/api/chatbot';

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: sessions } = useQuery({
        queryKey: ['chatbot', 'sessions'],
        queryFn: chatbotApi.getSessions,
        staleTime: 60000,
    });

    const { data: suggestions } = useQuery({
        queryKey: ['chatbot', 'suggestions'],
        queryFn: chatbotApi.getSuggestions,
        staleTime: 300000,
    });

    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            const userMessage: ChatMessage = {
                role: 'user',
                content,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMessage]);
            setIsTyping(true);

            const response = await chatbotApi.sendMessage(content, sessionId || undefined);
            return response;
        },
        onSuccess: (response) => {
            setMessages((prev) => [...prev, response]);
            setIsTyping(false);
            queryClient.invalidateQueries({ queryKey: ['chatbot', 'sessions'] });
        },
        onError: () => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date().toISOString(),
                },
            ]);
        },
    });

    const loadSession = useCallback(
        async (id: string) => {
            setSessionId(id);
            try {
                const sessionMessages = await chatbotApi.getSessionMessages(id);
                setMessages(sessionMessages);
            } catch {
                setMessages([]);
            }
        },
        []
    );

    const startNewSession = useCallback(async () => {
        try {
            const session = await chatbotApi.createSession();
            setSessionId(session.id);
            setMessages([]);
            queryClient.invalidateQueries({ queryKey: ['chatbot', 'sessions'] });
        } catch {
            setSessionId(null);
            setMessages([]);
        }
    }, [queryClient]);

    return {
        messages,
        sessions: sessions || [],
        suggestions: suggestions || [],
        isTyping,
        sessionId,
        sendMessage: sendMessage.mutate,
        isSending: sendMessage.isPending,
        loadSession,
        startNewSession,
        scrollRef,
    };
}
