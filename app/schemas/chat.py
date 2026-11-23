import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    message: str
    audio_id: uuid.UUID | None = None


class MessageAudioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    audio_type: str
    file_path: str
    content_type: str
    duration_ms: int | None
    model_name: str | None
    created_at: datetime


class CorrectionChangeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    original: str
    corrected: str
    explanation: str


class SentenceCorrectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    original: str
    corrected: str
    changes: list[CorrectionChangeRead] = Field(default_factory=list)


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    created_at: datetime
    audio_assets: list[MessageAudioRead] = Field(default_factory=list)
    correction: SentenceCorrectionRead | None = None
