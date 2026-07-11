<p align="center">
  <img src="frontend/public/logo.svg" alt="Aether AI Logo" width="96" height="96" />
</p>

<h1 align="center">Aether AI</h1>

<p align="center">
  <strong>A premium, spatially-designed AI chatbot with a futuristic glassmorphism interface, powered by local LLMs and RAG-enhanced intelligence.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-5.0.0-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/next.js-16-000000?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/react-19-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/typescript-5-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/python-3.10+-3776ab?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/ollama-llama3-FF6B2C?style=flat-square" />
</p>

---

## ✨ Overview

**Aether AI** is a full-stack AI chatbot that runs entirely on your local machine — no cloud APIs, no subscriptions, no data leaving your device. It combines a **Next.js 16** spatial UI with a **FastAPI** backend powered by **Ollama (Llama 3)**, enhanced with **RAG (Retrieval-Augmented Generation)** for grounded answers and **Whisper** for voice input.

The interface is designed to feel like *"If Apple designed ChatGPT for 2030"* — dark glassmorphism, animated gradient borders, bento grid dashboards, and buttery-smooth Framer Motion animations.

### Key Highlights

- 🧠 **Local LLM** — Powered by Ollama running Llama 3 on your machine. Zero cloud dependency.
- 🔍 **RAG Pipeline** — Sentence Transformers + semantic search for context-aware answers
- 🎤 **Voice Input** — Faster Whisper speech-to-text with real-time transcription
- 💬 **Multi-Session Chat** — Persistent conversations with SQLite via Prisma ORM
- 🎨 **Spatial UI** — Glassmorphism, animated gradient borders, neon glows, bento grid layout
- 📱 **Responsive** — Desktop, tablet, and mobile adaptive layouts
- 🧩 **Smart Suggestions** — Context-aware follow-up prompts based on conversation topic

---

## 🏗️ Architecture

Aether AI uses a clean 3-layer architecture with a Next.js frontend proxying to a Python ML backend:

```
┌──────────────────────────────────────────────────────┐
│                  Next.js Frontend                     │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐  │
│  │Sidebar │ │BentoGrid │ │ChatArea │ │ ChatInput │  │
│  └────────┘ └──────────┘ └─────────┘ └───────────┘  │
│              Framer Motion · Glassmorphism            │
└────────────────────┬─────────────────────────────────┘
                     │  Next.js API Routes (proxy)
┌────────────────────▼─────────────────────────────────┐
│              Next.js API Layer                        │
│  /api/chat ──────► Python FastAPI (:8000/chat)       │
│  /api/sessions ──► Prisma ORM (SQLite)               │
│  /api/transcribe ► Python FastAPI (:8000/transcribe) │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│           Python FastAPI Backend (:8000)              │
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │ SentenceTransf.  │  │ Ollama (Llama 3)         │   │
│  │ all-MiniLM-L6-v2│  │ localhost:11434           │   │
│  └────────┬────────┘  └──────────┬───────────────┘   │
│           │ Semantic Search      │ LLM Generation    │
│  ┌────────▼────────┐  ┌──────────▼───────────────┐   │
│  │ RAG Embeddings  │  │ Faster Whisper (STT)     │   │
│  │ (.joblib store) │  │ base.en · CPU · int8     │   │
│  └─────────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 · React 19 · TypeScript 5 |
| **Styling** | Tailwind CSS v4 · Glassmorphism · CSS Gradients |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Database** | SQLite via Prisma ORM 5 |
| **Backend** | Python · FastAPI · Uvicorn |
| **LLM** | Ollama (Llama 3) — local inference |
| **Embeddings** | Sentence Transformers (all-MiniLM-L6-v2) |
| **Speech-to-Text** | Faster Whisper (base.en) |
| **Typography** | Space Grotesk (Google Fonts) |

---

## 📁 Project Structure

```
ChatBot/
├── chatbot_engine.py              # FastAPI backend: LLM chat + RAG + Whisper STT
├── build_rag.py                   # One-shot script to build RAG embeddings
├── customer_support_faq.csv       # Source FAQ data for RAG knowledge base
├── chatbot_rag_data.joblib        # Pre-computed embeddings (binary)
├── chatbot_model.joblib           # Legacy model artifact
├── chatbot_implementation.ipynb   # Jupyter notebook for experimentation
│
└── frontend/                      # Next.js 16 application
    ├── .env                       # DATABASE_URL, NEXTAUTH config
    ├── package.json               # Dependencies & scripts
    ├── next.config.ts             # Next.js configuration
    ├── tsconfig.json              # TypeScript configuration
    ├── postcss.config.mjs         # PostCSS + Tailwind v4
    │
    ├── prisma/
    │   ├── schema.prisma          # Database schema (ChatSession + Message)
    │   └── dev.db                 # SQLite database file
    │
    ├── public/
    │   └── favicon.ico            # App icon
    │
    └── src/
        ├── app/
        │   ├── layout.tsx         # Root layout: Space Grotesk font, dark theme
        │   ├── page.tsx           # Home page: Sidebar + Header + ChatWorkspace
        │   ├── globals.css        # Design system: glassmorphism, grid, glows
        │   │
        │   └── api/
        │       ├── chat/
        │       │   └── route.ts   # POST /api/chat → proxy to Python + save messages
        │       ├── sessions/
        │       │   ├── route.ts   # GET/POST /api/sessions → CRUD chat sessions
        │       │   └── [id]/
        │       │       └── messages/
        │       │           └── route.ts  # GET session messages
        │       └── transcribe/
        │           └── route.ts   # POST /api/transcribe → proxy to Whisper
        │
        ├── components/
        │   ├── chat/
        │   │   ├── ChatWorkspace.tsx  # Orchestrator: sessions, messages, suggestions
        │   │   ├── ChatArea.tsx       # Message list with spring animations
        │   │   └── ChatInput.tsx      # Animated gradient input with voice recording
        │   ├── dashboard/
        │   │   └── BentoGrid.tsx      # 10-card bento dashboard with per-card colors
        │   ├── layout/
        │   │   ├── Header.tsx         # Top bar: search, notifications, profile
        │   │   └── Sidebar.tsx        # Collapsible sidebar with session history
        │   ├── ui/
        │   │   └── GlassCard.tsx      # Reusable glassmorphism card component
        │   └── providers/             # (Reserved for context providers)
        │
        ├── lib/
        │   └── utils.ts           # cn() helper — clsx + tailwind-merge
        │
        └── types/                 # (Reserved for shared TypeScript types)
