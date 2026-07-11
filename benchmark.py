"""
Benchmark Script — Measures startup time, inference latency,
and memory usage for the optimized chatbot engine.
"""
import time
import numpy as np
import os
import sys
import joblib

def measure_memory():
    """Get current process RSS in MB."""
    try:
        import psutil
        return psutil.Process().memory_info().rss / 1024 / 1024
    except ImportError:
        return None

def benchmark_rag_loading():
    """Benchmark RAG data loading."""
    print("\n── RAG Data Loading ──")
    
    start = time.time()
    data = joblib.load('chatbot_rag_data.joblib')
    load_time = time.time() - start
    
    raw = data['embeddings']
    if isinstance(raw, np.ndarray):
        fmt = f"NumPy {raw.dtype}"
        mem_kb = raw.nbytes / 1024
    else:
        fmt = f"PyTorch {raw.dtype}"
        mem_kb = (raw.nelement() * raw.element_size()) / 1024
    
    print(f"  Load time:      {load_time * 1000:.1f}ms")
    print(f"  Format:         {fmt}")
    print(f"  Memory:         {mem_kb:.1f} KB")
    return data

def benchmark_embedder(backend_name, **kwargs):
    """Benchmark SentenceTransformer with a specific backend."""
    from sentence_transformers import SentenceTransformer
    
    print(f"\n── SentenceTransformer ({backend_name}) ──")
    mem_before = measure_memory()
    
    start = time.time()
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2', **kwargs)
    except Exception as e:
        print(f"  ✗ Failed to load: {e}")
        return None, None
    load_time = time.time() - start
    
    mem_after = measure_memory()
    mem_delta = (mem_after - mem_before) if (mem_before and mem_after) else None
    
    print(f"  Load time:      {load_time:.2f}s")
    if mem_delta:
        print(f"  Memory added:   {mem_delta:.1f} MB")
    
    # Warm-up run
    _ = model.encode("warmup", convert_to_numpy=True)
    
    # Single query latency
    test_queries = [
        "How do I track my order?",
        "What is your return policy?",
        "I forgot my password",
        "How do I contact support?",
        "Cancel my subscription",
    ]
    
    latencies = []
    for q in test_queries:
        start = time.time()
        _ = model.encode(q, convert_to_numpy=True)
        latencies.append((time.time() - start) * 1000)
    
    avg_latency = np.mean(latencies)
    p50 = np.percentile(latencies, 50)
    p95 = np.percentile(latencies, 95)
    
    print(f"  Avg latency:    {avg_latency:.1f}ms")
    print(f"  P50 latency:    {p50:.1f}ms")
    print(f"  P95 latency:    {p95:.1f}ms")
    
    # Batch encoding
    start = time.time()
    _ = model.encode(test_queries, convert_to_numpy=True)
    batch_time = (time.time() - start) * 1000
    print(f"  Batch (5 queries):{batch_time:.1f}ms ({batch_time/5:.1f}ms/query)")
    
    return model, avg_latency

def benchmark_cosine_similarity(model, rag_data):
    """Benchmark the full retrieval pipeline."""
    print(f"\n── Full Retrieval Pipeline ──")
    
    raw = rag_data['embeddings']
    if isinstance(raw, np.ndarray):
        embeddings = raw.astype(np.float32)
    else:
        embeddings = raw.cpu().numpy().astype(np.float32)
    
    query = "How do I get a refund?"
    query_vec = model.encode(query, convert_to_numpy=True).astype(np.float32)
    
    # Benchmark NumPy cosine similarity
    latencies = []
    for _ in range(100):
        start = time.time()
        q_norm = query_vec / (np.linalg.norm(query_vec) + 1e-8)
        c_norms = embeddings / (np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-8)
        sims = c_norms @ q_norm.T
        top_idx = np.argsort(sims.flatten())[::-1][:3]
        latencies.append((time.time() - start) * 1000)
    
    avg = np.mean(latencies)
    print(f"  NumPy cosine sim (100 runs):")
    print(f"    Avg:          {avg:.3f}ms")
    print(f"    Top match:    {rag_data['df'].iloc[top_idx[0]]['question']}")
    print(f"    Score:        {sims.flatten()[top_idx[0]]:.4f}")


def main():
    print("=" * 60)
    print("  CHATBOT ENGINE BENCHMARK")
    print("=" * 60)
    
    mem_start = measure_memory()
    if mem_start:
        print(f"\nBaseline memory: {mem_start:.1f} MB")
    
    # 1. RAG loading
    rag_data = benchmark_rag_loading()
    
    # 2. ONNX backend
    model_onnx, onnx_latency = benchmark_embedder("ONNX", backend="onnx")
    
    # 3. PyTorch backend
    model_pt, pt_latency = benchmark_embedder("PyTorch")
    
    # 4. Full retrieval pipeline (use ONNX if available)
    if model_onnx:
        benchmark_cosine_similarity(model_onnx, rag_data)
    elif model_pt:
        benchmark_cosine_similarity(model_pt, rag_data)
    
    # 5. Summary
    print(f"\n{'=' * 60}")
    print(f"  SUMMARY")
    print(f"{'=' * 60}")
    
    if onnx_latency and pt_latency:
        speedup = pt_latency / onnx_latency
        print(f"  ONNX speedup:   {speedup:.1f}x faster inference vs PyTorch")
    
    mem_end = measure_memory()
    if mem_start and mem_end:
        print(f"  Total memory:   {mem_end:.1f} MB (added {mem_end - mem_start:.1f} MB)")
    
    print(f"\n  Recommendation: Use ONNX backend for low-end devices.")
    print(f"  {'=' * 60}")


if __name__ == "__main__":
    main()
