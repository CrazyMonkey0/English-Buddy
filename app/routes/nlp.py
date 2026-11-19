import uuid
from pathlib import Path

from core.rate_limit import limiter
from db.database import get_async_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from models.user import User
from schemas.chat import ChatRequest
from services.chat_service import (
    create_conversation,
    create_message_audio,
    create_new_message,
    get_formatted_context,
    get_owned_conversation,
)
from sqlalchemy.ext.asyncio import AsyncSession
from transformers import AutoModelForCausalLM, AutoTokenizer
from users import current_active_user

from .tts import save_audio

# Model name for NLP
model_name = "Qwen/Qwen2.5-1.5B-Instruct"
router = APIRouter()


# Load NLP model and tokenizer
def load_model_nlp():
    model = AutoModelForCausalLM.from_pretrained(
        model_name, torch_dtype="auto", device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    return model, tokenizer


# Handle chat requests
@router.post("/chat")
@limiter.limit("4/minute")  # Rate limit: 4 requests per minute
async def chat(
    request: Request,
    data: ChatRequest,
    db: AsyncSession = Depends(
        get_async_session,
    ),
    user: User = Depends(current_active_user),
):
    model, tokenizer = request.app.state.model_nlp, request.app.state.tokenizer_nlp

    if data.audio_id is not None:
        audio_filename = f"{data.audio_id.hex}.wav"
        audio_path = Path(request.app.state.AUDIO_INPUT_DIR) / audio_filename
        if not audio_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Uploaded audio not found",
            )

    if data.conversation_id is None:
        data.conversation_id = await create_conversation(
            db, user.id, title="New Conversation"
        )
    else:
        await get_owned_conversation(db, user.id, data.conversation_id)

    context = await get_formatted_context(db, user.id, data.conversation_id)

    context.append({"role": "user", "content": data.message})

    # Tokenize input and generate a response
    text = tokenizer.apply_chat_template(
        context, tokenize=False, add_generation_prompt=True
    )
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=512,
        top_p=0.9,
        temperature=0.7,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
    )

    # Decode the response
    generated_ids = [
        output_ids[len(input_ids) :]
        for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]
    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
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
        response,
        "assistant",
    )

    # Save response as audio
    url_path = save_audio(request, response)
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
        "response": response,
        "audio": f"http://127.0.0.1:8000{url_path}",
    }
