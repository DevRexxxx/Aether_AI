import pandas as pd
from sentence_transformers import SentenceTransformer
import joblib

# 1. Load data
df = pd.read_csv('customer_support_faq.csv')

# 2. Load the embedding model (MiniLM is very fast and lightweight)
print("Loading embedding model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# 3. Create embeddings for all questions
print("Creating embeddings for FAQs...")
faq_embeddings = embedder.encode(df['question'].tolist(), convert_to_tensor=True)

# 4. Save the dataset and embeddings
model_data = {
    'df': df,
    'embeddings': faq_embeddings
}
joblib.dump(model_data, 'chatbot_rag_data.joblib')
print("RAG Data saved successfully to chatbot_rag_data.joblib!")
