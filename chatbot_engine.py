import os
import time
import threading
import joblib
import numpy as np
import warnings
import json
import urllib.request
import tempfile
import shutil
import asyncio
import edge_tts
try:
    from playsound import playsound
except ImportError:
    playsound = None

from fastapi import FastAPI, HTTPException, File, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

warnings.filterwarnings('ignore')

app = FastAPI(title="Chatbot Engine V5.0")

# ──────────────────────────────────────────────────────────
# Global state — only the essentials loaded at startup
# ──────────────────────────────────────────────────────────
embedder = None
df = None
faq_embeddings = None       # NumPy float16 array
_startup_time = None        # Track startup duration
MODEL_PATH = 'chatbot_rag_data.joblib'

# Whisper is lazy-loaded — NOT loaded at startup
_whisper_model = None
_whisper_lock = threading.Lock()
_whisper_loading = False

# ──────────────────────────────────────────────────────────
# Startup — lean and fast
# ──────────────────────────────────────────────────────────
@app.on_event("startup")
def load_models():
    global embedder, df, faq_embeddings, _startup_time
    start = time.time()

    # 1. Load RAG data (tiny — ~50–100 KB)
    print("Loading RAG data...")
    if not os.path.exists(MODEL_PATH):
        print(f"Warning: RAG model data not found at {MODEL_PATH}. Please run build_rag.py first.")
    else:
        model_data = joblib.load(MODEL_PATH)
        df = model_data['df']
        raw_embeddings = model_data['embeddings']

        # Handle both old (PyTorch tensor) and new (NumPy float16) formats
        if hasattr(raw_embeddings, 'numpy'):
            # Old format: PyTorch tensor → convert to NumPy float32
            faq_embeddings = raw_embeddings.cpu().numpy().astype(np.float32)
        elif isinstance(raw_embeddings, np.ndarray):
            # New format: NumPy array — upcast float16 → float32 for cosine sim
            faq_embeddings = raw_embeddings.astype(np.float32)
        else:
            faq_embeddings = np.array(raw_embeddings, dtype=np.float32)

        print(f"RAG data loaded: {len(df)} entries, embeddings shape {faq_embeddings.shape}")

    # 2. Load SentenceTransformer with ONNX backend for faster CPU inference
    print("Loading SentenceTransformer model (ONNX backend)...")
    from sentence_transformers import SentenceTransformer

    try:
        # Use quantized int8 model for smallest footprint & fastest CPU inference
        embedder = SentenceTransformer(
            'all-MiniLM-L6-v2',
            backend="onnx",
            model_kwargs={"file_name": "onnx/model_quint8_avx2.onnx"},
        )
        print("Loaded with ONNX backend (quantized int8, optimized for CPU).")
    except Exception as e:
        print(f"ONNX backend failed ({e}), falling back to PyTorch...")
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("Loaded with PyTorch backend (fallback).")

    # 3. Whisper is NOT loaded here — lazy loaded on first /transcribe call
    #    This saves ~150 MB of RAM at startup
    print("Whisper model: deferred (will load on first voice request)")

    _startup_time = time.time() - start
    print(f"Server ready in {_startup_time:.2f}s")


# ──────────────────────────────────────────────────────────
# Lazy Whisper loader — only loads when actually needed
# ──────────────────────────────────────────────────────────
def get_whisper_model():
    """Load Whisper model on first use. Thread-safe with lock."""
    global _whisper_model, _whisper_loading

    if _whisper_model is not None:
        return _whisper_model

    if WhisperModel is None:
        return None

    with _whisper_lock:
        # Double-check after acquiring lock
        if _whisper_model is not None:
            return _whisper_model

        _whisper_loading = True
        print("Loading Whisper model on first voice request...")
        start = time.time()
        _whisper_model = WhisperModel("base.en", device="cpu", compute_type="int8")
        _whisper_loading = False
        print(f"Whisper model loaded in {time.time() - start:.2f}s")
        return _whisper_model


# ──────────────────────────────────────────────────────────
# Cosine similarity using NumPy (no PyTorch needed)
# ──────────────────────────────────────────────────────────
def cosine_similarity_np(query_vec: np.ndarray, corpus_vecs: np.ndarray) -> np.ndarray:
    """Compute cosine similarity between a query vector and corpus vectors using NumPy."""
    # Normalize
    query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-8)
    corpus_norms = corpus_vecs / (np.linalg.norm(corpus_vecs, axis=1, keepdims=True) + 1e-8)
    # Dot product gives cosine similarity for normalized vectors
    return corpus_norms @ query_norm.T


