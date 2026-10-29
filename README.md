# 🚀 JobPilot AI 

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Enabled-blue?style=for-the-badge)](https://langchain.com/)
[![Groq](https://img.shields.io/badge/Groq-LLM_Inference-f55036?style=for-the-badge)](https://groq.com/)

**JobPilot AI** is an agentic, full-stack job discovery and application platform. It replaces traditional keyword search with an intelligent LLM router that parses conversational intent, queries global job aggregators (Adzuna) and private ATS platforms (Greenhouse), and rigorously scores job relevance against a user's specific profile.

---

https://github.com/user-attachments/assets/c055897b-650a-4f77-a10b-17624b42e17a

---

## ✨ System Architecture & Core Features

Unlike standard job boards, JobPilot AI utilizes a multi-step verification pipeline to prevent AI hallucinations and guarantee relevance.

* **🧠 Smart Intent Parsing:** Utilizes LangChain and Pydantic with Groq's high-speed inference to extract complex user intent (e.g., role, location, remote preference, and specific target companies).
* **🔀 Agentic ATS Routing:** 
  * *General Discovery:* Routes open-ended searches to the **Adzuna API**.
  * *Targeted Discovery:* Dynamically intercepts company names (e.g., "Airbnb", "Stripe") and routes the request directly to the company's private **Greenhouse API** board.
* **🛡️ Iron-Clad Pre-Filtering:** Employs strict Python-level algorithms to enforce location, freshness, and seniority rules (e.g., blocking senior roles from internship searches) *before* LLM processing, drastically reducing token waste.
* **📊 Deep Relevance Scoring:** Batches pre-filtered jobs to the Groq LLM to read descriptions, identify red flags, and output a structured `0-100` relevance score and reasoning.
* **🧩 Companion Chrome Extension:** A custom extension that activates on live job application pages to extract hidden ATS criteria and match it against the user's saved resume.

---

## 🛠️ Tech Stack

### **Frontend (Client)**
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS & shadcn/ui
* **Deployment:** Vercel

### **Backend (API Layer)**
* **Framework:** FastAPI (Python)
* **Async HTTP:** `httpx` and `asyncio` for concurrent API calls
* **Deployment:** Render

### **AI & Data Layer**
* **LLM Engine:** Groq API (`openai/gpt-oss-120b` equivalent)
* **Orchestration:** LangChain (Structured Output parsing)
* **Database:** MongoDB Atlas

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
* Node.js (v18+)
* Python (3.10+)
* A Groq API Key
* An Adzuna API ID and Key

### 2. Environment Variables
Create a `.env` file in the root of your **backend** directory:

```env
GROQ_API_KEY=your_groq_api_key
ADZUNA_API_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_app_key
TAVILY_API_KEY=your_tavily_app_key
MONGO_URI=your_mongodb_connection_string
