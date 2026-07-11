"""
Model Analysis Script — Reports sizes, memory, and backend info
for the chatbot's ML components.
"""
import joblib
import os
import sys
import time
import numpy as np

print("=" * 60)
print("  CHATBOT MODEL ANALYSIS")
print("=" * 60)

# ── RAG Data ──────────────────────────────────────────────
print("\n── RAG Data ──")
d = joblib.load('chatbot_rag_data.joblib')
file_size = os.path.getsize('chatbot_rag_data.joblib') / 1024
print(f"  File size:        {file_size:.1f} KB")
print(f"  DataFrame shape:  {d['df'].shape}")

raw = d['embeddings']
if isinstance(raw, np.ndarray):
    print(f"  Embeddings shape: {raw.shape}")
    print(f"  Embeddings dtype: {raw.dtype}")
    print(f"  Embeddings memory:{raw.nbytes / 1024:.1f} KB")
    print(f"  Storage format:   NumPy (optimized)")
elif hasattr(raw, 'numpy'):
    print(f"  Embeddings shape: {raw.shape}")
    print(f"  Embeddings dtype: {raw.dtype}")
    mem = raw.nelement() * raw.element_size()
    print(f"  Embeddings memory:{mem / 1024:.1f} KB")
    print(f"  Storage format:   PyTorch tensor (legacy)")
    print(f"  ⚠ Run build_rag.py to convert to optimized NumPy format")

format_version = d.get('format_version', 1)
print(f"  Format version:   {format_version}")

# ── SentenceTransformer — ONNX vs PyTorch ─────────────────
print("\n── SentenceTransformer (all-MiniLM-L6-v2) ──")
from sentence_transformers import SentenceTransformer

# Try ONNX backend first
print("  Loading with ONNX backend...")
start = time.time()
try:
    model_onnx = SentenceTransformer('all-MiniLM-L6-v2', backend="onnx")
    onnx_load_time = time.time() - start
    print(f"  ONNX load time:   {onnx_load_time:.2f}s")
    print(f"  ONNX backend:     ✓ Available")

    # Quick inference test
    start = time.time()
    _ = model_onnx.encode("test query", convert_to_numpy=True)
    onnx_infer_time = (time.time() - start) * 1000
    print(f"  ONNX inference:   {onnx_infer_time:.1f}ms (single query)")
    del model_onnx
except Exception as e:
    print(f"  ONNX backend:     ✗ Not available ({e})")
    onnx_load_time = None

# PyTorch backend for comparison
print("  Loading with PyTorch backend...")
start = time.time()
model_pt = SentenceTransformer('all-MiniLM-L6-v2')
pt_load_time = time.time() - start
total_params = sum(p.numel() for p in model_pt.parameters())
total_mem = sum(p.numel() * p.element_size() for p in model_pt.parameters())
print(f"  PyTorch load time:{pt_load_time:.2f}s")
print(f"  Parameters:       {total_params:,}")
print(f"  Model memory:     {total_mem / 1024 / 1024:.1f} MB (float32)")
print(f"  Dtype:            {next(model_pt.parameters()).dtype}")

# Quick inference test
start = time.time()
_ = model_pt.encode("test query", convert_to_numpy=True)
pt_infer_time = (time.time() - start) * 1000
print(f"  PyTorch inference:{pt_infer_time:.1f}ms (single query)")

if onnx_load_time:
    print(f"\n  ── Speedup ──")
    print(f"  Load time:        {pt_load_time / onnx_load_time:.1f}x faster with ONNX")
    print(f"  Inference:        {pt_infer_time / onnx_infer_time:.1f}x faster with ONNX")

del model_pt

# ── Whisper ───────────────────────────────────────────────
print("\n── Whisper (base.en) ──")
try:
    from faster_whisper import WhisperModel
    start = time.time()
    wm = WhisperModel("base.en", device="cpu", compute_type="int8")
    whisper_time = time.time() - start
    print(f"  Status:           ✓ Available")
    print(f"  Load time:        {whisper_time:.2f}s")
    print(f"  Compute type:     int8 (quantized)")
    print(f"  Note:             Lazy-loaded in optimized engine (saves ~150 MB at startup)")
    del wm
except ImportError:
    print(f"  Status:           ✗ faster_whisper not installed")
except Exception as e:
    print(f"  Status:           ✗ Error: {e}")

# ── Process Memory ────────────────────────────────────────
print("\n── Process Memory ──")
try:
    import psutil
    proc = psutil.Process()
    mem = proc.memory_info()
    print(f"  RSS:              {mem.rss / 1024 / 1024:.1f} MB")
    print(f"  VMS:              {mem.vms / 1024 / 1024:.1f} MB")
except ImportError:
    print(f"  psutil not installed — install with: pip install psutil")
    # Fallback estimate
    print(f"  (Memory reporting unavailable without psutil)")

print("\n" + "=" * 60)
print("  Analysis complete.")
print("=" * 60)
