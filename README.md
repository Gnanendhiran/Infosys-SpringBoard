# 🧠 CareerAlign AI — SkillMatch Resume Matcher & Skill Recommender

<p align="center">
  <b>Smart Hiring & Career Growth — powered by NLP and Machine Learning</b><br/>
  <i>Infosys Springboard Virtual Internship 6.0 · Batch 4 & 5</i>
</p>

---

## 📌 Overview

**CareerAlign AI** is an end-to-end, AI-driven career intelligence platform that analyzes resumes, extracts and evaluates skills, predicts suitable job roles, and highlights improvement opportunities.

- For **candidates** — it scores resumes, identifies skill gaps, and recommends courses and portfolio projects to close them.
- For **recruiters/HR** — it enables bulk resume analysis, ATS-based scoring, and side-by-side candidate comparison to speed up shortlisting.

The core of the system is built around **Natural Language Processing (NLP)** and **semantic similarity matching**, moving beyond simple keyword search to understand the actual meaning behind a candidate's skills.

> 📎 This repository currently contains the project documentation and select supporting files. The full application source will be added incrementally — see [Repository Status](#-repository-status) below.

---

## 👥 Team

| Name | Role |
|---|---|
| Kuruba Hemanth Kishore | Team Member |
| Krishna Shree Gunna | Team Member |
| Devarasetty Sri Ranga Likhitha Naidu | Team Member |
| Lokeshwari Cheeraboyina | Team Member |
| Gnanendhiran V | Team Member |

**Mentor:** Sangeetha Mahalingam
**Program:** Infosys Springboard Virtual Internship 6.0 (8 Weeks)

---

## ✨ Key Features

### Candidate Dashboard
- Resume upload & PDF parsing (extracts raw text from uploaded PDFs)
- Job role selection or custom job description input
- Match score, ATS score, and skills breakdown (matched / missing / extra)
- Personalized learning recommendations (Udemy, Coursera, Pluralsight, LinkedIn Learning, edX, Codecademy, freeCodeCamp, YouTube)
- Project suggestions to close skill gaps
- Export analysis report to PDF

### HR / Recruiter Dashboard
- Bulk resume upload for multiple candidates
- Job description input for match evaluation
- Average match score & ATS-based candidate ranking
- Side-by-side candidate comparison and analytics
- Shortlisting / candidate selection tools
- Export results to CSV

---

## 🧬 Machine Learning & NLP Approach

The matching engine is the heart of the project and is built around **semantic similarity using transformer embeddings**, rather than exact keyword matching:

1. **Text Extraction & Preprocessing**
   - Raw resume text is extracted from uploaded PDFs.
   - Text is cleaned and normalized (whitespace, casing, punctuation) before feature extraction.
   - Structured attributes — skills, years of experience, and education level (High School / Bachelor's / Master's / PhD) — are parsed out of unstructured text.

2. **Skill Extraction**
   - Both technical skills (languages, frameworks, tools) and soft skills are identified from resume and job description text.

3. **Semantic Similarity Matching**
   - Skills are converted into vector embeddings using the **`Xenova/all-MiniLM-L6-v2`** transformer model.
   - **Cosine similarity** is computed between skill embeddings to detect conceptually related skills (e.g., "ML" ↔ "Machine Learning", "JS" ↔ "JavaScript").
   - A hybrid matching strategy combines:
     - **Exact matches** (`skill == skill`)
     - **Semantic matches** (cosine similarity above a **0.65 threshold**)
   - This threshold was tuned to balance precision and recall — too low produced false positives, too high missed valid synonyms.

4. **Scoring & Prediction**
   - An **ATS score** is calculated per resume based on skills, keywords, experience, education, and formatting.
   - A **job role prediction module** infers likely roles (Frontend Developer, Backend Developer, Full Stack Developer, DevOps Engineer, Data Scientist, etc.) from detected skill combinations.
   - A **skill gap analysis** module compares candidate skills against job description requirements and flags missing/priority skills.

5. **Recommendation Layer**
   - Missing skills are mapped to curated learning resources and suggested portfolio projects, ranked by priority and estimated impact.

### Modeling Pipeline (End-to-End)

```
Resume (PDF)
    │
    ▼
PDF Text Extraction  ──►  Text Cleaning & Preprocessing
    │
    ▼
Skill / Experience / Education Extraction (NLP)
    │
    ▼
Skill → Vector Embeddings (Xenova/all-MiniLM-L6-v2)
    │
    ▼
Cosine Similarity Matching (exact + semantic, threshold > 0.65)
    │
    ▼
ATS Scoring  +  Job Role Prediction  +  Skill Gap Analysis
    │
    ▼
Recommendations (courses, projects)  +  Dashboards (Candidate / HR)
```

---

## 🛠️ Tech Stack

**Frontend**
- TypeScript
- React
- Tailwind CSS
- Recharts (data visualization)

**Backend / Infrastructure**
- TypeScript (Node)
- Firebase (Authentication, Firestore database)
- Supabase (file storage for resumes)

**AI / NLP**
- Transformer-based sentence embeddings (`Xenova/all-MiniLM-L6-v2`)
- Cosine similarity for semantic skill matching

**Deployment**
- Vercel (hosting)
- GitHub (version control)

---

## ⚠️ Challenges Faced

- **Unstructured resume content** — tables, bullet points, and images made clean text extraction difficult.
- **Non-technical skill identification** — soft skills like leadership or communication are harder to detect than listed technical skills.
- **Multiple job-role confusion** — candidates with cross-domain experience made single-role prediction harder.
- **Similarity threshold tuning** — balancing false positives vs. missed matches.
- **Synonym/abbreviation handling** — e.g., "ML" vs. "Machine Learning", "JS" vs. "JavaScript".
- **Scalability** — processing time and memory grew with resume volume, requiring backend optimization.
- **UX consistency** — designing dashboards simple enough for both candidates and HR users without data overload.

---

## 📂 Repository Status

This repo is being built up incrementally. Currently included:
- Project documentation (this README, internship completion report reference)
- Selected config files (`tsconfig`, `vite.config`, `tailwind.config`, `vercel.json`, `postcss.config`, `components.json`)
- Storage setup notes (`STORAGE_SETUP.md`) and deployment notes (`DEPLOYMENT.md`)
- Utility scripts (e.g., path sanitization tests)

**Coming soon:**
- Full `src/` application code (components, pages, hooks, services, utils)
- Resume parsing & NLP matching modules
- Candidate and HR dashboard implementations
- Supabase/Firebase integration code

> ⚠️ **Note:** Before pushing further files, double-check that no live API keys, secrets, or service-role credentials are committed. Environment-specific secrets belong in a local `.env` file (excluded via `.gitignore`), not in tracked source or markdown files.

---

## 📊 Project Timeline (8 Weeks)

| Week | Focus |
|---|---|
| 1 | AI/ML fundamentals, objective & scope finalization |
| 2 | Data collection & preprocessing (sample resumes, job descriptions) |
| 3 | Resume parsing module (NLP-based skill extraction) |
| 4 | Job description analysis module |
| 5 | Skill recommendation engine |
| 6 | Model evaluation & optimization (match accuracy) |
| 7 | Frontend development & integration |
| 8 | End-to-end testing & deployment |

---

## 🎓 Acknowledgements

We thank **Infosys Springboard** for the opportunity to build this project, and our mentor **Sangeetha Mahalingam** for her guidance throughout the internship.

---

## 📄 License

_Add your preferred license here (e.g., MIT) once decided._
