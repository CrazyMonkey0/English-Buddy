import api from "./api";

export const sendMessageToBot = async (conversation_id, message) => {
    const response = await api.post("/nlp/chat", { conversation_id, message });
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

    const botReply = await sendMessageToBot(conversationId, transcription);

    return {
        transcription,
        ...botReply
    };
};