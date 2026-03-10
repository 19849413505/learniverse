[🇺🇸 English](README.md) | [🇨🇳 中文](README_zh.md) | [🇷🇺 Русский](README_ru.md) | [🇯🇵 日本語](README_ja.md)

# 🌌 Learniverse (Promax)

**Learniverse** 旨在打造**下一代自适应、游戏化的终极开源学习平台**。它不仅是一个背单词工具，更是一个集成了**知识图谱引擎、大语言模型自动化解析、开源 FSRS 间隔重复算法与多邻国沉浸式游戏化体验**的教育基础设施。

我们的愿景是成为 **Math Academy 的开源 Promax 版**：赋予每个人将任何书籍、文档转化为细颗粒度知识网络的能力，通过 AI 苏格拉底式启发与科学间隔重复，帮助学习者达到真正的“精熟”境界（Mastery）。

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

## ✨ 已实现功能 (Current Features)

基于前沿架构构建，目前我们已完成核心前端 MVP 及部分后端整合，实现了以下功能：

- **自适应知识抽取**：支持文档解析与导入，通过 AI 自动生成可视化 2D/3D 知识图谱。
- **开源算法引擎**：全平台接入开源 `ts-fsrs` (Free Spaced Repetition Scheduler)，精准计算复习时间。
- **游戏化 Dashboard**：多邻国式的学习路径（Skill Tree）、基于 Recharts 的学习进度追踪、遗忘曲线可视化，以及连胜记录（Streak & XP）和成就系统。
- **跨平台支持**：支持 Web 端静态导出，同时基于 Electron 提供独立的 Windows/Mac 桌面原生应用支持。
- **状态与缓存管理**：Zustand 数据持久化与优化的 React Flow 知识树渲染。

---

## 🔮 未来计划 (Future Roadmap)

我们致力于不断拓展平台边界，让 AI 更“懂”你。未来的核心演进路线包括：

- **深度精熟机制**：引入前置诊断测试与知识图谱依赖检查，实现自动化“交错练习”与“针对性补习”。
- **多角色情感伴读 (苏格拉底·七系统)**：引入不同性格的虚拟导师（如三月七、刻晴等），通过带有情感羁绊与课后模拟社交的对话式互动，重塑沉浸感。
- **个性化学习速率**：基于数据反馈自动建模每个学生在各主题的“学习速度”，真正做到自适应千人千面的复习间隔。
- **社交联赛拓展**：加入动态虚拟学习小组与联赛排行机制，并增加 XP 质量惩罚与情感挂钩成就系统。

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
git clone https://github.com/19849413505/learniverse.git
cd learniverse

# 2. 安装所有依赖包
npm install

# 3. 启动前端开发服务器
cd packages/frontend
npm run dev &
```

现在，打开浏览器访问 `http://localhost:3000` 即可体验！

---
## 🖥️ 构建独立的桌面端应用

你可以通过基于 **Electron** 封装，将此 Web 应用一键打包为无需浏览器的、跨平台 (Windows, macOS, Linux) 桌面程序供用户下载。

👉 **[查看详细的 Learniverse 桌面端打包指南](docs/desktop-packaging-zh.md)**

1. **在根目录执行自动化构建打包脚本:** `npm run build:desktop`。
2. 该命令将会自动构建整个前后端代码，并调用 `electron-builder` 打包桌面端应用至 `packages/desktop/dist/` 目录下。