```

---

## 🚀 Features

### 💬 Chat Interface

| Feature | Description |
|---|---|
| **Multi-Session Management** | Create, switch, and persist unlimited chat sessions. Sessions are auto-titled from the first message. |
| **Spring-Animated Messages** | Every message bubble animates in with Framer Motion spring physics (`stiffness: 400, damping: 30`). |
| **User & Assistant Avatars** | User messages show a violet-to-cyan gradient avatar. Assistant messages show a sparkle icon with a live online indicator. |
| **Smart Auto-Scroll** | New messages smoothly scroll into view using container-scoped `scrollTo()` — never hijacks the page. |
| **Error Resilience** | If the backend is unreachable, the chat gracefully shows an error message instead of crashing. |

### 🧩 Smart Suggestions

Context-aware follow-up prompts appear dynamically based on the last message topic:

| Topic Detected | Suggestions Shown |
|---|---|
| **Code / Programming** | "Add error handling" · "Explain step by step" · "Optimize this code" |
| **Writing / Stories** | "Make it more descriptive" · "Shorten this" · "Write a different version" |
| **Explanations** | "Give me an example" · "Explain like I'm five" · "Practical applications" |
| **Math / Calculations** | "Step-by-step solution" · "Graph this" · "What formula" |
| **Default** | "Tell me more" · "Summarize that" · "What else should I know" |

### 🎤 Voice Input

- Click the microphone button to start recording via the **MediaRecorder API**
- Audio is captured as WebM, sent to the backend's **Faster Whisper** model
- Transcribed text is automatically inserted into the input field
- Visual states: idle → recording (red pulse) → transcribing → ready

### 🎨 Bento Grid Dashboard

A 10-card spatial dashboard displayed when no chat session is active:

| Card | Color Accent | Content |
|---|---|---|
| Conversation Stats | Cyan | 98.2% Accuracy |
| AI Models | Violet | Aether-v5.0 Active |
| Memory | Amber | 4.2 TB Indexed |
| Recent Chats | Rose | 12 active sessions |
| Files | Emerald | 24 docs syncing |
| Knowledge Base | Teal | Connected |
| Workspace | Sky | Team Alpha |
| Voice Assistant | Indigo | Listening |
| Prompt Library | Fuchsia | 145 Saved |
| Settings | Neutral | System Preferences |

Each card has its own **color-themed icon background, hover glow shadow, and hover border tint**.

---

## 🧠 AI Backend

### RAG Pipeline

The backend uses **Retrieval-Augmented Generation** to enhance LLM responses with grounded knowledge:

```
User Query
    │
    ▼
