import os
import joblib
import torch
from sentence_transformers import SentenceTransformer, util
import warnings
import json
import urllib.request
import tempfile
import shutil
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

warnings.filterwarnings('ignore')

app = FastAPI(title="Chatbot Engine")

# Global variables to hold models in memory
embedder = None
df = None
faq_embeddings = None
whisper_model = None
MODEL_PATH = 'chatbot_rag_data.joblib'

# Startup event to load heavy ML models ONCE
@app.on_event("startup")
def load_models():
    global embedder, df, faq_embeddings, whisper_model
    print("Loading RAG data...")
    if not os.path.exists(MODEL_PATH):
        print(f"Warning: RAG model data not found at {MODEL_PATH}. Please run build_rag.py first.")
    else:
        model_data = joblib.load(MODEL_PATH)
        df = model_data['df']
        faq_embeddings = model_data['embeddings']
        print("RAG data loaded successfully.")
    
    print("Loading SentenceTransformer model...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Loading Whisper model...")
    if WhisperModel:
        whisper_model = WhisperModel("base.en", device="cpu", compute_type="int8")
        print("Whisper model loaded.")
        
    print("Models loaded successfully. Server is ready.")

class ChatRequest(BaseModel):
    query: str
    top_k: int = 1

class ChatResponse(BaseModel):
    response: str

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    if df is None or faq_embeddings is None or embedder is None:
        raise HTTPException(status_code=500, detail="Models are not loaded properly.")
    
    try:
        user_query = req.query
        
        # Calculate embeddings
        query_embedding = embedder.encode(user_query, convert_to_tensor=True)

        # Retrieve top K similar FAQs
        hits = util.semantic_search(query_embedding, faq_embeddings, top_k=req.top_k)[0]
        
        context_parts = []
        best_score = hits[0]['score']
        
        # If the best score is high enough, include RAG context as supplementary reference
        if best_score < 0.2:
            context_str = ""
        else:
            for hit in hits:
                idx = hit['corpus_id']
                q = df.iloc[idx]['question']
                a = df.iloc[idx]['answer']
                context_parts.append(f"Q: {q}\nA: {a}")
            context_str = "\n\n".join(context_parts)
        
        # General-purpose AI assistant system prompt
        system_prompt = """You are an advanced AI assistant — intelligent, helpful, and versatile, similar to ChatGPT, Gemini, and Claude.

CAPABILITIES:
- You can answer questions on any topic: science, math, history, technology, philosophy, creative writing, coding, and more.
- You can help with analysis, brainstorming, explanations, problem-solving, writing, and general conversation.
- You can write code, explain concepts, summarize information, translate, and assist with creative tasks.

PERSONALITY:
- Be conversational, clear, and helpful.
- Match the depth of your response to the complexity of the question — simple questions get concise answers, complex ones get thorough explanations.
- Be direct. Don't start with "Great question!" or "Based on...". Just answer naturally.
- If you're unsure about something, say so honestly rather than making things up.
- Use formatting (lists, code blocks, headers) when it improves readability, but keep casual questions casual.

You may be given supplementary reference context below — use it if relevant, but primarily rely on your own broad knowledge."""

        # Build the prompt — include RAG context only if available
        if context_str:
            prompt = f"""Reference context (use only if relevant):
{context_str}

User: {user_query}"""
        else:
            prompt = f"User: {user_query}"

        # Generate response using local Ollama
        url = "http://localhost:11434/api/generate"
        data = {
            "model": "llama3",
            "system": system_prompt,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "top_k": 40,
                "num_predict": 512,
                "repeat_penalty": 1.1
            }
        }
        
        ollama_req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(ollama_req) as response:
            result = json.loads(response.read().decode('utf-8'))
            generated_answer = result.get('response', '')
            
        return ChatResponse(response=generated_answer.strip())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if whisper_model is None:
        raise HTTPException(status_code=500, detail="Whisper model not loaded.")
    
    try:
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        segments, info = whisper_model.transcribe(tmp_path, beam_size=5)
        text = " ".join([segment.text for segment in segments])
        
        return {"text": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("chatbot_engine:app", host="0.0.0.0", port=8000, reload=True)
