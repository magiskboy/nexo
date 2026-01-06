# Coding Rules & Invariants

> [!IMPORTANT]
> These rules are strict constraints. Violating them may cause build failures, runtime errors, or architectural degradation.

## General Principles

- **Clean Code**: Prioritize readability and maintainability over clever hacks.
- **Type Safety**: strict TypeScript configuration. No `any` unless absolutely necessary (and must be commented).
- **Error Handling**: Explicit error handling. No swallowing errors.

## Frontend (React/TypeScript)

### 1. State Management

- **Redux Toolkit**: usage is mandatory for global state.
- **Typed Hooks**: ALWAYS use `useAppDispatch` and `useAppSelector` instead of `useDispatch` and `useSelector`.
- **Slices**: Keep logic inside slices (`src/store/slices`). Async logic goes into `createAsyncThunk`.

### 2. Component Structure (Atomic Design)

- **Location**: All UI components go in `src/ui` following Atomic Design principles.
- **Atomic Design Hierarchy**:
  - **Atoms** (`src/ui/atoms/`): Basic UI primitives (Button, Input, Select).
    - NO business logic, NO Tauri API calls, NO Redux.
    - Pure presentational components.
    - Shadcn UI components live here.
  - **Molecules** (`src/ui/molecules/`): Composed UI elements (LabeledInput, SearchBox, Dropdown).
    - Composed of atoms only.
    - Minimal local state (UI-only).
    - NO Tauri API calls, NO Redux.
  - **Organisms** (`src/ui/organisms/`): Complex UI sections (Sidebar, MessageList, SettingsForm).
    - Can use hooks, Redux, local state.
    - Can call Tauri APIs via hooks.
    - May compose molecules and other organisms.
  - **Layouts** (`src/ui/layouts/`): Structure definitions (MainLayout, SettingsLayout).
    - Define window/screen layout structure.
    - NO business logic.
  - **Screens** (`src/ui/screens/`): Full screen compositions (ChatScreen, SettingsScreen).
    - Compose layouts + organisms.
    - Handle screen-level state and navigation.
- **Props Interface**: Define props interface immediately before the component, named `[ComponentName]Props`.
- **Functional Components**: Use `export const [Name] = (...) => { ... }` syntax relative to the file.

### 3. Tauri Integration

- **Commands**: Never call `invoke` directly in components. Create a wrapper function in `src/lib/api` or similar if available, or keep them typed.
- **Events**: Use strong typing for event payloads.

### 4. Error Handling

- **Global**: The App is wrapped in an `ErrorBoundary`. Do not catch render errors individually unless necessary for partial UI recovery.
- **Commands**: Use `handleCommandError(dispatch, error)` from `@/lib/tauri` to automatically parse and display backend errors.
- **Parsing**: Backend errors follow `[Category] Message` format. Use `parseBackendError` utility if manual handling is needed.
- **Notifications**: Errors will be automatically categorized and styled with appropriate icons when using the standard handler.

### 5. Internationalization

- **Strings**: No hardcoded strings in UI. Use `t('key')` from `useTranslation`.
- **Keys**: snake_case or nested.structure.

## Backend (Rust)

### 1. Architectural Layers (Strict)

Data flow must follow this path:
`Command` -> `Service` -> `Repository` -> `Database`

- **Commands** (`src-tauri/src/commands`): Handle deserialization and call Services. Return `Result`.
- **Services** (`src-tauri/src/services`): Business logic. Transaction management.
- **Repositories** (`src-tauri/src/repositories`): ONLY raw SQL queries and Struct mapping.
- **Models** (`src-tauri/src/models`): Pure data structures (Structs).

### 2. Database (SQLite)

- **Queries**: Use parameterized queries (`?1`, `?2`) to prevent injection.
- **Migrations**: Database schema changes must be recorded in `src-tauri/src/db/migrations.rs`.

### 3. Error Handling

- **AppError**: Use `AppError` and its specific variants (`Http`, `Python`, `Llm`, etc.) instead of generic strings or `anyhow`.
- **Return Type**: Commands MUST return `Result<T, AppError>`.
- **Propagation**: Use `?` operator for cleaner propagation.

### 4. Async

- **Tokio**: Use `#[tokio::main]` for the entry point.
- **Blocking**: Avoid blocking the main thread. Use `spawn_blocking` for heavy synchronous operations.

## File & Naming Conventions

- **Rust Files**: `snake_case.rs`
- **React Components**: `PascalCase.tsx`
- **TS Utilities**: `camelCase.ts` or `kebab-case.ts`
- **Directories**: `kebab-case` generally preferred.
