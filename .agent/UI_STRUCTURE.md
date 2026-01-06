# UI Structure Guide (Atomic Design)

> [!NOTE]
> This document describes the UI component organization following Atomic Design principles adapted for desktop applications.

## Overview

The UI is organized into 5 levels following Atomic Design:

1. **Atoms** - Basic UI primitives
2. **Molecules** - Composed UI elements
3. **Organisms** - Complex UI sections
4. **Layouts** - Layout structures
5. **Screens** - Full screen compositions

## Directory Structure

```
src/ui/
├── atoms/              # Basic UI primitives
│   ├── button/
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog/
│   └── ...
│
├── molecules/          # Composed UI elements
│   ├── SlashCommandDropdown.tsx
│   ├── AgentMentionDropdown.tsx
│   ├── VariableInputDialog.tsx
│   ├── ChatSearchDialog.tsx
│   └── AgentCard.tsx
│
├── organisms/          # Complex UI sections
│   ├── chat/
│   │   └── ChatArea.tsx
│   ├── markdown/
│   │   ├── MarkdownContent.tsx
│   │   └── ...
│   ├── settings/
│   │   ├── AppSettings.tsx
│   │   ├── LLMConnections.tsx
│   │   └── ...
│   ├── workspace/
│   │   ├── WorkspaceSelector.tsx
│   │   └── ...
│   ├── ChatSidebar.tsx
│   ├── ChatInput.tsx
│   ├── ChatMessages.tsx
│   ├── MessageItem.tsx
│   ├── TitleBar.tsx
│   └── ...
│
├── layouts/            # Layout structures
│   ├── MainLayout.tsx
│   ├── SettingsLayout.tsx
│   └── ChatLayout.tsx
│
└── screens/            # Full screen compositions
    ├── ChatScreen.tsx
    ├── SettingsScreen.tsx
    ├── WorkspaceSettingsScreen.tsx
    └── WelcomeScreen.tsx
```

## Component Rules

### Atoms (`src/ui/atoms/`)

**Purpose**: Basic building blocks of the UI.

**Rules**:

- ✅ Pure presentational components
- ✅ No business logic
- ✅ No Tauri API calls
- ✅ No Redux usage
- ✅ Minimal or no local state (UI-only state like `isOpen` is OK)
- ✅ Reusable across the application

**Examples**: `Button`, `Input`, `Select`, `Dialog`, `Checkbox`

### Molecules (`src/ui/molecules/`)

**Purpose**: Simple combinations of atoms that form a functional unit.

**Rules**:

- ✅ Composed of atoms only
- ✅ Minimal local state (form validation, UI interactions)
- ✅ NO Tauri API calls
- ✅ NO Redux usage
- ✅ Single, clear UI responsibility

**Examples**:

- `SlashCommandDropdown` - Combines ScrollArea + list items
- `VariableInputDialog` - Combines Dialog + Input + Label atoms
- `ChatSearchDialog` - Dialog with search input and results list

### Organisms (`src/ui/organisms/`)

**Purpose**: Complex UI sections that form distinct parts of the interface.

**Rules**:

- ✅ Can use React hooks
- ✅ Can use Redux (via `useAppDispatch`, `useAppSelector`)
- ✅ Can call Tauri APIs via hooks
- ✅ Can manage local state
- ✅ Can compose molecules and other organisms
- ✅ Organized by domain (chat/, settings/, workspace/, markdown/)

**Examples**:

- `ChatSidebar` - Manages chat list, uses Tauri APIs
- `ChatInput` - Complex input with file upload, model selection
- `ChatMessages` - Message list with scrolling, editing
- `AppSettings` - Settings form with Redux state

### Layouts (`src/ui/layouts/`)

**Purpose**: Define the structural layout of windows/screens.

**Rules**:

- ✅ Structure definitions only
- ✅ NO business logic
- ✅ Accept children/slots for content
- ✅ Handle responsive/collapsible layouts

**Examples**:

- `MainLayout` - Root layout with TitleBar, manages global dialogs
- `SettingsLayout` - Sidebar + content area for settings
- `ChatLayout` - Sidebar + chat area for chat screen

### Screens (`src/ui/screens/`)

**Purpose**: Full screen compositions that combine layouts and organisms.

**Rules**:

- ✅ Compose layouts + organisms
- ✅ Handle screen-level state
- ✅ Manage navigation/routing
- ✅ Can use Redux and hooks

**Examples**:

- `ChatScreen` - Composes ChatLayout + ChatSidebar + ChatArea
- `SettingsScreen` - Composes SettingsLayout + settings organisms
- `WorkspaceSettingsScreen` - Full workspace settings view

## Import Paths

Always use absolute imports with `@/ui/` prefix:

```typescript
// ✅ Good
import { Button } from '@/ui/atoms/button/button';
import { ChatSidebar } from '@/ui/organisms/ChatSidebar';
import { ChatScreen } from '@/ui/screens/ChatScreen';

// ❌ Bad - Relative imports
import { Button } from '../atoms/button/button';
```

## Migration Notes

- Old structure (`src/ui/chat-area/`, `src/ui/settings/`, etc.) has been removed
- Old `src/pages/` has been replaced with `src/ui/screens/`
- All components have been reorganized according to Atomic Design principles
