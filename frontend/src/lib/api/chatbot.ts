import apiClient from './client';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages_count: number;
}

export const chatbotApi = {
    sendMessage: async (message: string, sessionId?: string): Promise<ChatMessage> => {
        const response = await apiClient.post<ChatMessage>('/chatbot/message', {
            message,
            session_id: sessionId,
        });
        return response.data;
    },

    getSessions: async (): Promise<ChatSession[]> => {
        const response = await apiClient.get<ChatSession[]>('/chatbot/sessions');
        return response.data;
    },

    getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        const response = await apiClient.get<ChatMessage[]>(`/chatbot/sessions/${sessionId}/messages`);
        return response.data;
    },

    getSuggestions: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/chatbot/suggestions');
        return response.data;
    },

    createSession: async (): Promise<ChatSession> => {
        const response = await apiClient.post<ChatSession>('/chatbot/sessions');
        return response.data;
    },
};