┌─────────────────────┐
│ SentenceTransformer  │   Encode query → 384-dim vector
│ all-MiniLM-L6-v2     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Semantic Search      │   cosine similarity vs. pre-computed FAQ embeddings
│ top_k=2              │
└──────────┬──────────┘
           │
           ▼
    score ≥ 0.2?
    ├── YES → inject context into prompt
    └── NO  → rely on LLM's own knowledge
           │
           ▼
┌─────────────────────┐
│ Ollama / Llama 3     │   Generate response with system prompt + context
│ temp=0.7 · top_p=0.9 │
└─────────────────────┘
```

### Model Configuration

| Parameter | Value | Purpose |
|---|---|---|
| `model` | `llama3` | Meta's Llama 3 via Ollama |
| `temperature` | `0.7` | Balanced creativity vs. accuracy |
| `top_p` | `0.9` | Nucleus sampling threshold |
| `top_k` | `40` | Token candidate pool size |
| `num_predict` | `512` | Max response tokens |
| `repeat_penalty` | `1.1` | Mild repetition suppression |

### Supported AI Models

Aether supports dynamic model switching via the Settings modal. To use these models, you must first install them locally using Ollama:

| Model Name | Description | Installation Command |
|---|---|---|
| **Llama 3** | Meta's flagship model (default). Excellent general knowledge. | `ollama pull llama3` |
| **Mistral** | Fast, efficient, and highly capable for its size. | `ollama pull mistral` |
| **Code Llama** | Fine-tuned specifically for generating and discussing code. | `ollama pull codellama` |
| **Gemma** | Google's state-of-the-art open models built from Gemini. | `ollama pull gemma` |
| **Phi-3** | Microsoft's small language model, extremely fast for quick queries. | `ollama pull phi3` |

*Note: If you select a model in the UI that hasn't been pulled yet, the backend will return a "model not found" error.*

### System Persona

The AI is configured as a general-purpose assistant (similar to ChatGPT/Gemini/Claude) with:
- **Broad capabilities**: science, math, coding, writing, analysis, brainstorming
- **Adaptive depth**: simple questions → concise answers; complex ones → thorough explanations
- **Honest uncertainty**: admits when unsure rather than hallucinating
- **Smart formatting**: uses lists and code blocks only when they improve readability

---

## 🎨 Design System

### Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| **Background** | Near-Black | `#06060A` | Page background |
| **Foreground** | Off-White | `#F0EFF4` | Primary text |
| **Primary** | Electric Violet | `#8B5CF6` | Primary accent, buttons, glows |
| **Secondary** | Cyan | `#06B6D4` | Search focus, secondary accent |
| **Accent** | Rose | `#F43F5E` | Notifications, alerts |
| **Warm** | Amber | `#F59E0B` | Warnings, warm highlights |
| **Sidebar Warm** | Orange | `#FF6B2C` | Sidebar accents, logo gradient |

### Glassmorphism Recipe

```css
background: white/[0.03]       /* near-transparent white */
backdrop-filter: blur(20px)     /* frosted glass effect */
border: 1px solid white/[0.06] /* subtle edge definition */
border-radius: 24px             /* generous rounding */
box-shadow: 0 8px 32px rgba(0,0,0,0.4)  /* depth shadow */
```

### Special Effects

| Effect | Implementation |
|---|---|
| **Animated Gradient Border** | `conic-gradient` with `animate-[spin_4s_linear_infinite]` around the chat input |
| **Background Grid** | CSS `linear-gradient` grid lines at 4% opacity, 48px spacing |
| **Corner Glows** | 4 layered `radial-gradient` ellipses (violet, cyan, rose, amber) |
| **Hover Lift** | Framer Motion `whileHover={{ y: -2, scale: 1.02 }}` on cards |
| **Spring Animations** | `type: "spring", stiffness: 400, damping: 30` for message entrance |
| **Typing Indicator** | 3 dots cycling violet → cyan → rose with staggered pulse animations |

---

