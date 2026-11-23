import os

from core.rate_limit import limiter, rate_limit_handler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from middleware.rate_limit import RateLimitMiddleware
from routes import auth, conversation, csrf, users
from routes.asr import load_model_asr
from routes.asr import router as asr_router
from routes.nlp import router as nlp_router
from routes.translation import load_model_translation
from routes.translation import router as trans_router
from routes.tts import load_model_tts
from middleware.csrf_middleware import CSRFMiddleware

# from middleware.csrf_middleware import CSRFMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Initialize application
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Add rate limiting middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(RateLimitMiddleware)

app.add_middleware(CSRFMiddleware)

# Load the pre-trained Translation
app.state.model_trans, app.state.tokenizer_trans = load_model_translation()

# Load the pre-trained TTS
app.state.model_tts = load_model_tts()

# Load the pre-trained ASR
app.state.processor_asr, app.state.model_asr = load_model_asr()

# Include the NLP router
app.include_router(nlp_router, prefix="/nlp", tags=["NLP"])
# Include the translation router
app.include_router(trans_router)
# Include the ASR router
app.include_router(asr_router)

app.include_router(auth.router, prefix="/auth", tags=["auth"])

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(csrf.router, prefix="/security", tags=["security"])
app.include_router(conversation.router, prefix="/conversations", tags=["conversations"])

# set base directory for static files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Set the directory path for saving audio files
app.state.AUDIO_DIR = os.path.join(BASE_DIR, "static", "audio")
# Mount the audio directory to the /audio path
app.mount("/audio", StaticFiles(directory=app.state.AUDIO_DIR), name="audio")
# Create input and output directories if they don't exist

app.state.AUDIO_INPUT_DIR = os.path.join(app.state.AUDIO_DIR, "input")

app.state.AUDIO_OUTPUT_DIR = os.path.join(app.state.AUDIO_DIR, "output")
os.makedirs(app.state.AUDIO_DIR, exist_ok=True)
os.makedirs(app.state.AUDIO_INPUT_DIR, exist_ok=True)
os.makedirs(app.state.AUDIO_OUTPUT_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"message": "Welcome to the English Learning API"}
