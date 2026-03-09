# 🌌 Learniverse (Promax)

**Learniverse** 旨在打造下一代自适应、游戏化、社区驱动的终极学习平台。它不仅仅是一个背单词的工具，而是一个集成了**知识图谱引擎、大语言模型自动生成、开源 FSRS 间隔重复算法，以及多邻国式游戏化体验**的教育基础设施。

我们的愿景是成为类似 **Math Academy 的 Promax 版**：不仅覆盖数学，更能让任何一本教材、任何一篇文档通过 AI 的解析，转化为细颗粒度的知识网络，并以最符合人类认知规律的方式（间隔重复 + 苏格拉底式启发教学）让学习者达到真正的“精熟”状态（Mastery）。

---

## 🎯 核心目标与优势 (The Vision & Edge)

### 1. 自动化的知识萃取 (NotebookLM 体验)
用户只需上传书籍（PDF/EPUB）或粘贴长文本，**知识工坊 (Knowledge Forge)** 模块会自动：
- 提取出文档中的核心概念（节点）与依赖关系（边）。
- 生成**可视化的 2D/3D 知识图谱**，让你在学习前就能鸟瞰整片“知识森林”。
- 自动为每个概念生成用于复习的闪卡（Flashcards）。

### 2. 极致高效的记忆引擎 (FSRS 算法)
告别凭直觉复习。我们引入了目前世界上最先进的开源间隔重复算法 **FSRS (Free Spaced Repetition Scheduler)**。
- 采用 `ts-fsrs` 库，根据你每次点击“忘记/困难/正常/简单”的操作，动态构建属于你的**个性化遗忘曲线**。
- 精确计算下一次复习时间（Due Date）和记忆稳定性（Stability），只在你要遗忘的边缘让你复习，最大限度节省时间。

### 3. 多邻国式的沉浸感与游戏化 (Gamification)
学习本身是反人性的，所以我们用游戏机制来对冲它：
- **学习路径 (Skill Tree)**：将知识点像解锁游戏技能树一样串联起来。
- **连胜与经验值 (Streak & XP)**：每次复习都能积累 XP，通过持续打卡保持火热的连胜记录。
- **排行榜与社交联赛 (Leagues)**：引入青铜/白银/黄金联赛机制，与朋友或全球学习者竞技。
- **好友共同任务 (Co-op Quests)**：组队完成目标，打破孤岛式学习。

### 4. 走向 Promax：阿基米德对话式教学 (Socratic AI)
在传统的“看问题 -> 对答案”的被动闪卡模式之上，我们将融入**苏格拉底式的 AI 启发教学**。当你遇到困难卡片时，AI 不会直接把答案塞给你，而是像一位耐心的导师，通过循循善诱的追问，引导你自己推导出答案，从而实现真正的深度理解。

---

## 🚀 项目现状 (MVP)

目前，本项目已经完成了**前端 MVP 版本**的构建（采用 Next.js 14 App Router + Tailwind CSS + Framer Motion）：
- 完整的 Dashboard 仪表盘（包含多邻国式学习路径、基于 Recharts 的遗忘曲线可视化）。
- 集成了 `react-force-graph-2d` 的文档导入与图谱生成模拟。
- 集成了 `ts-fsrs` 的核心复习循环（卡片翻转、评分、自动计算下一次复习时间）。
- 数据目前由 `Zustand` 状态管理并持久化至浏览器的 `localStorage` 中。

---

## 🛠️ 技术栈 (Tech Stack)

| 模块 | 技术选型 |
|------|----------|
| **核心框架** | Next.js 14, React 18, TypeScript |
| **样式与动画**| Tailwind CSS, Framer Motion, lucide-react |
| **状态管理** | Zustand (with Persist Middleware) |
| **算法引擎** | ts-fsrs (Free Spaced Repetition Scheduler) |
| **数据可视化**| Recharts (学习进度曲线), react-force-graph-2d (知识图谱) |

---

## 💻 本地开发与启动

本项目采用 Monorepo 结构进行管理。

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/learniverse.git
cd learniverse

# 2. 安装所有依赖包
npm install

# 3. 启动前端开发服务器
cd packages/frontend
npm run dev
```

现在，打开浏览器访问 `http://localhost:3000` 即可体验！

---

## 🖥️ 构建独立的 Windows 桌面端应用

你可以通过基于 **Electron** 封装，将此 Web 应用一键打包为无需浏览器的、原生的 `.exe` 桌面程序供用户下载。

1. **安装全局打包依赖 (可选):**
   确保你的环境中安装了 `electron-builder`。

2. **在 `packages/desktop` 目录下执行构建脚本** (或者直接在你的本地机器上按照仓库内脚本执行)。
   由于平台安全限制，我们将使用 Electron 在本地环境中生成 `dist/Learniverse Setup.exe`。
