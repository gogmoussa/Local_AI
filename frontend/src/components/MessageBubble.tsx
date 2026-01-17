import React, { useState } from 'react';
import { type Message } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, Volume2, X } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
}

const CodeBlock = ({ children, language }: { children: string, language: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ position: 'relative', margin: '1rem 0' }}>
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <button
                    onClick={handleCopy}
                    style={{
                        backgroundColor: '#1e1e2e',
                        border: '1px solid #2d2d3d',
                        borderRadius: '4px',
                        padding: '4px',
                        cursor: 'pointer',
                        color: copied ? '#10b981' : '#888',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            </div>
            <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                customStyle={{
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    margin: 0
                }}
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const isError = message.isError;

    return (
        <div
            className="animate-slide-up"
            style={{
                display: 'flex',
                gap: '1.25rem',
                padding: '1.5rem',
                maxWidth: '100%',
                borderRadius: '20px',
                transition: 'all 0.2s',
                backgroundColor: isError ? 'rgba(239, 68, 68, 0.05)' : (isUser ? 'rgba(255,255,255,0.02)' : 'transparent'),
                border: isError ? '1px solid rgba(239, 68, 68, 0.2)' : (isUser ? '1px solid var(--border-glass)' : '1px solid transparent')
            }}
        >
            {/* Avatar */}
            <div style={{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: isError
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : (isUser ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isError
                    ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                    : (isUser ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(139, 92, 246, 0.3)')
            }}>
                {isError ? <X size={20} color="#fff" /> : (isUser ? <User size={20} color="#fff" /> : <Bot size={20} color="#fff" />)}
            </div>

            {/* Content Container */}
            <div style={{
                flex: 1,
                lineHeight: 1.8,
                color: isError ? '#fca5a5' : (isUser ? '#fff' : 'var(--text-main)'),
                overflow: 'hidden',
                fontSize: '1.05rem'
            }}>
                {isError && (
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: '#ef4444' }}>
                        System Error
                    </div>
                )}
                {/* Images in message */}
                {message.images && message.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {message.images.map((img, idx) => (
                            <img
                                key={idx}
                                src={`data:image/png;base64,${img}`}
                                alt="uploaded"
                                style={{
                                    maxWidth: '400px',
                                    maxHeight: '400px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-glass)',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}
                            />
                        ))}
                    </div>
                )}

                {isUser ? (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{message.content}</p>
                ) : (
                    <div className="markdown-content" style={{ wordBreak: 'break-word', position: 'relative' }}>
                        <ReactMarkdown
                            components={{
                                code({ node, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');

                                    return isInline ? (
                                        <code
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.06)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.9em',
                                                color: '#f472b6',
                                                border: '1px solid rgba(255,255,255,0.03)'
                                            }}
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    ) : (
                                        <CodeBlock language={match ? match[1] : 'text'}>
                                            {String(children).replace(/\n$/, '')}
                                        </CodeBlock>
                                    );
                                },
                                p: ({ children }) => <p style={{ margin: '0 0 1.25rem 0' }}>{children}</p>,
                                ul: ({ children }) => <ul style={{ margin: '1.25rem 0', paddingLeft: '1.5rem', listStyleType: 'circle' }}>{children}</ul>,
                                ol: ({ children }) => <ol style={{ margin: '1.25rem 0', paddingLeft: '1.5rem' }}>{children}</ol>,
                                li: ({ children }) => <li style={{ margin: '0.5rem 0' }}>{children}</li>,
                                h1: ({ children }) => <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '2rem 0 1rem', letterSpacing: '-0.02em', color: '#fff' }}>{children}</h1>,
                                h2: ({ children }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '1.75rem 0 0.75rem', letterSpacing: '-0.01em', color: '#fff' }}>{children}</h2>,
                                h3: ({ children }) => <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '1.5rem 0 0.5rem', color: '#fff' }}>{children}</h3>,
                                blockquote: ({ children }) => (
                                    <blockquote style={{
                                        borderLeft: '4px solid #8b5cf6',
                                        padding: '0.5rem 1.25rem',
                                        margin: '1.5rem 0',
                                        backgroundColor: 'rgba(139, 92, 246, 0.05)',
                                        borderRadius: '0 12px 12px 0',
                                        color: 'var(--text-dim)',
                                        fontStyle: 'italic'
                                    }}>
                                        {children}
                                    </blockquote>
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>

                        {/* Action Bar */}
                        {!isError && (
                            <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                marginTop: '0.5rem',
                                opacity: 0.4,
                                transition: 'opacity 0.2s'
                            }} className="message-actions">
                                <button
                                    onClick={() => {
                                        const utterance = new SpeechSynthesisUtterance(message.content);
                                        window.speechSynthesis.speak(utterance);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                                    title="Listen"
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.color = 'var(--text-dim)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Volume2 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(message.content);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                                    title="Copy Message"
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.color = 'var(--text-dim)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

