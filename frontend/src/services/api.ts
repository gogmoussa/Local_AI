export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    images?: string[];
    isError?: boolean;
}

export interface ChatResponse {
    model: string;
    created_at: string;
    message: Message;
    done: boolean;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
    chat: async (messages: Message[], model: string = "gpt-oss:20b"): Promise<ChatResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messages,
                    model: model,
                    stream: false
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Chat API Error:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error("Unable to connect to the backend server. Please check if it's running.");
            }
            throw error;
        }
    },

    getModels: async (): Promise<string[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/models`);
            if (!response.ok) throw new Error('Failed to fetch models');
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch models", error);
            return ["gpt-oss:20b"]; // Fallback
        }
    },

    getSessions: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/sessions`);
        return await response.json();
    },

    getSessionMessages: async (sessionId: string): Promise<Message[]> => {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`);
        return await response.json();
    },

    deleteSession: async (sessionId: string): Promise<void> => {
        await fetch(`${API_BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
    },

    chatStream: async (messages: Message[], model: string, sessionId: string, onChunk: (content: string) => void): Promise<void> => {
        let response;
        try {
            response = await fetch(`${API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, model, session_id: sessionId })
            });
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error("Unable to connect to the backend server. Please check if it's running.");
            }
            throw error;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Streaming request failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        let isDone = false;
        while (!isDone) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') {
                        isDone = true;
                        break;
                    }
                    try {
                        const json = JSON.parse(data);
                        if (json.error) {
                            throw new Error(json.error);
                        }
                        // Send content even if empty to signal stream is alive
                        onChunk(json.message?.content || "");
                    } catch (e: any) {
                        if (e.message.includes('memory') || e.message.includes('RAM')) {
                            throw new Error(`Model Error: Insufficient system memory to load ${model}. Try a smaller model.`);
                        }
                        if (e.message.includes('not responding') || e.message.includes('connection')) {
                            throw new Error(`${e.message}`);
                        }
                        console.error("Error parsing stream chunk", e);
                        throw e;
                    }
                }
            }
        }
    }
};
