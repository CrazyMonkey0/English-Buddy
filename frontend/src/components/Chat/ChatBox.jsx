import React, { useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { translateText } from '../../services/chatTranslation';
import { PanelLeftClose, PanelLeftOpen, Pause, Play } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from "react-router-dom";
import ConversationSidebar from "./ConversationSidebar";
import "./chat.css";

function ChatBox() {
    const {
        messages,
        sendMessage,
        sendAudioMessage,
        loading,
        historyLoading,
        error,
    } = useChat();
    const messagesEndRef = useRef(null);
    const [translations, setTranslations] = useState({});
    const [visibleTranslations, setVisibleTranslations] = useState({});
    const [playingAudio, setPlayingAudio] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const audioPlayerRef = useRef(new Audio());
    const { isAuthenticated, checkingAuth, logout } = useAuth();
    const navigate = useNavigate();


    // Auto-scroll 
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleTranslate = async (index, text) => {
        setTranslations(prev => ({
            ...prev,
            [index]: "Translating..."
        }));

        try {
            const res = await translateText(text);
            setTranslations(prev => ({
                ...prev,
                [index]: res.translation || res.translated_text || "Translation unavailable."
            }));

            // pokaż tłumaczenie po zakończeniu
            setVisibleTranslations(prev => ({
                ...prev,
                [index]: true
            }));
        } catch (err) {
            console.error("Translation error:", err);
            setTranslations(prev => ({
                ...prev,
                [index]: "Translation failed."
            }));
        }
    };

    const toggleTranslation = (index) => {
        setVisibleTranslations(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handlePlayAudio = (audioKey, audioSrc) => {
        const player = audioPlayerRef.current;

        // Jeśli aktualnie odtwarzamy to samo audio - zatrzymaj
        if (playingAudio === audioKey) {
            player.pause();
            setPlayingAudio(null);
            return;
        }

        // Zatrzymaj poprzednie audio jeśli było odtwarzane
        player.pause();

        // Ustaw nowe źródło i odtwórz
        player.src = audioSrc;
        player.play();
        setPlayingAudio(audioKey);

        // Resetuj stan po zakończeniu odtwarzania
        player.onended = () => {
            setPlayingAudio(null);
        };
    };

    const handleLogout = async () => {
        await logout();               // wylogowanie użytkownika
        navigate("/chat", { replace: true }); // przekierowanie na stronę główną
    };

    return (
        <div className="chat-shell">
            <ConversationSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="chat-main">
                <div className="chatbox">
                    <div className="chat-header">
                        <button
                            className="sidebar-toggle"
                            onClick={() => setSidebarOpen((open) => !open)}
                            aria-label={sidebarOpen ? "Ukryj historię konwersacji" : "Pokaż historię konwersacji"}
                            title={sidebarOpen ? "Ukryj historię" : "Pokaż historię"}
                        >
                            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>
                        <div className="chat-heading">
                            <h2>Asystent językowy</h2>
                            <p>Rozmawiam i poprawiam twoje błędy</p>
                        </div>
                        <div>
                            {isAuthenticated ? (
                                <button className="auth-btn" onClick={handleLogout}>
                                    Wyloguj
                                </button>
                            ) : (
                                <button
                                    className="auth-btn"
                                    onClick={() => navigate("/login", { replace: true })}
                                >
                                    Zaloguj
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="messages">
                        {historyLoading && (
                            <p className="loading">⏳ Ładowanie historii konwersacji...</p>
                        )}
                        {error && (
                            <p className="conversation-error">{error}</p>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.sender === "user" ? "user-msg" : "bot-msg"} ${msg.type === "error" ? "error-msg" : ""}`}
                            >
                                <div className="message-content">
                                    <p>{msg.text}</p>

                                    {translations[index] && visibleTranslations[index] && (
                                        <p className="translation">{translations[index]}</p>
                                    )}

                                    <div className="message-buttons">
                                        {(msg.audioAssets || []).map((asset, audioIndex) => {
                                            const audioKey = `${index}-${audioIndex}`;
                                            const isPlaying = playingAudio === audioKey;
                                            const label = asset.audio_type === "asr"
                                                ? "Odtwórz nagranie użytkownika"
                                                : "Odtwórz odpowiedź głosową";

                                            return (
                                                <button
                                                    key={asset.id || audioKey}
                                                    onClick={() => handlePlayAudio(audioKey, asset.url)}
                                                    title={isPlaying ? "Wstrzymaj" : label}
                                                    aria-label={isPlaying ? "Wstrzymaj" : label}
                                                    className={`mess ${isPlaying ? "pause" : "play"}`}
                                                >
                                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                                </button>
                                            );
                                        })}

                                        {!translations[index] && (
                                            <button
                                                className="show-btn"
                                                onClick={() => handleTranslate(index, msg.text)}
                                                disabled={loading}
                                            >
                                                Translate
                                            </button>
                                        )}

                                        {translations[index] && visibleTranslations[index] && (
                                            <button
                                                className="hide-btn"
                                                onClick={() => toggleTranslation(index)}
                                            >
                                                Hide Translation
                                            </button>
                                        )}

                                        {translations[index] && !visibleTranslations[index] && (
                                            <button
                                                className="show-btn"
                                                onClick={() => toggleTranslation(index)}
                                            >
                                                Translate
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <span className="message-time">
                                    {(msg.createdAt ? new Date(msg.createdAt) : new Date()).toLocaleTimeString('pl-PL', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {!checkingAuth && !isAuthenticated && (
                        <div className="guest-history-notice">
                            <span>Ta rozmowa nie zostanie zapisana. Zaloguj się, aby zachować historię i wracać do konwersacji.</span>
                            <button onClick={() => navigate("/login")}>Zaloguj się</button>
                        </div>
                    )}

                    <MessageInput
                        onSendText={sendMessage}
                        onSendAudio={sendAudioMessage}
                        disabled={loading || historyLoading}
                    />
                </div>
            </main>
        </div>
    );
}

export default ChatBox;