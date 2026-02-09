'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface IACitasModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCitaCreated?: () => void;
}

export function IACitasModal({ isOpen, onClose, onCitaCreated }: IACitasModalProps) {
    const { token, user } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '¡Hola! 👋 Soy tu asistente de citas con IA. Puedes pegarme los datos de la cita y yo me encargo de agendarla.\n\nPor ejemplo:\n• Nombre del cliente\n• Teléfono\n• Servicio que desea\n• Fecha y hora preferida\n• Especialista (opcional)\n\n¿Qué cita deseas agendar?',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

            if (!webhookUrl || webhookUrl.includes('tu-instancia-n8n')) {
                // Webhook no configurado - mostrar mensaje de error amigable
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '⚠️ El webhook de n8n no está configurado todavía.\n\nPor favor, configura la variable `NEXT_PUBLIC_N8N_WEBHOOK_URL` en el archivo `.env.local` con la URL de tu webhook de n8n.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: user?.id ? `user_${user.id}` : 'guest_session',
                    token: token,
                    sede: user?.sede?.nombre || 'Sede no especificada',
                    message: userMessage.content,
                    conversationHistory: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            console.log('n8n response data:', data);

            let responseText = 'Cita procesada correctamente.';

            if (data.output) {
                responseText = data.output;
            } else if (Array.isArray(data) && data.length > 0) {
                const first = data[0];
                responseText = first.output || first.message || first.response || (typeof first === 'string' ? first : responseText);
            } else if (data.message) {
                responseText = data.message;
            } else if (data.response) {
                responseText = data.response;
            } else if (typeof data === 'string') {
                responseText = data;
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Si la cita fue creada exitosamente, notificar al padre
            if (data.success && onCitaCreated) {
                onCitaCreated();
            }

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Hubo un error al procesar tu solicitud. Por favor, verifica la conexión con el servidor de n8n e intenta de nuevo.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal - Estilo claro */}
            <div className="relative w-full max-w-2xl h-[80vh] mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-600 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                IA Citas
                                <span className="text-xs font-normal px-2 py-0.5 bg-white/20 text-white rounded-full">
                                    Beta
                                </span>
                            </h2>
                            <p className="text-xs text-white/80">Asistente inteligente de agendamiento</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${message.role === 'assistant'
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                }`}>
                                {message.role === 'assistant' ? (
                                    <Bot className="w-4 h-4 text-white" />
                                ) : (
                                    <User className="w-4 h-4 text-white" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''
                                }`}>
                                <div className={`inline-block px-4 py-3 rounded-2xl shadow-sm ${message.role === 'assistant'
                                    ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-sm'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {message.content}
                                    </p>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 px-1">
                                    {message.timestamp.toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                                    <span className="text-sm text-gray-500">Procesando...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={handleTextareaChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe los datos de la cita o pégalos aquí..."
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 resize-none min-h-[48px] max-h-[150px] transition-all"
                                rows={1}
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 text-center">
                        Presiona Enter para enviar • Shift+Enter para nueva línea
                    </p>
                </div>
            </div>
        </div>
    );
}
