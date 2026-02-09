import { useState, useCallback } from 'react';
import { chatService } from '../services/chatService';

export const useChat = () => {
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            text: "Hello! I'm your Smart Citizen Assistant. How can I help you today? You can ask about your complaints, public services, or emergency contacts.",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [replied, setReplied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => setIsOpen(prev => !prev);

    const sendMessage = useCallback(async (text, token) => {
        if (!text.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const replyText = await chatService.sendMessage(text, token);

            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: replyText,
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                sender: 'bot',
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        messages,
        isLoading,
        isOpen,
        toggleChat,
        sendMessage
    };
};
