from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.utils import embedding_functions
import pdfplumber
import os
from groq import Groq

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base vectorielle
chroma_client = chromadb.Client()
embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)
collection = chroma_client.create_collection(
    name="jigeen_docs",
    embedding_function=embedding_fn,
    get_or_create=True,
)

PDF_DIR = os.path.join(os.path.dirname(__file__), "data")

def charger_pdfs():
    if not os.path.exists(PDF_DIR):
        print("Dossier data introuvable")
        return
    idx = 0
    for fichier in os.listdir(PDF_DIR):
        if fichier.lower().endswith(".pdf"):
            try:
                with pdfplumber.open(os.path.join(PDF_DIR, fichier)) as pdf:
                    for page in pdf.pages:
                        texte = page.extract_text()
                        if texte:
                            for i in range(0, len(texte), 500):
                                chunk = texte[i:i+500].strip()
                                if chunk:
                                    collection.add(
                                        documents=[chunk],
                                        metadatas=[{"source": fichier}],
                                        ids=[f"doc_{idx}"],
                                    )
                                    idx += 1
            except Exception as e:
                print(f"Erreur {fichier}: {e}")
    print(f"{idx} segments chargés depuis {PDF_DIR}")

charger_pdfs()

# Client Groq
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))


class Question(BaseModel):
    text: str


@app.post("/chat")
def chat(q: Question):
    # Recherche dans les PDFs
    results = collection.query(query_texts=[q.text], n_results=3)
    docs = results["documents"][0] if results["documents"] else []
    contexte = "\n".join(docs) if docs else "Aucun document pertinent trouvé."

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Tu es Sunu Santé, assistant médical bienveillant au Sénégal, "
                        "spécialisé dans le cancer du sein. "
                        "Réponds en français, de manière claire et rassurante. "
                        "Si tu ne sais pas, oriente vers un médecin ou le SAMU au 1515.\n\n"
                        f"Contexte extrait des documents médicaux :\n{contexte}"
                    ),
                },
                {"role": "user", "content": q.text},
            ],
            max_tokens=500,
            temperature=0.3,
        )
        reponse = response.choices[0].message.content
        print(f"Réponse Groq OK: {reponse[:80]}")
        return {"answer": reponse}
    except Exception as e:
        print(f"Erreur Groq: {e}")
        return {"answer": "Je suis temporairement indisponible. Pour toute urgence, appelez le SAMU au 1515."}


@app.get("/")
def health():
    return {"status": "Jigeen RAG actif", "documents": collection.count()}
