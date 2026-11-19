import api from "./api";

export const resolveAudioUrl = (filePath) =>
    new URL(filePath, api.defaults.baseURL).toString();

export const sendMessageToBot = async (
    conversation_id,
    message,
    audio_id = null,
) => {
    const payload = { conversation_id, message };
    if (audio_id) payload.audio_id = audio_id;

    const response = await api.post("/nlp/chat", payload);
    return response.data;
};

export const getConversationMessages = async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
};

export const getConversations = async () => {
    const response = await api.get("/conversations/");
    return response.data;
};

export const createConversation = async () => {
    const response = await api.post("/conversations/");
    return response.data;
};

export const updateConversationTitle = async (conversationId, title) => {
    const response = await api.patch(`/conversations/${conversationId}`, null, {
        params: { new_title: title },
    });
    return response.data;
};

export const deleteConversation = async (conversationId) => {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
};

// Sending audio to ASR (speech recognition)
export const sendAudioToASR = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, `${Date.now()}.wav`);
    const response = await api.post("/asr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// Combination of ASR + NLP (audio -> text -> bot response)
export const sendAudioMessageToBot = async (audioBlob, conversationId) => {
    const asrResult = await sendAudioToASR(audioBlob);
    const transcription = asrResult.transcription;

    const botReply = await sendMessageToBot(
        conversationId,
        transcription,
        asrResult.audio_id,
    );

    return {
        transcription,
        userAudioUrl: resolveAudioUrl(asrResult.audio_url),
        ...botReply
    };
};