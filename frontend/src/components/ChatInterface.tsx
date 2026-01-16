import React, { useState, useRef, useEffect } from 'react';
import { type Message, api } from '../services/api';
import { MessageBubble } from './MessageBubble';

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Send the entire history + new message
            // Note: For MVP we might just send the new one if API expects that, 
            // but usually context is needed. Let's send history.
            // Current Backend implementation expects list of messages.
            const response = await api.chat([...messages, userMessage]);

            const aiMessage: Message = {
                role: 'assistant',
                content: response.message.content
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Optional: Add error message to UI
            const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            maxWidth: '900px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: '#16181c'
        }}>
            {/* Header */}
            <header style={{
                padding: '1rem',
                borderBottom: '1px solid #2d2d2d',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f0f0f0', margin: 0 }}>
                    Local AI Companion
                </h1>
            </header>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem 0',
            }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#666', marginTop: '20vh' }}>
                        <p>Say hello to start a conversation.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                ))}

                {isLoading && (
                    <div style={{ padding: '0 1rem', display: 'flex' }}>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#2d2d2d', color: '#888' }}>
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #2d2d2d',
                backgroundColor: '#16181c'
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #2d2d2d',
                            backgroundColor: '#1e2025',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        style={{
                            padding: '0 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isLoading ? '#2d2d2d' : '#3b82f6',
                            color: isLoading ? '#666' : 'white',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};
