# Learniverse Desktop Application Packaging Guide

This guide will walk you through the process of packaging the Learniverse monorepo into a desktop application using Electron and electron-builder.

## Prerequisites

Before packaging, ensure you have the following installed:
- Node.js (v18.0.0 or higher recommended)
- npm (Node Package Manager)

Since Learniverse uses a monorepo structure, the desktop application depends on the successful build of both the frontend (Next.js) and the backend (NestJS).

## One-Click Automated Build

To simplify the process, an automated script has been added to the root `package.json`. It will compile all necessary workspaces and package the desktop client for your current operating system.

Run the following command from the **root directory**:

```bash
npm run build:desktop
```

This command automatically executes:
1. `npm run build`: Compiles the frontend (generating `out/`) and backend (generating `dist/`).
2. `electron-builder`: Packages the application using the configuration in `packages/desktop/package.json`.

The packaged output will be available in the `packages/desktop/dist/` directory.

## Platform-Specific Packaging

If you need to package the application for a specific operating system, make sure you have built the monorepo (`npm run build`) first, and then run the corresponding command from the root directory:

- **Windows** (`.exe` / NSIS installer):
  ```bash
  npm run build:win --workspace=packages/desktop
  ```
  *(Note: Packaging for Windows from a macOS/Linux machine requires Wine installed.)*

- **macOS** (`.dmg` / `.app`):
  ```bash
  npm run build:mac --workspace=packages/desktop
  ```
  *(Note: macOS builds must be performed on a macOS machine to ensure proper code signing and `.dmg` generation.)*

- **Linux** (`.AppImage` / `.deb` / `.snap`):
  ```bash
  npm run build:linux --workspace=packages/desktop
  ```

## Electron-Builder Configuration

The packaging rules are defined in `packages/desktop/package.json` under the `"build"` key.

Key files included in the desktop application:
- `packages/desktop/main.js` (Main process script)
- `packages/frontend/out/**/*` (Next.js static export frontend)
- `packages/backend/dist/**/*` (NestJS compiled backend)
- `packages/backend/node_modules/**/*` (Backend dependencies)
- `packages/backend/prisma/**/*` (Prisma schema and migrations)
- `packages/backend/learniverse.db` (Local SQLite database fallback)

## Troubleshooting

1. **Missing Files in Packaged App**:
   Ensure you run `npm run build` from the root directory before running any `electron-builder` scripts. The desktop app relies on `packages/frontend/out` and `packages/backend/dist`.

2. **Next.js Static Export**:
   The frontend is configured for static export (`output: export`). API routes with `force-dynamic` cannot be packaged. Ensure external requests use CORS proxies if needed.

3. **Database Connectivity**:
   When running inside Electron (`IS_ELECTRON` or `DESKTOP_ENV`), the backend automatically falls back to a local SQLite database (`learniverse.db`). Ensure Prisma client is correctly generated before packaging:
   ```bash
   cd packages/backend && npx prisma generate
   ```