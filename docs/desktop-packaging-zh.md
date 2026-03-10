# Learniverse 桌面应用程序打包指南

本指南将指导您使用 Electron 和 electron-builder 将 Learniverse 的 monorepo (多包仓库) 项目打包成桌面应用程序。

## 前置条件

在打包之前，请确保您已经安装了：
- Node.js（推荐 v18.0.0 或更高版本）
- npm (Node Package Manager)

由于 Learniverse 采用 monorepo 结构，桌面端应用依赖于前端 (Next.js) 和后端 (NestJS) 的成功构建。

## 针对 Windows 用户的终极一键打包工具

如果你不想手动输入命令行，我们在项目根目录为您准备了一个 Windows 批处理文件：`build-desktop.bat`。

**只需双击运行 `build-desktop.bat`**：
1. 它将自动帮你下载安装所有依赖（`npm install`，解决提示找不到 `tsc`、`next` 等工具的错误）。
2. 安装完毕后自动构建全栈并打包你的 Windows 桌面应用。
3. 你的最终安装包将会出现在 `packages/desktop/dist/` 文件夹中。

## 命令行自动打包脚本（全平台适用）

为了简化操作，如果您更喜欢使用终端命令行，我们在项目根目录的 `package.json` 中添加了跨平台自动化脚本。

在确保已经安装依赖（运行 `npm install`）之后，在 **项目根目录** 下运行以下命令：

```bash
npm run build:desktop
```

该命令将自动执行以下操作：
1. `npm run build`：编译前端（生成静态输出目录 `out/`）和后端（生成编译目录 `dist/`）。
2. `electron-builder`：利用 `packages/desktop/package.json` 中的配置打包应用程序。

打包后的输出文件将保存在 `packages/desktop/dist/` 目录中。

## 针对特定平台的打包

如果需要针对特定的操作系统进行打包，请先确保在根目录下成功构建了项目（`npm run build`），然后运行相应的命令：

- **Windows**（生成 `.exe` / NSIS 安装程序）：
  ```bash
  npm run build:win --workspace=packages/desktop
  ```
  *（注：如果要在 macOS 或 Linux 机器上打包 Windows 版本，通常需要安装 Wine。）*

- **macOS**（生成 `.dmg` / `.app`）：
  ```bash
  npm run build:mac --workspace=packages/desktop
  ```
  *（注：强烈建议在 macOS 机器上进行 macOS 版本打包，以确保正确执行代码签名并成功生成 `.dmg`。）*

- **Linux**（生成 `.AppImage` / `.deb` / `.snap` 等）：
  ```bash
  npm run build:linux --workspace=packages/desktop
  ```

## Electron-Builder 配置

打包规则配置在 `packages/desktop/package.json` 的 `"build"` 字段中。

桌面端包含的关键文件有：
- `packages/desktop/main.js`（Electron 主进程脚本）
- `packages/frontend/out/**/*`（Next.js 的前端静态导出文件）
- `packages/backend/dist/**/*`（NestJS 的后端编译文件）
- `packages/backend/node_modules/**/*`（后端所需的依赖）
- `packages/backend/prisma/**/*`（Prisma Schema 模型和迁移脚本）
- `packages/backend/learniverse.db`（本地 SQLite 数据库降级文件）

## 常见问题与排查指南

1. **打包后的应用程序缺少文件**：
   在执行任何 `electron-builder` 命令之前，务必确认已经在项目根目录运行过 `npm run build`。因为桌面端强依赖前端的 `out` 目录和后端的 `dist` 目录。

2. **Next.js 静态导出（Static Export）**：
   前端被配置为静态导出模式 (`output: export`)，这就意味着带有 `force-dynamic` 标记的 API 路由将无法打包进桌面端。所有的外部请求必须通过 CORS 代理进行转发。

3. **数据库连接问题**：
   当应用程序运行在 Electron 环境中时（通过检测 `IS_ELECTRON` 或 `DESKTOP_ENV` 环境变量），后端将自动降级使用本地的 SQLite 数据库（`learniverse.db`）。请确保在打包前已经正确生成了 Prisma Client：
   ```bash
   cd packages/backend && npx prisma generate
   ```