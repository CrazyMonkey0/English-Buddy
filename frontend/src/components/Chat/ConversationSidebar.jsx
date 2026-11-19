import { useEffect, useState } from "react";
import {
    Check,
    LockKeyhole,
    MessageSquare,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
    createConversation,
    deleteConversation,
    getConversations,
    updateConversationTitle,
} from "../../services/chatService";

export default function ConversationSidebar({ open, onClose }) {
    const { isAuthenticated, checkingAuth } = useAuth();
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editedTitle, setEditedTitle] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            setConversations([]);
            return undefined;
        }

        let cancelled = false;
        setLoading(true);
        setError("");

        getConversations()
            .then((items) => {
                if (!cancelled) setConversations(items);
            })
            .catch(() => {
                if (!cancelled) setError("Nie udało się wczytać historii. Odśwież stronę i spróbuj ponownie.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, conversationId]);

    const handleCreate = async () => {
        setWorking(true);
        setError("");
        try {
            const created = await createConversation();
            const id = typeof created === "string" ? created : created.id;
            if (!id) throw new Error("Missing conversation ID");
            navigate(`/chat/${id}`);
        } catch {
            setError("Nie udało się utworzyć nowej konwersacji.");
        } finally {
            setWorking(false);
        }
    };

    const startEditing = (conversation) => {
        setEditingId(conversation.id);
        setEditedTitle(conversation.title || "");
        setError("");
    };

    const handleSaveTitle = async (conversationIdToUpdate) => {
        const title = editedTitle.trim();
        if (!title) {
            setError("Tytuł konwersacji nie może być pusty.");
            return;
        }

        setWorking(true);
        setError("");
        try {
            await updateConversationTitle(conversationIdToUpdate, title);
            setConversations((items) => items.map((item) => (
                item.id === conversationIdToUpdate ? { ...item, title } : item
            )));
            setEditingId(null);
        } catch {
            setError("Nie udało się zmienić tytułu konwersacji.");
        } finally {
            setWorking(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Czy na pewno chcesz usunąć tę konwersację?")) return;

        setWorking(true);
        setError("");
        try {
            await deleteConversation(id);
            setConversations((items) => items.filter((item) => item.id !== id));
            if (conversationId === id) navigate("/chat", { replace: true });
        } catch {
            setError("Nie udało się usunąć konwersacji.");
        } finally {
            setWorking(false);
        }
    };

    return (
        <aside
            className={`conversation-sidebar ${open ? "is-open" : "is-closed"}`}
            aria-label="Historia konwersacji"
            aria-hidden={!open}
            inert={!open}
        >
            <div className="sidebar-heading">
                <span>Twoje konwersacje</span>
                <div className="sidebar-heading-actions">
                    <MessageSquare size={18} aria-hidden="true" />
                    <button
                        className="sidebar-close"
                        onClick={onClose}
                        aria-label="Ukryj historię konwersacji"
                        title="Ukryj historię"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {checkingAuth ? (
                <p className="sidebar-status">Sprawdzanie logowania...</p>
            ) : !isAuthenticated ? (
                <div className="sidebar-locked">
                    <LockKeyhole size={24} aria-hidden="true" />
                    <p>Zaloguj się, aby zarządzać historią korespondencji.</p>
                    <button className="sidebar-login-btn" onClick={() => navigate("/login")}>
                        Zaloguj się
                    </button>
                </div>
            ) : (
                <>
                    <button
                        className="new-conversation-btn"
                        onClick={handleCreate}
                        disabled={working}
                    >
                        <Plus size={18} aria-hidden="true" />
                        Nowa konwersacja
                    </button>

                    {error && <p className="sidebar-error" role="alert">{error}</p>}

                    <div className="conversation-list" aria-live="polite">
                        {loading ? (
                            <p className="sidebar-status">Ładowanie historii...</p>
                        ) : conversations.length === 0 ? (
                            <p className="sidebar-status">Nie masz jeszcze konwersacji.</p>
                        ) : conversations.map((conversation) => (
                            <div
                                className={`conversation-item ${conversation.id === conversationId ? "is-active" : ""}`}
                                key={conversation.id}
                            >
                                {editingId === conversation.id ? (
                                    <form
                                        className="conversation-edit"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            handleSaveTitle(conversation.id);
                                        }}
                                    >
                                        <input
                                            autoFocus
                                            aria-label="Tytuł konwersacji"
                                            value={editedTitle}
                                            onChange={(event) => setEditedTitle(event.target.value)}
                                            maxLength={255}
                                        />
                                        <button type="submit" title="Zapisz tytuł" disabled={working}>
                                            <Check size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Anuluj"
                                            onClick={() => setEditingId(null)}
                                            disabled={working}
                                        >
                                            <X size={16} />
                                        </button>
                                    </form>
                                ) : (
                                    <>
                                        <button
                                            className="conversation-select"
                                            onClick={() => navigate(`/chat/${conversation.id}`)}
                                            title={conversation.title || "Nowa konwersacja"}
                                        >
                                            <span>{conversation.title || "Nowa konwersacja"}</span>
                                        </button>
                                        <button
                                            className="conversation-action"
                                            title="Zmień tytuł"
                                            aria-label="Zmień tytuł konwersacji"
                                            onClick={() => startEditing(conversation)}
                                            disabled={working}
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            className="conversation-action delete-action"
                                            title="Usuń konwersację"
                                            aria-label="Usuń konwersację"
                                            onClick={() => handleDelete(conversation.id)}
                                            disabled={working}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </aside>
    );
}