# ──────────────────────────────────────────────────────────
# Request / Response models
# ──────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str
    top_k: int = 1
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    system_prompt: str | None = None

class ChatResponse(BaseModel):
    response: str

# Default system prompt used when none is provided by the frontend
DEFAULT_SYSTEM_PROMPT = """You are an advanced AI assistant — intelligent, helpful, and versatile, similar to ChatGPT, Gemini, and Claude.

CAPABILITIES:
- You can answer questions on any topic: science, math, history, technology, philosophy, creative writing, coding, and more.
- You can help with analysis, brainstorming, explanations, problem-solving, writing, and general conversation.
- You can write code, explain concepts, summarize information, translate, and assist with creative tasks.

PERSONALITY:
- Be conversational, clear, and helpful.
- Match the depth of your response to the complexity of the question — simple questions get concise answers, complex ones get thorough explanations.
- Be direct. Don't start with "Great question!" or "Based on...". Just answer naturally.
- If you're unsure about something, say so honestly rather than making things up. Do NOT hallucinate.
- Use formatting (lists, code blocks, headers) when it improves readability, but keep casual questions casual.

You may be given supplementary reference context below. If context is provided, you MUST base your answer primarily on the context. If the answer cannot be found in the context, clearly state that you do not know. Do not hallucinate or invent information."""


# ──────────────────────────────────────────────────────────
# Text-to-Speech integration (V5.0)
# ──────────────────────────────────────────────────────────
def speak_text(text: str):
    """Generates audio from text using edge_tts and plays it using playsound."""
    if not playsound:
        print("playsound module not available, cannot play audio.")
        return
        
    async def _generate_and_play():
        voice = "en-US-AriaNeural"
        communicate = edge_tts.Communicate(text, voice)
        
        # Create a temporary file to hold the MP3
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_audio:
            tmp_filename = tmp_audio.name
            
        try:
            await communicate.save(tmp_filename)
            playsound(tmp_filename)
        except Exception as e:
            print(f"Error in TTS / playsound: {e}")
        finally:
            if os.path.exists(tmp_filename):
                try:
                    os.remove(tmp_filename)
                except Exception:
                    pass

    # Run the async task in a new event loop
    try:
        asyncio.run(_generate_and_play())
    except Exception as e:
        print(f"Failed to run TTS event loop: {e}")


# ──────────────────────────────────────────────────────────
# Chat endpoint
# ──────────────────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest, background_tasks: BackgroundTasks):
    if df is None or faq_embeddings is None or embedder is None:
        raise HTTPException(status_code=503, detail="Models are not loaded yet. Server is still starting up.")

    try:
        user_query = req.query

        # Encode query — returns NumPy array with ONNX backend
        query_embedding = embedder.encode(user_query, convert_to_numpy=True).astype(np.float32)

        # Semantic search using pure NumPy (no PyTorch dependency)
        similarities = cosine_similarity_np(query_embedding, faq_embeddings).flatten()

        # Get top K indices
        top_k = min(req.top_k, len(similarities))
        top_indices = np.argsort(similarities)[::-1][:top_k]

        context_parts = []
        best_score = float(similarities[top_indices[0]])

        # If the best score is high enough, include RAG context (Threshold increased to 0.45 to prevent irrelevant context hallucination)
        if best_score < 0.45:
            context_str = ""
        else:
            for idx in top_indices:
                q = df.iloc[idx]['question']
                a = df.iloc[idx]['answer']
                context_parts.append(f"Q: {q}\nA: {a}")
            context_str = "\n\n".join(context_parts)

        # Use provided system prompt or fall back to default
        system_prompt = req.system_prompt if req.system_prompt else DEFAULT_SYSTEM_PROMPT

        # Build the prompt
        if context_str:
            prompt = f"""Reference context (use only if relevant):
{context_str}

User: {user_query}"""
        else:
            prompt = f"User: {user_query}"

        # Use provided settings or fall back to defaults
        selected_model = req.model or "llama3"
        # Lowered default temperature from 0.7 to 0.2 for more deterministic, grounded responses
        selected_temperature = req.temperature if req.temperature is not None else 0.2
        selected_max_tokens = req.max_tokens if req.max_tokens is not None else 512

        # Generate response using local Ollama
        url = "http://localhost:11434/api/generate"
        data = {
            "model": selected_model,
            "system": system_prompt,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": selected_temperature,
                "top_p": 0.9,
                "top_k": 40,
                "num_predict": selected_max_tokens,
                "repeat_penalty": 1.1
            }
        }

        ollama_req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(ollama_req, timeout=120) as response:
                result = json.loads(response.read().decode('utf-8'))
                generated_answer = result.get('response', '')
        except urllib.error.URLError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Cannot reach Ollama at {url}. Is Ollama running? Error: {str(e)}"
            )
        except TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Ollama request timed out after 120 seconds."
            )

        # Generate and play audio response in the background (V5.0)
        background_tasks.add_task(speak_text, generated_answer.strip())

        return ChatResponse(response=generated_answer.strip())

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


