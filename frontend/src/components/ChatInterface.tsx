import React, { useState, useRef, useEffect } from 'react';
import { type Message, api } from '../services/api';
import { MessageBubble } from './MessageBubble';
import { Image as ImageIcon, X, Send, Loader2, ChevronDown, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
    sessionId: string;
    initialMessages: Message[];
    models: string[];
    selectedModel: string;
    onModelChange: (model: string) => void;
    onRefreshModels?: () => void;
    onChatCreated: () => void;
    persona: { name: string, prompt: string, color: string };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    sessionId,
    initialMessages,
    models,
    selectedModel,
    onModelChange,
    onRefreshModels,
    onChatCreated,
    persona
}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [inputValue]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setSelectedImages(prev => [...prev, base64.split(',')[1]]); // Get base64 content
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && selectedImages.length === 0) || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputValue,
            images: selectedImages.length > 0 ? selectedImages : undefined
        };

        // Inject system persona if this is the first message
        const chatMessages = messages.length === 0
            ? [{ role: 'system' as const, content: persona.prompt }, userMessage]
            : [...messages, userMessage];

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setSelectedImages([]);
        setIsLoading(true);

        // Add 'Thinking...' placeholder immediately to signal activity
        setMessages(prev => [...prev, { role: 'assistant', content: "Thinking..." }]);

        let isFirstMessageChunk = true;
        let aiResponseContent = "";

        try {
            await api.chatStream(chatMessages, selectedModel, sessionId, (chunk: string) => {
                if (isFirstMessageChunk) {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'assistant', content: chunk };
                        return updated;
                    });
                    aiResponseContent = chunk;
                    isFirstMessageChunk = false;
                } else {
                    aiResponseContent += chunk;
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'assistant', content: aiResponseContent };
                        return updated;
                    });
                }
            });

            if (initialMessages.length === 0) {
                onChatCreated();
            }

        } catch (error: any) {
            console.error('Failed to send message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: error.message || 'An unexpected error occurred. Please try again.',
                isError: true
            };

            setMessages(prev => {
                const updated = [...prev];
                if (aiResponseContent || !isFirstMessageChunk) {
                    return [...prev, errorMessage];
                } else {
                    updated[updated.length - 1] = errorMessage;
                    return updated;
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxWidth: '1000px',
            margin: '0 auto',
            width: '100%',
            padding: '0 1.5rem',
            position: 'relative'
        }}>
            {/* Header with Model Selector & Actions */}
            <header style={{
                padding: '1.25rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ visibility: 'hidden', width: '100px' }} /> {/* Spacer */}

                <div style={{ width: '100px', display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => onRefreshModels?.()}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-mute)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        title="Refresh Models"
                        onMouseOver={(e) => {
                            e.currentTarget.style.color = 'var(--text-dim)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.color = 'var(--text-mute)';
                        }}
                    >
                        <RefreshCw size={16} />
                    </button>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                if (!showModelDropdown) onRefreshModels?.();
                                setShowModelDropdown(!showModelDropdown);
                            }}
                            className="glass"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.6rem 1.25rem',
                                borderRadius: '12px',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s',
                                opacity: selectedModel ? 1 : 0.7
                            }}
                        >
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: persona.color,
                                boxShadow: `0 0 10px ${persona.color}`
                            }} />
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedModel || 'Loading...'}
                            </span>
                            <ChevronDown size={16} style={{
                                transform: showModelDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                                opacity: 0.7
                            }} />
                        </button>
                        <AnimatePresence>
                            {showModelDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="glass"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '50%',
                                        translateX: '-50%',
                                        marginTop: '0.75rem',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        minWidth: '220px',
                                        zIndex: 100,
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                                        padding: '0.5rem'
                                    }}
                                >
                                    {models.length === 0 ? (
                                        <div style={{
                                            padding: '1rem',
                                            textAlign: 'center',
                                            color: 'var(--text-dim)',
                                            fontSize: '0.85rem'
                                        }}>
                                            <p>No models available</p>
                                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-mute)' }}>
                                                Make sure Ollama is running
                                            </p>
                                        </div>
                                    ) : (
                                        models.map(model => (
                                            <button
                                                key={model}
                                                onClick={() => {
                                                    onModelChange(model);
                                                    setShowModelDropdown(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.8rem 1rem',
                                                    textAlign: 'left',
                                                    border: 'none',
                                                    backgroundColor: model === selectedModel ? 'rgba(255,255,255,0.06)' : 'transparent',
                                                    color: model === selectedModel ? '#fff' : 'var(--text-dim)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    borderRadius: '10px',
                                                    transition: 'all 0.2s',
                                                    fontWeight: model === selectedModel ? 600 : 400
                                                }}
                                                onMouseOver={(e) => {
                                                    if (model !== selectedModel) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                                                }}
                                                onMouseOut={(e) => {
                                                    if (model !== selectedModel) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                {model}
                                            </button>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setMessages([])}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-mute)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.color = 'var(--text-dim)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.color = 'var(--text-mute)';
                        }}
                    >
                        <Trash2 size={16} />
                        Clear
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 0',
                maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {messages.length === 0 && (
                    <div className="animate-fade-in" style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '1.5rem'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: `linear-gradient(135deg, ${persona.color}20, ${persona.color}40)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${persona.color}30`,
                            boxShadow: `0 20px 40px ${persona.color}15`
                        }}>
                            <Sparkles size={40} color={persona.color} />
                        </div>
                        <div>
                            <h2 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.04em' }}>
                                How can I help today?
                            </h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                                Chat with your private <span style={{ color: persona.color, fontWeight: 600 }}>{persona.name}</span>
                            </p>
                        </div>

                        {/* Suggested Prompts */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            width: '100%',
                            maxWidth: '700px',
                            marginTop: '1rem'
                        }}>
                            {[
                                "Write a poem about local AI",
                                "Explain quantum computing",
                                "How do I build a search engine?",
                                "Tell me a short story"
                            ].map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInputValue(prompt)}
                                    className="glass glow-card"
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '16px',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-dim)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <MessageBubble message={msg} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            padding: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'var(--text-dim)',
                            fontSize: '0.9rem'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            gap: '3px'
                        }}>
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                    style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: persona.color }}
                                />
                            ))}
                        </div>
                        <span>Processing...</span>
                    </motion.div>
                )}
                <div ref={messagesEndRef} style={{ height: '2rem' }} />
            </div>

            {/* Floating Input Area */}
            <div style={{
                padding: '0 0 2rem 0',
                position: 'relative'
            }}>
                <div
                    className="glass"
                    style={{
                        borderRadius: '24px',
                        padding: '0.75rem 1.25rem',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: `1px solid ${persona.color}20`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onFocusCapture={(e) => {
                        e.currentTarget.style.border = `1px solid ${persona.color}60`;
                        e.currentTarget.style.boxShadow = `0 10px 40px ${persona.color}15, 0 20px 50px rgba(0,0,0,0.5)`;
                    }}
                    onBlurCapture={(e) => {
                        e.currentTarget.style.border = `1px solid ${persona.color}20`;
                        e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
                    }}
                >
                    {/* Focus Glow Background */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at 50% 100%, ${persona.color}10, transparent 70%)`,
                        pointerEvents: 'none',
                        opacity: 0.5
                    }} />

                    <form onSubmit={handleSubmit} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        {/* Image Previews */}
                        <AnimatePresence>
                            {selectedImages.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.25rem' }}
                                >
                                    {selectedImages.map((img, idx) => (
                                        <motion.div
                                            key={idx}
                                            layout
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            style={{ position: 'relative' }}
                                        >
                                            <img
                                                src={`data:image/png;base64,${img}`}
                                                alt="preview"
                                                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border-glass)' }}
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    backgroundColor: '#ef4444',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '22px',
                                                    height: '22px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    padding: '0.6rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    color: 'var(--text-dim)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    marginBottom: '2px'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.color = persona.color;
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.color = 'var(--text-dim)';
                                }}
                            >
                                <ImageIcon size={22} />
                            </button>

                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Ask ${persona.name}...`}
                                disabled={isLoading}
                                rows={1}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem 0',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    fontSize: '1.05rem',
                                    outline: 'none',
                                    resize: 'none',
                                    lineHeight: 1.6,
                                    maxHeight: '300px'
                                }}
                            />

                            <button
                                type="submit"
                                disabled={isLoading || (!inputValue.trim() && selectedImages.length === 0)}
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    backgroundColor: (inputValue.trim() || selectedImages.length > 0) ? persona.color : 'rgba(255,255,255,0.02)',
                                    color: (inputValue.trim() || selectedImages.length > 0) ? '#000' : 'var(--text-mute)',
                                    cursor: (inputValue.trim() || selectedImages.length > 0) ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: (inputValue.trim() || selectedImages.length > 0) ? `0 8px 20px ${persona.color}40` : 'none',
                                    marginBottom: '2px'
                                }}
                                onMouseOver={(e) => {
                                    if (inputValue.trim() || selectedImages.length > 0) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.filter = 'brightness(1.1)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.filter = 'brightness(1)';
                                }}
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </div>
                    </form>
                </div>
                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-mute)',
                    textAlign: 'center',
                    marginTop: '1rem',
                    letterSpacing: '0.02em',
                    opacity: 0.6
                }}>
                    Local AI Companion • <span style={{ color: persona.color }}>{persona.name}</span> Mode
                </p>
            </div>
        </div>
    );
};

