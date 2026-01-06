# Project Structure Map

> [!NOTE]
> This map helps AI agents navigate the codebase by understanding the semantic purpose of each directory.

## Root Directory

- `.agent/`: Knowledge base for AI agents (This directory).
- `src-tauri/`: Rust backend and Tauri configuration.
- `src/`: React frontend source code.
- `scripts/`: Maintenance and build scripts.

## Frontend (`src/`)

- `src/assets/`: Static assets (images, fonts).
- `src/bindings/`: Generated TS types from Rust (via `ts-rs` or Tauri bindings).
- `src/hooks/`: Custom React hooks.
- `src/i18n/`: Internationalization configs and locales.
- `src/lib/`: Utility libraries and shared helpers.
- `src/store/`: Redux store configuration.
  - `src/store/slices/`: Redux state slices (reducers/actions).
- `src/types/`: shared TypeScript type definitions.
- `src/ui/`: UI Components (Atomic Design structure).
  - `src/ui/atoms/`: Basic UI primitives (Buttons, Inputs, Select, etc.). No business logic, no Tauri API calls.
  - `src/ui/molecules/`: Composed UI elements (dropdowns, dialogs, form fields). Minimal logic, UI-only.
  - `src/ui/organisms/`: Complex UI sections (sidebar, message list, input area). Can use hooks, Redux, Tauri APIs.
    - `src/ui/organisms/chat/`: Chat-related organisms (ChatArea).
    - `src/ui/organisms/markdown/`: Markdown rendering components.
    - `src/ui/organisms/settings/`: Settings page components.
    - `src/ui/organisms/workspace/`: Workspace management components.
  - `src/ui/layouts/`: Layout structure definitions (MainLayout, SettingsLayout, ChatLayout).
  - `src/ui/screens/`: Full screen compositions (ChatScreen, SettingsScreen, WorkspaceSettingsScreen, WelcomeScreen).

## Backend (`src-tauri/src/`)

- `bin/`: Additional binaries or entry points.
- `commands/`: **[Layer 1]** Tauri Commands (API Endpoints). Exposed to Frontend.
- `services/`: **[Layer 2]** Business Logic.
- `repositories/`: **[Layer 3]** Data Access Layer (SQL queries).
- `models/`: Data structures (Rust Structs).
- `db/`: Database connection and migration logic.
- `events/`: Event definitions for backend-to-frontend communication.
- `error/`: Custom error types (`CommandError`, etc.).
- `state/`: Application state managed by Tauri (AppState).
- `constants/`: System-wide constants.

## Key Files

- `package.json`: Frontend dependencies and scripts.
- `src-tauri/Cargo.toml`: Backend dependencies.
- `src-tauri/tauri.conf.json`: Tauri application configuration.
- `src-tauri/src/lib.rs`: Main library entry point (Tauri setup).
- `src/App.tsx`: Main React component.
- `src/main.tsx`: Frontend entry point.