## 🔧 Installation & Development

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | v18+ | Frontend runtime |
| [Python](https://www.python.org/) | 3.10+ | Backend runtime |
| [Ollama](https://ollama.ai/) | Latest | Local LLM inference |

### 1. Clone & Install Frontend

```bash
git clone https://github.com/your-username/ChatBot.git
cd ChatBot/frontend

# Install dependencies
npm install

# Initialize the database
npx prisma generate
npx prisma db push
```

### 2. Install Python Backend

```bash
cd ChatBot

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install fastapi uvicorn sentence-transformers joblib torch pandas
pip install faster-whisper   # Optional: for voice input
```

### 3. Setup Ollama

```bash
# Install Ollama from https://ollama.ai
# Pull the Llama 3 model
ollama pull llama3
```

### 4. Build RAG Embeddings

```bash
cd ChatBot
python build_rag.py
# → Creates chatbot_rag_data.joblib
```

### 5. Run the Application

```bash
# Terminal 1: Start Ollama (if not running as a service)
ollama serve

# Terminal 2: Start the Python backend
cd ChatBot
python chatbot_engine.py
# → FastAPI running on http://localhost:8000

# Terminal 3: Start the Next.js frontend
cd ChatBot/frontend
npm run dev
# → Next.js running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) to start chatting.

---

## 📡 API Reference

### Next.js API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message → saves to DB → proxies to Python → returns AI response |
| `GET` | `/api/sessions` | List all chat sessions (sorted by last updated) |
| `POST` | `/api/sessions` | Create a new chat session with a title |
| `GET` | `/api/sessions/[id]/messages` | Get all messages for a specific session |
| `POST` | `/api/transcribe` | Forward audio file to Whisper for transcription |

### Python FastAPI Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | RAG-enhanced chat: embed query → semantic search → LLM generate |
| `POST` | `/transcribe` | Accept audio file → Whisper STT → return text |

---

## 🗄️ Database Schema

```prisma
model ChatSession {
  id        String    @id @default(cuid())
  title     String    @default("New Chat")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}

model Message {
  id            String      @id @default(cuid())
  content       String
  role          String      // "user" or "assistant"
  createdAt     DateTime    @default(now())
  chatSessionId String
  chatSession   ChatSession @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)
}
```

Sessions cascade-delete their messages when removed.

---

## 📝 Version History

| Version | Highlights |
|---|---|
| **v5.0** | **Advanced Integrations & Performance**<br/>• **Text-to-Speech (TTS):** Real-time asynchronous voice response generation and playback using `edge_tts` and `playsound`.<br/>• **ONNX Inference Acceleration:** Loaded the `all-MiniLM-L6-v2` embedding model via a quantized int8 ONNX backend, reducing CPU inference latency by ~1.3x.<br/>• **Lazy-Loaded Whisper STT:** Deferred Whisper loading to first-use, reducing startup memory consumption by ~150 MB.<br/>• **Document Ingestion Parser:** Added support for parsing and extracting context from uploaded PDFs, DOCX, TXT, and CSV files.<br/>• **Model Upgrades:** Model format version set to 5 for enhanced backward compatibility. |
| **v4.0** | **Functional Header Features**<br/>• **Command Palette:** `Ctrl+K` global search for jumping between sessions and quick actions.<br/>• **Notifications:** Event-driven notification panel for system events (session creation, AI response, voice transcription completion) with unread badge.<br/>• **Settings Modal:** Complete configuration for AI models (Llama 3, Mistral, Code Llama, Gemma, Phi-3), temperature, max tokens, and editable system prompts connected directly to the Python backend.<br/>• **Profile Integration:** Editable user profile with avatar initialization, session statistics, and sign out functionality. |
| **v3.0** | **The Aether Upgrade**<br/>• **Rebrand & Persona:** Shifted from a constrained sales FAQ bot to a general-purpose AI assistant named Aether AI.<br/>• **UI/UX Fixes:** Eliminated nested scroll contexts to fix a critical bug causing the entire page to slide up during chat auto-scrolling.<br/>• **Color Overhaul:** Replaced monochrome orange with a rich multi-tone palette (Electric Violet, Cyan, Rose, Amber, Orange) featuring per-card Bento Grid colors and a warm-cool duality in the Sidebar.<br/>• **Smart Suggestions:** Replaced support-centric prompts with context-aware general AI prompts (coding, writing, math). |
| **v2.0** | Added Whisper integration for real-time voice input and RAG semantic search capabilities using Sentence Transformers. |
| **v1.0** | Initial full-stack chatbot release with Next.js 16 + FastAPI + Ollama Llama 3. Multi-session persistence via Prisma/SQLite. |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <strong>Built with 🧠 for the future of local AI</strong><br/>
  <em>Your conversations. Your hardware. Your data.</em>
</p>
