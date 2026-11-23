from pydantic import BaseModel, Field


class CorrectionChange(BaseModel):
    original: str
    corrected: str
    explanation: str


class SentenceCorrection(BaseModel):
    original: str
    corrected: str
    changes: list[CorrectionChange] = Field(default_factory=list)


class EnglishBuddyResponse(BaseModel):
    response: str
    correction: SentenceCorrection | None = None
