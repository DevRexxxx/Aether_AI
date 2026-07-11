import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
import joblib
import time

# 1. Load data
df = pd.read_csv('customer_support_faq.csv')
print(f"Loaded {len(df)} FAQ entries.")

# 2. Load the embedding model (MiniLM is very fast and lightweight)
print("Loading embedding model...")
start = time.time()
embedder = SentenceTransformer('all-MiniLM-L6-v2')
print(f"Model loaded in {time.time() - start:.2f}s")

# 3. Create embeddings for all questions
print("Creating embeddings for FAQs...")
start = time.time()
# encode returns numpy array by default — store as float16 to halve size
faq_embeddings = embedder.encode(df['question'].tolist(), convert_to_numpy=True)
faq_embeddings = faq_embeddings.astype(np.float16)
print(f"Embeddings created in {time.time() - start:.2f}s")
print(f"Embeddings shape: {faq_embeddings.shape}, dtype: {faq_embeddings.dtype}")

# 4. Save the dataset and embeddings as NumPy (no PyTorch dependency needed to load)
model_data = {
    'df': df,
    'embeddings': faq_embeddings,  # NumPy float16 array
    'format_version': 2,           # Versioning for backward compat
}
joblib.dump(model_data, 'chatbot_rag_data.joblib')

import os
file_size = os.path.getsize('chatbot_rag_data.joblib') / 1024
print(f"RAG Data saved successfully to chatbot_rag_data.joblib ({file_size:.1f} KB)")
