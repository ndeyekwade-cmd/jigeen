# Jigeen — Plateforme de Détection Précoce du Cancer du Sein

> **Jigeen** signifie *femme* en Wolof. Cette plateforme GenAI est conçue pour aider les femmes sénégalaises à évaluer leur risque de cancer du sein grâce à un chatbot intelligent, un modèle de machine learning et un système RAG (Retrieval-Augmented Generation) pour répondre à leurs questions médicales.

---

## Démo en ligne

| Composant | URL |
|---|---|
| Application frontend | https://khadijawade-jigeen-app.static.hf.space |
| API ML (prédiction) | https://khadijawade-jigeen-api.hf.space |
| API RAG (questions) | https://khadijawade-jigeen-rag.hf.space |

---

## Fonctionnalités

### Pour les patientes
- **Chatbot de dépistage** : questionnaire interactif en français (17 questions sur les facteurs de risque)
- **Score de risque** : résultat instantané (0–100%) basé sur un modèle de régression logistique
- **Questions libres** : après le questionnaire, la patiente peut poser des questions sur le cancer du sein — l'IA répond grâce au RAG (documents médicaux indexés)
- **Audio multilingue** : accueil en Wolof, Français, Anglais et Sérère
- **Géolocalisation** : attribution automatique au médecin le plus proche selon la ville

### Pour les médecins
- **Espace médecin** : consultation des dossiers patients assignés
- **Historique des analyses** : scores, dates, coordonnées
- **Inscription** : création de compte avec spécialité et localité

### Pour l'administration
- **Tableau de bord admin** (code : `4FANTASTIQUES`) : gestion des patients, médecins, assignations
- **Configuration RAG** : paramétrage de l'URL du service RAG

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│          React + Vite + Tailwind CSS                │
│         HF Static Space (CDN gratuit)               │
│                                                     │
│  Accueil → Chatbot → Score → Questions RAG          │
└──────────────┬──────────────────┬───────────────────┘
               │ /predict         │ /chat
               ▼                  ▼
┌──────────────────┐   ┌──────────────────────────────┐
│   BACKEND ML     │   │        BACKEND RAG            │
│   FastAPI        │   │        FastAPI                │
│   HF Docker Space│   │        HF Docker Space        │
│                  │   │                               │
│ LogisticRegression   │  ChromaDB + MiniLM embeddings │
│ 17 features      │   │  4 PDFs → 58 segments         │
│ score 0–100%     │   │  Groq API → LLaMA 3.1 8B     │
└──────────────────┘   └──────────────────────────────┘
```

---

## Stack technique

### Frontend
| Technologie | Usage |
|---|---|
| React 18 + Vite | Framework UI |
| Tailwind CSS | Styles |
| localStorage | Persistance des données (patients, médecins) |
| Hash routing | Compatible HF Static Space (`#/admin`, `#/medecin`) |

### Backend ML
| Technologie | Usage |
|---|---|
| FastAPI | API REST |
| scikit-learn | Modèle LogisticRegression (`best_breast_cancer_model.pkl`) |
| 17 features | Age, IMC, antécédents familiaux, allaitement, etc. |
| Normalisation | Score DF normalisé entre 10.2188 et 33.2836 |

### Backend RAG
| Technologie | Usage |
|---|---|
| FastAPI | API REST |
| ChromaDB | Base vectorielle en mémoire |
| `paraphrase-multilingual-MiniLM-L12-v2` | Embeddings multilingues |
| pdfplumber | Extraction texte des PDFs médicaux |
| Groq API | Inférence LLM (gratuite et rapide) |
| LLaMA 3.1 8B Instant | Modèle de langage |

---

## Structure du projet

```
jigeen/
├── src/
│   ├── components/
│   │   └── ChatWidget.jsx       # Chatbot principal + mode RAG
│   ├── pages/
│   │   ├── Accueil.jsx          # Page d'accueil avec audio multilingue
│   │   ├── Admin.jsx            # Tableau de bord administrateur
│   │   ├── EspaceMedecin.jsx    # Interface médecin
│   │   └── RegisterMedecin.jsx  # Inscription médecin
│   ├── utils/
│   │   └── matchDoctor.js       # Géolocalisation → médecin le plus proche
│   └── App.jsx                  # Routing hash-based
│
├── backend/
│   ├── main.py                  # API FastAPI ML
│   ├── best_breast_cancer_model.pkl  # Modèle entraîné
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend-rag/
│   ├── main.py                  # API FastAPI RAG
│   ├── data/                    # PDFs médicaux indexés
│   │   ├── pdf1.pdf
│   │   ├── pdf2.pdf
│   │   ├── pdf3.pdf
│   │   └── pdf4.pdf
│   ├── requirements.txt
│   └── Dockerfile
│
├── public/
│   ├── logo.avif
│   ├── bg.jpg
│   ├── palpation.mp4            # Vidéo d'auto-palpation
│   ├── daalal.m4a               # Audio Wolof
│   ├── bienvenue.m4a            # Audio Français
│   └── welcome.m4a              # Audio Anglais
│
├── .env.production              # VITE_API_URL pour HF Space
└── vite.config.js
```

---

## Installation locale

### Prérequis
- Node.js 18+
- Python 3.10+
- Une clé API Groq (gratuite sur https://console.groq.com)

### Frontend
```bash
npm install
npm run dev
# → http://localhost:5173
```

### Backend ML
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000
```

### Backend RAG
```bash
cd backend-rag
pip install -r requirements.txt
export GROQ_API_KEY=votre_cle_groq
uvicorn main:app --reload --port 8001
# → http://localhost:8001
```

### Variables d'environnement
Créer un fichier `.env` à la racine :
```env
VITE_API_URL=http://localhost:8000
```

---

## Déploiement sur Hugging Face Spaces

### Frontend (Static Space)
```bash
npm run build
# Copier le contenu de dist/ vers le Space HF
hf upload khadijaWade/jigeen-app dist/ . --repo-type space
```

### Backend ML & RAG (Docker Space)
Chaque dossier `backend/` et `backend-rag/` contient un `Dockerfile`.  
Ajouter le secret `GROQ_API_KEY` dans les paramètres du Space RAG.

---

## Modèle de Machine Learning

- **Algorithme** : Régression Logistique (LogisticRegression scikit-learn)
- **Features (17)** : âge, IMC, antécédents familiaux, allaitement, ménopause, densité mammaire, etc.
- **Score** : fonction de décision normalisée → valeur entre 0% et 100%
- **Fichier** : `backend/best_breast_cancer_model.pkl`

---

## RAG — Sunu Santé

L'assistant **Sunu Santé** (qui signifie *Notre Santé* en Wolof) répond aux questions des patientes après le questionnaire.

- Les PDFs médicaux sont découpés en chunks de 500 caractères
- ChromaDB retrouve les 3 passages les plus pertinents
- LLaMA 3.1 génère une réponse en français, rassurante et adaptée au contexte sénégalais
- En cas d'urgence, l'assistant oriente vers le **SAMU au 1515**

---

## Équipe

Projet développé dans le cadre du programme **AIMS Sénégal — GenAI for Women's Health**

---

## Licence

MIT
