export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    model: string;
    created_at: string;
    message: Message;
    done: boolean;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
    chat: async (messages: Message[]): Promise<ChatResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messages,
                    model: "gpt-oss:20b", // Ensure this matches backend availability
                    stream: false
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Chat API Error:', error);
            throw error;
        }
    }
};
