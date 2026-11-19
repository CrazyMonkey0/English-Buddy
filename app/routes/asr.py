import os
import uuid

import librosa
from core.rate_limit import limiter
from fastapi import APIRouter, Depends, File, Request, UploadFile
from models.user import User
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from users import current_active_user

router = APIRouter()


def load_model_asr():
    processor = WhisperProcessor.from_pretrained("openai/whisper-small.en")
    model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small.en")
    return processor, model


@router.post("/asr")
@limiter.limit("4/minute")
async def asr(
    request: Request,
    audio: UploadFile = File(...),
    user: User = Depends(current_active_user),
):
    # Get the loaded ASR model and processor
    processor, model = request.app.state.processor_asr, request.app.state.model_asr
    # Audio file path
    audio_id = uuid.uuid4()
    audio.filename = f"{audio_id.hex}.wav"

    audio_path = os.path.join(request.app.state.AUDIO_INPUT_DIR, audio.filename)
    with open(audio_path, "wb") as f:
        f.write(await audio.read())

    # Loading audio file
    audio_data, sampling_rate = librosa.load(audio_path, sr=16000)

    # Preparing input data
    inputs = processor(audio_data, return_tensors="pt", sampling_rate=sampling_rate)
    input_features = inputs["input_features"]

    # Generating token IDs
    output = model.generate(input_features)

    # Decoding tokens into text
    transcription = processor.batch_decode(output, skip_special_tokens=True)

    return {
        "transcription": transcription[0],
        "audio_id": str(audio_id),
        "audio_url": f"/audio/input/{audio.filename}",
    }
