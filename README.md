[🇺🇸 English](README.md) | [🇨🇳 中文](README_zh.md) | [🇷🇺 Русский](README_ru.md) | [🇯🇵 日本語](README_ja.md)

# 🌌 Learniverse (Promax)

**Learniverse** aims to build the **ultimate next-generation adaptive, gamified, open-source learning platform**. It's not just a vocabulary memorization tool, but an educational infrastructure integrating a **knowledge graph engine, LLM automated parsing, the open-source FSRS spaced repetition algorithm, and a Duolingo-style immersive gamified experience**.

Our vision is to become the **open-source Promax version of Math Academy**: empowering everyone with the ability to transform any book or document into a fine-grained knowledge network. Through AI Socratic heuristic teaching and scientific spaced repetition, we help learners achieve true "Mastery".

---

## 🎯 The Vision & Edge

### 1. Automated Knowledge Extraction (NotebookLM Experience)
Users simply upload books (PDF/EPUB) or paste long texts, and the **Knowledge Forge** module automatically:
- Extracts core concepts (nodes) and dependencies (edges) from the document.
- Generates **visual 2D/3D knowledge graphs**, allowing you to get a bird's-eye view of the "knowledge forest" before learning.
- Automatically generates Flashcards for review for each concept.

### 2. Ultimate Efficient Memory Engine (FSRS Algorithm)
Say goodbye to intuitive reviewing. We introduce the world's most advanced open-source spaced repetition algorithm, **FSRS (Free Spaced Repetition Scheduler)**.
- Uses the `ts-fsrs` library to dynamically construct your **personalized forgetting curve** based on every "Forgot/Hard/Good/Easy" click.
- Accurately calculates the next Due Date and memory Stability, making you review only on the verge of forgetting, maximizing time savings.

### 3. Duolingo-style Immersion and Gamification
Learning itself is contrary to human nature, so we use game mechanics to hedge against it:
- **Skill Tree**: Links knowledge points together like unlocking game skill trees.
- **Streak & XP**: Accumulate XP with each review and maintain a hot streak through continuous check-ins.
- **Leagues**: Introduces Bronze/Silver/Gold league mechanics to compete with friends or global learners.
- **Co-op Quests**: Team up to complete goals and break isolated learning.

### 4. Towards Promax: Archimedean Socratic AI
On top of the traditional "look at question -> check answer" passive flashcard mode, we will integrate **Socratic AI heuristic teaching**. When you encounter a difficult card, AI won't just spoon-feed you the answer. Instead, like a patient mentor, it guides you to deduce the answer yourself through step-by-step questioning, achieving true deep understanding.

---

## ✨ Current Features

Built on a cutting-edge architecture, we have completed the core frontend MVP and partial backend integration, realizing the following features:

- **Adaptive Knowledge Extraction**: Supports document parsing and importing, automatically generating visual 2D/3D knowledge graphs via AI.
- **Open-source Algorithm Engine**: Fully integrates the open-source `ts-fsrs` (Free Spaced Repetition Scheduler) across platforms for accurate review time calculation.
- **Gamified Dashboard**: Duolingo-style Skill Tree, learning progress tracking based on Recharts, forgetting curve visualization, alongside Streak & XP and achievement systems.
- **Cross-platform Support**: Supports Web static export while providing independent Windows/Mac native desktop applications based on Electron.
- **State and Cache Management**: Zustand data persistence and optimized React Flow knowledge tree rendering.

---

## 🔮 Future Roadmap

We are committed to continuously expanding the platform's boundaries, making AI "understand" you better. Our core future evolutionary routes include:

- **Deep Mastery Mechanics**: Introducing pre-diagnostic tests and knowledge graph dependency checks to achieve automated "interleaved practice" and "targeted remediation".
- **Multi-Persona Emotional Tutors (Socrates-7 System)**: Introducing virtual tutors with different personalities (like March 7th, Keqing, etc.) to rebuild immersion through conversational interactions featuring emotional bonds and post-class simulated socialization.
- **Personalized Learning Velocity**: Automatically modeling each student's "learning velocity" for every topic based on data feedback, achieving truly adaptive, individualized review intervals.
- **Social League Expansion**: Adding dynamic virtual study groups and league ranking mechanisms, along with XP quality penalties and emotion-linked achievement systems.

---

## 🛠️ Tech Stack

| Module | Tech Stack |
|------|----------|
| **Core Framework** | Next.js 14, React 18, TypeScript |
| **Styling & Animation**| Tailwind CSS, Framer Motion, lucide-react |
| **State Management** | Zustand (with Persist Middleware) |
| **Algorithm Engine** | ts-fsrs (Free Spaced Repetition Scheduler) |
| **Data Visualization**| Recharts (Learning curve), react-force-graph-2d (Knowledge graph) |

---

## 💻 Local Development & Startup

This project is managed using a Monorepo structure.

```bash
# 1. Clone the repository
git clone https://github.com/19849413505/learniverse.git
cd learniverse

# 2. Install all dependencies
npm install

# 3. Start frontend development server
cd packages/frontend
npm run dev &
```

Now, open your browser and access `http://localhost:3000` to experience it!

---

## 🖥️ Build Standalone Windows Desktop App

You can use the **Electron** encapsulation to one-click package this Web application into a browserless, native `.exe` desktop program for users to download.

1. **Install global packaging dependencies (Optional):**
   Ensure `electron-builder` is installed in your environment.

2. **Run the build script in the `packages/desktop` directory** (or execute it directly on your local machine according to the scripts in the repository).
   Due to platform security restrictions, we will use Electron in the local environment to generate `dist/Learniverse Setup.exe`.
