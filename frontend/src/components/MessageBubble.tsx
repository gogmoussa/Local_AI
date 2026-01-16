import React from 'react';
import { type Message } from '../services/api';

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: '1rem',
            padding: '0 1rem'
        }}>
            <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: isUser ? '#3b82f6' : '#2d2d2d',
                color: isUser ? '#ffffff' : '#e0e0e0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                borderBottomRightRadius: isUser ? '2px' : '12px',
                borderBottomLeftRadius: isUser ? '12px' : '2px',
                lineHeight: 1.5
            }}>
                {message.content}
            </div>
        </div>
    );
};