# ──────────────────────────────────────────────────────────
# Transcribe endpoint — lazy loads Whisper
# ──────────────────────────────────────────────────────────
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    whisper = get_whisper_model()

    if whisper is None:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not available. Install faster-whisper: pip install faster-whisper"
        )

    try:
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        segments, info = whisper.transcribe(tmp_path, beam_size=5)
        text = " ".join([segment.text for segment in segments])

        return {"text": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ──────────────────────────────────────────────────────────
# Document Parsing endpoint (V5.1)
# ──────────────────────────────────────────────────────────
@app.post("/parse_document")
async def parse_document(file: UploadFile = File(...)):
    """Extracts text from uploaded documents (PDF, DOCX, TXT, CSV) to use as context."""
    try:
        suffix = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        content_bytes = await file.read()
        extracted_text = ""
        
        if suffix in [".txt", ".csv", ".md", ".json"]:
            extracted_text = content_bytes.decode('utf-8', errors='replace')
            
        elif suffix == ".pdf":
            try:
                import PyPDF2
                from io import BytesIO
                pdf_reader = PyPDF2.PdfReader(BytesIO(content_bytes))
                text_parts = []
                for page in pdf_reader.pages:
                    text_parts.append(page.extract_text() or "")
                extracted_text = "\n".join(text_parts)
            except ImportError:
                raise HTTPException(status_code=501, detail="PyPDF2 not installed. Cannot parse PDF.")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")
                
        elif suffix in [".docx", ".doc"]:
            try:
                import docx
                from io import BytesIO
                doc = docx.Document(BytesIO(content_bytes))
                text_parts = [p.text for p in doc.paragraphs]
                extracted_text = "\n".join(text_parts)
            except ImportError:
                raise HTTPException(status_code=501, detail="python-docx not installed. Cannot parse DOCX.")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read DOCX: {str(e)}")
                
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")

        # Truncate extremely large texts to ~25,000 characters to protect LLM context windows
        max_chars = 25000
        if len(extracted_text) > max_chars:
            extracted_text = extracted_text[:max_chars] + "\n\n...[Content truncated due to length limitations]..."

        return {"text": extracted_text.strip()}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing document: {str(e)}")


# ──────────────────────────────────────────────────────────
# Health endpoint — reports system status & resource usage
# ──────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    """Report server health, model status, and memory usage."""
    import gc

    # Gather memory info (works without psutil)
    try:
        import psutil
        proc = psutil.Process()
        mem_mb = proc.memory_info().rss / 1024 / 1024
    except ImportError:
        # Fallback: read from /proc on Linux, or estimate on Windows
        mem_mb = None

    # Check ONNX backend
    onnx_active = False
    if embedder is not None:
        try:
            # SentenceTransformer with ONNX backend has _backend attribute
            onnx_active = hasattr(embedder, '_backend') or 'onnx' in str(type(embedder)).lower()
        except Exception:
            pass

    status = {
        "status": "healthy" if (embedder is not None and df is not None) else "degraded",
        "startup_time_seconds": round(_startup_time, 2) if _startup_time else None,
        "models": {
            "embedder": {
                "loaded": embedder is not None,
                "name": "all-MiniLM-L6-v2",
                "backend": "onnx" if onnx_active else "pytorch",
            },
            "rag_data": {
                "loaded": df is not None,
                "entries": len(df) if df is not None else 0,
                "embedding_shape": list(faq_embeddings.shape) if faq_embeddings is not None else None,
            },
            "whisper": {
                "loaded": _whisper_model is not None,
                "loading": _whisper_loading,
                "available": WhisperModel is not None,
                "note": "Lazy-loaded on first /transcribe request" if _whisper_model is None else "Ready",
            },
        },
        "memory_mb": round(mem_mb, 1) if mem_mb else "psutil not installed",
    }

    return JSONResponse(content=status)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("chatbot_engine:app", host="0.0.0.0", port=8000, reload=True)
