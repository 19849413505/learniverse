# Learniverse (Math Academy + Duolingo Clone)

Learniverse is an ambitious, next-generation learning platform. It combines the rigorous **Micro-Lesson Skill Trees** and spaced repetition algorithms of *Math Academy* with the highly engaging, dopamine-driven **Gamification** loops of *Duolingo*.

At its core, Learniverse uses large language models (LLMs) via an intelligent Multi-Agent architecture to dynamically parse your raw learning materials (syllabuses, book chapters, PDFs) into beautifully crafted, interactive courses.

## 🚀 Key Features

### 1. Knowledge Forge (AI Course Builder)
- **Multi-Document Upload:** Feed the AI multiple documents. It will act as an Extractor, Architect, and Critic to identify atomic concepts and generate a perfectly structured curriculum.
- **Strict Prerequisite DAGs:** Utilizing `dagre` and topological sorting, the AI enforces Directed Acyclic Graphs so you *cannot* learn advanced topics without mastering foundational ones first.
- **Deep Research Mode:** Expand seed materials into comprehensive curriculums via simulated web search and context hallucination.
- **Real-Time SSE Generation:** Watch your course build in real-time via Server-Sent Events (SSE).

### 2. Micro-Lessons & React Flow Skill Trees
- **Interactive Pathways:** Powered by `React Flow`, your learning path is visualized as a beautiful, vertical dependency tree.
- **3-Step Micro-Lessons:** Each node consists of:
  1. Minimum Viable Explanation
  2. Worked Example
  3. Active Practice
- **Markdown & KaTeX Support:** Lessons and tutor chats perfectly render mathematical formulas via `remark-math` and `rehype-katex`.

### 3. FSRS & Node-Level Spaced Repetition (FIRe)
- Spaced repetition isn't just for flashcards. Learniverse implements the Free Spaced Repetition Scheduler (FSRS) directly at the *Course Node* level.
- The system automatically schedules reviews and tracks your memory stability and retention over time.
- **Analytics Dashboard:** Visualize your Ebbinghaus Forgetting Curve and XP history through beautiful `recharts` area graphs.

### 4. Socrates-7 Socratic Tutor & Affection System
- **Socratic Guidance:** Stuck on a practice problem? Open the drawer. The AI Tutor (e.g., Socrates, Feynman) will *never* give you the answer directly, but rather guide you to it via leading questions.
- **Emotional Bonds (Affinity):** As you study, tutors track your performance and write "Diary Entries" about you, modifying an underlying affinity score.

### 5. Perfect Desktop Encapsulation (Electron-Ready)
- The backend gracefully handles `SIGTERM` and can fallback to local SQLite bindings if running in a packaged desktop environment.
- The frontend Next.js App Router is configured for pure static `output: "export"`.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Framer Motion, React Flow, Recharts, Zustand, SWR.
- **Backend:** NestJS, Prisma ORM, PostgreSQL (configurable to SQLite).
- **AI / LLMs:** OpenAI-compatible API endpoints (e.g., DeepSeek) via custom Multi-Agent pipelines.

## 🏃 Running Locally

1. Install dependencies:
   ```bash
   npm install --prefix packages/frontend
   npm install --prefix packages/backend
   ```

2. Setup Environment Variables:
   Create `.env` files in both `packages/frontend` and `packages/backend`.
   - Backend needs `DATABASE_URL` (PostgreSQL connection string).
   - Frontend needs `NEXT_PUBLIC_API_BASE=http://localhost:3001/api`.

3. Run the Backend:
   ```bash
   cd packages/backend
   npx prisma db push
   npx prisma generate
   npm run dev
   ```

4. Run the Frontend:
   ```bash
   cd packages/frontend
   npm run dev
   ```

## 📜 License
MIT
