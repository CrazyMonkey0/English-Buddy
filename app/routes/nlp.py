import os
from pathlib import Path

from core.rate_limit import limiter
from db.database import get_async_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from models.user import User
from providers.huggingface import get_hf_response
from providers.openai import get_openai_response
from schemas.chat import ChatRequest
from services.chat_service import (
    create_conversation,
    create_message_audio,
    create_message_correction,
    create_new_message,
    get_formatted_context,
    get_owned_conversation,
)
from sqlalchemy.ext.asyncio import AsyncSession
from users import current_active_user

from .tts import save_audio

# Model name for NLP

router = APIRouter()


# Handle chat requests
@router.post("/chat")
@limiter.limit("6/minute")  # Rate limit: 6 requests per minute
async def chat(
    request: Request,
    data: ChatRequest,
    db: AsyncSession = Depends(
        get_async_session,
    ),
    user: User = Depends(current_active_user),
):
    # model, tokenizer = request.app.state.model_nlp, request.app.state.tokenizer_nlp
    provider = os.getenv("PROVIDER", "openai")

    if data.audio_id is not None:
        audio_filename = f"{data.audio_id.hex}.wav"
        audio_path = Path(request.app.state.AUDIO_INPUT_DIR) / audio_filename
        if not audio_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Uploaded audio not found",
            )

    if data.conversation_id is None:
        data.conversation_id = await create_conversation(db, user.id)
    else:
        await get_owned_conversation(db, user.id, data.conversation_id)

    context = await get_formatted_context(db, user.id, data.conversation_id, limit=10)

    context.append({"role": "user", "content": data.message})

    if provider == "hf":
        response = await get_hf_response(context)
        assistant_text = response
        corrections = None
    elif provider == "openai":
        response = await get_openai_response(context)
        assistant_text = response.response
        corrections = response.correction
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid provider specified",
        )

    user_message = await create_new_message(
        db,
        user.id,
        data.conversation_id,
        data.message,
        "user",
    )
    if data.audio_id is not None:
        await create_message_audio(
            db,
            user_message,
            f"/audio/input/{data.audio_id.hex}.wav",
            audio_type="asr",
            content_type="audio/wav",
            model_name="openai/whisper-small.en",
        )

    assistant_message = await create_new_message(
        db,
        user.id,
        data.conversation_id,
        assistant_text,
        "assistant",
    )
    if corrections is not None:
        await create_message_correction(db, assistant_message, corrections)

    # Save response as audio
    url_path = save_audio(request, assistant_text)
    await create_message_audio(
        db,
        assistant_message,
        url_path,
        audio_type="tts",
        content_type="audio/wav",
        model_name="kokoro",
    )
    await db.commit()

    return {
        "conversation_id": data.conversation_id,
        "response": assistant_text,
        "corrections": corrections.model_dump() if corrections else None,
        "audio": f"http://127.0.0.1:8000{url_path}",
    }
