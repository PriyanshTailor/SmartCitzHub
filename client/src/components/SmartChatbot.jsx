import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Loader2, Bot, User } from 'lucide-react';
import { useChat } from '../hooks/useChat'; // Ensure correct import path
import { Button } from './ui/button'; // Assuming you have shadcn/ui components
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils'; // Assuming detailed util present

// Fallback utility if cn is not available
const classNames = (...classes) => classes.filter(Boolean).join(' ');

import { getAuthToken } from '../lib/auth';

const SmartChatbot = () => {
    // Get token using standard auth helper
    const token = getAuthToken();
    const { messages, isLoading, isOpen, toggleChat, sendMessage } = useChat();
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        if (!token) {
            // Handle unauthenticated state if necessary
            console.warn("No auth token found");
            return;
        }

        const currentInput = input;
        setInput('');
        await sendMessage(currentInput, token);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] sm:w-[400px] h-[500px] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in">
                    {/* Header */}
                    <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary-foreground/20 rounded-full">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Smart Citizen Assistant</h3>
                                <p className="text-xs opacity-80">Online • AI Powered</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                            onClick={toggleChat}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full",
                                    msg.sender === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "flex max-w-[80%] flex-col gap-1 px-4 py-2 text-sm rounded-lg shadow-sm",
                                    msg.sender === 'user'
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-card border border-border text-card-foreground rounded-bl-none"
                                )}>
                                    {/* Icon for Bot */}
                                    {msg.sender === 'bot' && (
                                        <div className="flex items-center gap-2 mb-1 opacity-70 border-b border-border/50 pb-1">
                                            <Bot className="w-3 h-3" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Assistant</span>
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] opacity-70 self-end mt-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-card border border-border px-4 py-3 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background border-t border-border flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your query..."
                            className="flex-1 focus-visible:ring-1"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className={cn("shrink-0 transition-all", input.trim() ? "translate-x-0 opacity-100" : "opacity-80")}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Toggle Button (FAB) */}
            <Button
                onClick={toggleChat}
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95",
                    isOpen ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground animate-bounce-slow"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </Button>
        </div>
    );
};

export default SmartChatbot;
