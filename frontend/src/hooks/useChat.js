import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getConversationMessages,
    sendMessageToBot,
    sendAudioMessageToBot,
} from "../services/chatService.js";

export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState(null);
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const submissionLock = useRef(false);
    const historyRequest = useRef(0);

    useEffect(() => {
        const requestId = ++historyRequest.current;
        setError(null);
        setMessages([]);

        if (!conversationId) {
            setHistoryLoading(false);
            return;
        }

        let cancelled = false;
        setHistoryLoading(true);

        getConversationMessages(conversationId)
            .then((history) => {
                if (cancelled || requestId !== historyRequest.current) return;

                setMessages(history.map((message) => ({
                    id: message.id,
                    sender: message.role === "assistant" ? "bot" : "user",
                    text: message.content,
                    type: "text",
                    createdAt: message.created_at,
                })));
            })
            .catch((err) => {
                if (cancelled || requestId !== historyRequest.current) return;
                const status = err.response?.status;
                if (status === 404) {
                    setError("Nie znaleziono tej konwersacji.");
                } else if (status === 401) {
                    setError("Zaloguj się, aby otworzyć konwersację.");
                } else {
                    setError("Nie udało się wczytać historii konwersacji.");
                }
            })
            .finally(() => {
                if (!cancelled && requestId === historyRequest.current) {
                    setHistoryLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [conversationId]);

    const sendMessage = async (text) => {
        if (!text.trim() || submissionLock.current) return;

        submissionLock.current = true;
        setMessages((prev) => [...prev, { sender: "user", text, type: "text" }]);
        setLoading(true);
        setError(null);

        try {
            const botReply = await sendMessageToBot(conversationId, text);
            if (!conversationId && botReply.conversation_id) {
                navigate(`/chat/${botReply.conversation_id}`);
            }

            setMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: botReply.response,
                    audio: botReply.audio,
                    type: "text"
                }
            ]);
        } catch (err) {
            console.error("Błąd wysyłania wiadomości:", err);
            setError("Błąd w odpowiedzi bota.");

            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Błąd w odpowiedzi bota", type: "error" }
            ]);
        } finally {
            submissionLock.current = false;
            setLoading(false);
        }
    };

    // Sending audio message
    const sendAudioMessage = async (audioBlob) => {
        if (!audioBlob || submissionLock.current) return;

        submissionLock.current = true;
        setMessages((prev) => [
            ...prev,
            { sender: "user", text: "🎤 Nagranie audio...", type: "audio", audioBlob }
        ]);
        setLoading(true);
        setError(null);

        try {
            const result = await sendAudioMessageToBot(audioBlob, conversationId);
            if (!conversationId && result.conversation_id) {
                navigate(`/chat/${result.conversation_id}`);
            }

            // Update last user message with actual transcription
            setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    sender: "user",
                    text: result.transcription,
                    type: "audio",
                    audioBlob
                };
                return newMessages;
            });

            // Add bot response
            setMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: result.response,
                    audio: result.audio,
                    type: "text"
                }
            ]);
        } catch (err) {
            console.error("Błąd przetwarzania audio:", err);
            setError("Nie udało się przetworzyć nagrania.");

            // Update last user message to show error
            setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    sender: "user",
                    text: "❌ Błąd przetwarzania nagrania",
                    type: "error"
                };
                return newMessages;
            });

            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Nie udało się przetworzyć nagrania", type: "error" }
            ]);
        } finally {
            submissionLock.current = false;
            setLoading(false);
        }
    };

    return {
        messages,
        sendMessage,
        sendAudioMessage,
        loading,
        historyLoading,
        error,
    };
};