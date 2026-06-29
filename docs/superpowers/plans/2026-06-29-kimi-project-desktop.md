# Kimi Project Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri-based desktop application that manages multiple Kimi Code CLI projects and lets users launch Kimi in any project directory with one click.

**Architecture:** A Tauri v2 shell exposes Rust commands for JSON persistence and terminal launching. The React frontend uses Zustand for state and Tailwind CSS for styling. All data lives in a local JSON file managed by the Rust backend.

**Tech Stack:** Tauri v2, Rust, React 18, TypeScript, Zustand, Tailwind CSS, Vitest, Cargo tests.

---

## File Structure

```
KimiProjectDesktop/
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root layout
│   ├── types.ts                    # Shared TS interfaces
│   ├── store/
│   │   └── useAppStore.ts          # Zustand store + Tauri API calls
│   └── components/
│       ├── ProjectList.tsx         # Sidebar project list
│       ├── ProjectDetail.tsx       # Main panel for selected project
│       ├── AddProjectDialog.tsx    # Add new project modal
│       ├── EditProjectDialog.tsx   # Edit project modal
│       ├── SearchBox.tsx           # Project filter input
│       └── EmptyState.tsx          # No project selected placeholder
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── lib.rs                  # Tauri plugin init
│       ├── main.rs                 # Application entry
│       ├── state.rs                # AppState, JSON persistence
│       ├── commands.rs             # Tauri commands exposed to frontend
│       └── terminal.rs             # Platform terminal launching
│   └── tests/
│       └── state_tests.rs          # Rust integration tests
├── tests/
│   └── components/
│       └── ProjectList.test.tsx    # Frontend component tests
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Task 1: Initialize Tauri + React + TypeScript Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`

- [ ] **Step 1: Verify prerequisites**

Run:
```bash
rustc --version
node --version
npm --version
cargo tauri --version
```

Expected: All commands return versions. If `cargo tauri` is missing, install it with `cargo install tauri-cli`.

- [ ] **Step 2: Create project via Tauri CLI**

Run from `F:/Coding-Projects/Vibe/KimiProjectDesktop`:
```bash
cargo tauri init --app-name kimi-project-desktop --window-title "Kimi Project Desktop" --dist-dir ../dist --dev-path http://localhost:5173 --before-dev-command "npm run dev" --before-build-command "npm run build"
```

Expected: `src-tauri/` directory created with `Cargo.toml`, `tauri.conf.json`, `src/main.rs`, and `src/lib.rs`.

- [ ] **Step 3: Install frontend dependencies**

Run:
```bash
npm install react react-dom zustand @tauri-apps/api @tauri-apps/plugin-shell
npm install -D @types/react @types/react-dom typescript vite @vitejs/plugin-react tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: `package.json` and `node_modules/` populated.

- [ ] **Step 4: Configure Tailwind CSS**

Create `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

Create `postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Update `src/main.tsx` bootstrapping**

Create `src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Update `src/App.tsx` placeholder**

Create `src/App.tsx`:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <h1 className="text-2xl font-bold">Kimi Project Desktop</h1>
    </div>
  );
}

export default App;
```

- [ ] **Step 7: Run dev server to verify**

Run:
```bash
cargo tauri dev
```

Expected: Window opens with dark background and "Kimi Project Desktop" text. Use `Ctrl+C` to stop after verifying.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: initialize tauri + react + typescript project"
```

---

## Task 2: Define Shared Types

**Files:**
- Create: `src/types.ts`
- Modify: `src-tauri/src/state.rs` (add Rust structs)

- [ ] **Step 1: Write TypeScript interfaces**

Create `src/types.ts`:
```typescript
export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  projectId: string;
  startedAt: string;
  summary?: string;
  command?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  launchOnStartup?: boolean;
  globalShortcut?: string;
}

export interface AppState {
  version: number;
  projects: Project[];
  sessions: Session[];
  settings: AppSettings;
}
```

- [ ] **Step 2: Write Rust structs**

Create `src-tauri/src/state.rs`:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub project_id: String,
    pub started_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub launch_on_startup: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub global_shortcut: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            launch_on_startup: Some(false),
            global_shortcut: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub version: u32,
    pub projects: Vec<Project>,
    pub sessions: Vec<Session>,
    pub settings: AppSettings,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            version: 1,
            projects: vec![],
            sessions: vec![],
            settings: AppSettings::default(),
        }
    }
}
```

- [ ] **Step 3: Add serde dependency in Cargo.toml**

Ensure `src-tauri/Cargo.toml` includes:
```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
```

- [ ] **Step 4: Build to verify types compile**

Run:
```bash
cargo check
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src-tauri/src/state.rs src-tauri/Cargo.toml
git commit -m "feat: define shared app state types"
```

---

## Task 3: Implement Rust State Persistence

**Files:**
- Create: `src-tauri/src/state.rs` (persistence functions)
- Create: `src-tauri/tests/state_tests.rs`

- [ ] **Step 1: Write failing test for load_or_create**

Create `src-tauri/tests/state_tests.rs`:
```rust
use std::fs;
use std::path::PathBuf;
use kimi_project_desktop::state::{load_or_create, save_state, AppState};

#[test]
fn test_load_or_create_creates_default_when_missing() {
    let dir = tempfile::tempdir().unwrap();
    let path: PathBuf = dir.path().join("state.json");
    assert!(!path.exists());

    let state = load_or_create(&path).unwrap();
    assert_eq!(state.version, 1);
    assert!(state.projects.is_empty());
    assert!(path.exists());
}

#[test]
fn test_save_and_load_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let path: PathBuf = dir.path().join("state.json");

    let mut state = AppState::default();
    state.projects.push(kimi_project_desktop::state::Project {
        id: "p1".to_string(),
        name: "demo".to_string(),
        path: "/tmp/demo".to_string(),
        description: None,
        tags: None,
        created_at: "2026-06-29T00:00:00Z".to_string(),
        updated_at: "2026-06-29T00:00:00Z".to_string(),
    });

    save_state(&path, &state).unwrap();
    let loaded = load_or_create(&path).unwrap();
    assert_eq!(loaded.projects.len(), 1);
    assert_eq!(loaded.projects[0].name, "demo");
}

#[test]
fn test_load_or_create_backups_corrupted_file() {
    let dir = tempfile::tempdir().unwrap();
    let path: PathBuf = dir.path().join("state.json");
    fs::write(&path, "not json").unwrap();

    let state = load_or_create(&path).unwrap();
    assert_eq!(state.version, 1);

    let backups: Vec<_> = fs::read_dir(dir.path())
        .unwrap()
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .filter(|n| n.starts_with("state.json.bak"))
        .collect();
    assert_eq!(backups.len(), 1);
}
```

- [ ] **Step 2: Add tempfile dev-dependency**

Add to `src-tauri/Cargo.toml`:
```toml
[dev-dependencies]
tempfile = "3"
```

- [ ] **Step 3: Expose state module in lib.rs**

Update `src-tauri/src/lib.rs`:
```rust
pub mod state;
```

- [ ] **Step 4: Run tests to verify they fail**

Run:
```bash
cd src-tauri
cargo test
```

Expected: Compilation errors because `load_or_create` and `save_state` do not exist yet.

- [ ] **Step 5: Implement persistence functions**

Append to `src-tauri/src/state.rs`:
```rust
use std::fs;
use std::io::Write;
use std::path::Path;

pub fn load_or_create<P: AsRef<Path>>(path: P) -> Result<AppState, String> {
    let path = path.as_ref();
    if !path.exists() {
        let default = AppState::default();
        save_state(path, &default)?;
        return Ok(default);
    }

    let content = fs::read_to_string(path).map_err(|e| format!("read failed: {e}"))?;
    match serde_json::from_str::<AppState>(&content) {
        Ok(state) => Ok(state),
        Err(e) => {
            let backup_name = format!(
                "state.json.bak.{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
            );
            let backup_path = path.with_file_name(&backup_name);
            fs::copy(path, backup_path).map_err(|err| format!("backup failed: {err}"))?;
            let default = AppState::default();
            save_state(path, &default)?;
            eprintln!("State file corrupted, backed up to {backup_name}: {e}");
            Ok(default)
        }
    }
}

pub fn save_state<P: AsRef<Path>>(path: P, state: &AppState) -> Result<(), String> {
    let path = path.as_ref();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("create dir failed: {e}"))?;
    }
    let content = serde_json::to_string_pretty(state).map_err(|e| format!("serialize failed: {e}"))?;
    let mut file = fs::File::create(path).map_err(|e| format!("create file failed: {e}"))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("write failed: {e}"))?;
    Ok(())
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:
```bash
cd src-tauri
cargo test
```

Expected: All 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/state.rs src-tauri/src/lib.rs src-tauri/tests/state_tests.rs src-tauri/Cargo.toml
git commit -m "feat: implement json state persistence with backup"
```

---

## Task 4: Implement Tauri Commands

**Files:**
- Create: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Implement commands**

Create `src-tauri/src/commands.rs`:
```rust
use crate::state::{AppState, Project, Session};
use std::sync::Mutex;
use tauri::State;

pub struct AppStateWrapper(pub Mutex<AppState>);

#[tauri::command]
pub fn get_state(state: State<'_, AppStateWrapper>) -> Result<AppState, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[tauri::command]
pub fn add_project(
    state: State<'_, AppStateWrapper>,
    project: Project,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.projects.push(project);
        crate::state::save_state(&state_path, &guard)?;
    }
    get_state(state)
}

#[tauri::command]
pub fn update_project(
    state: State<'_, AppStateWrapper>,
    project: Project,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        if let Some(existing) = guard.projects.iter_mut().find(|p| p.id == project.id) {
            *existing = project;
            crate::state::save_state(&state_path, &guard)?;
        }
    }
    get_state(state)
}

#[tauri::command]
pub fn delete_project(
    state: State<'_, AppStateWrapper>,
    id: String,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.projects.retain(|p| p.id != id);
        guard.sessions.retain(|s| s.project_id != id);
        crate::state::save_state(&state_path, &guard)?;
    }
    get_state(state)
}

#[tauri::command]
pub fn record_session(
    state: State<'_, AppStateWrapper>,
    session: Session,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.sessions.push(session);
        crate::state::save_state(&state_path, &guard)?;
    }
    get_state(state)
}
```

- [ ] **Step 2: Register commands and state in lib.rs**

Update `src-tauri/src/lib.rs`:
```rust
pub mod commands;
pub mod state;

use commands::AppStateWrapper;
use state::load_or_create;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

pub fn app_state_path(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir")
        .join("state.json")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let path = app_state_path(app.app_handle());
            let initial = load_or_create(&path).map_err(|e| e.to_string())?;
            app.manage(AppStateWrapper(Mutex::new(initial)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_state,
            commands::add_project,
            commands::update_project,
            commands::delete_project,
            commands::record_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: Update main.rs**

Update `src-tauri/src/main.rs`:
```rust
fn main() {
    kimi_project_desktop_lib::run();
}
```

Wait — crate name. In Cargo.toml it will be `kimi_project_desktop`. Adjust to match.

Expected content:
```rust
fn main() {
    kimi_project_desktop::run();
}
```

- [ ] **Step 4: Add shell plugin dependency**

Add to `src-tauri/Cargo.toml`:
```toml
[dependencies]
tauri-plugin-shell = "2"
```

- [ ] **Step 5: Update tauri.conf.json permissions**

Ensure `src-tauri/tauri.conf.json` includes the shell plugin:
```json
{
  "plugins": {
    "shell": {
      "open": "^"
    }
  }
}
```

Also ensure app has access to appDataDir. In Tauri v2 this is granted by `fs:default` or `path:default`.

- [ ] **Step 6: Build to verify**

Run:
```bash
cd src-tauri
cargo check
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/lib.rs src-tauri/src/main.rs src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "feat: expose tauri commands for project and session management"
```

---

## Task 5: Implement Windows External Terminal Launch

**Files:**
- Create: `src-tauri/src/terminal.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/commands.rs`

- [ ] **Step 1: Implement terminal launcher**

Create `src-tauri/src/terminal.rs`:
```rust
use std::path::Path;
use std::process::Command;

pub fn open_kimi_in_terminal(project_path: &str) -> Result<(), String> {
    let path = Path::new(project_path);
    if !path.exists() {
        return Err(format!("project path does not exist: {project_path}"));
    }

    let canonical = path.canonicalize().map_err(|e| format!("canonicalize failed: {e}"))?;
    let canonical_str = canonical.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        let ps_command = format!("cd \"{}\"; kim", canonical_str);
        Command::new("powershell.exe")
            .args(["-NoExit", "-Command", &ps_command])
            .spawn()
            .map_err(|e| format!("failed to start terminal: {e}"))?;
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!("cd '{}' && clear && kimi", canonical_str.replace("'", "'\\''"));
        Command::new("osascript")
            .args([
                "-e",
                &format!("tell application \"Terminal\" to do script \"{}\"", script),
                "-e",
                "tell application \"Terminal\" to activate",
            ])
            .spawn()
            .map_err(|e| format!("failed to start terminal: {e}"))?;
    }

    #[cfg(target_os = "linux")]
    {
        let script = format!("cd \"{}\" && kim", canonical_str);
        Command::new("x-terminal-emulator")
            .args(["-e", "bash", "-c", &script])
            .spawn()
            .or_else(|_| {
                Command::new("gnome-terminal")
                    .args(["--", "bash", "-c", &script])
                    .spawn()
            })
            .map_err(|e| format!("failed to start terminal: {e}"))?;
    }

    Ok(())
}

pub fn command_exists(name: &str) -> bool {
    Command::new("which")
        .arg(name)
        .output()
        .map(|out| out.status.success())
        .unwrap_or(false)
}
```

Note: On Windows PowerShell 5/7 may differ. `powershell.exe` is usually available. For Kimi CLI installed via npm on Windows, `kim` may not be in PATH for PowerShell depending on environment. We will add a check and let users configure command in settings later.

- [ ] **Step 2: Add launch command**

Append to `src-tauri/src/commands.rs`:
```rust
#[tauri::command]
pub fn open_kimi(project_path: String) -> Result<(), String> {
    crate::terminal::open_kimi_in_terminal(&project_path)
}
```

- [ ] **Step 3: Register command and module**

Update `src-tauri/src/lib.rs`:
```rust
pub mod commands;
pub mod state;
pub mod terminal;
```

Add `commands::open_kimi` to `invoke_handler` list.

- [ ] **Step 4: Build to verify**

Run:
```bash
cd src-tauri
cargo check
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/terminal.rs src-tauri/src/commands.rs src-tauri/src/lib.rs
git commit -m "feat: open kimi in external terminal on windows/macos/linux"
```

---

## Task 6: Implement Zustand Store and Tauri API Integration

**Files:**
- Create: `src/store/useAppStore.ts`
- Modify: `src/types.ts` (if needed)

- [ ] **Step 1: Install uuid dependency**

Run:
```bash
npm install uuid
npm install -D @types/uuid
```

- [ ] **Step 2: Write the store**

Create `src/store/useAppStore.ts`:
```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { AppState, Project, Session } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppStore extends AppState {
  loaded: boolean;
  error: string | null;
  loadState: () => Promise<void>;
  addProject: (input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  openKimi: (project: Project) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  version: 1,
  projects: [],
  sessions: [],
  settings: { theme: 'dark' },
  loaded: false,
  error: null,

  loadState: async () => {
    try {
      const state = await invoke<AppState>('get_state');
      set({ ...state, loaded: true, error: null });
    } catch (err) {
      set({ loaded: true, error: String(err) });
    }
  },

  addProject: async (input) => {
    const now = new Date().toISOString();
    const project: Project = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const state = await invoke<AppState>('add_project', { project });
    set({ ...state, error: null });
  },

  updateProject: async (project) => {
    const updated = { ...project, updatedAt: new Date().toISOString() };
    const state = await invoke<AppState>('update_project', { project: updated });
    set({ ...state, error: null });
  },

  deleteProject: async (id) => {
    const state = await invoke<AppState>('delete_project', { id });
    set({ ...state, error: null });
  },

  openKimi: async (project) => {
    await invoke('open_kimi', { projectPath: project.path });
    const session: Session = {
      id: uuidv4(),
      projectId: project.id,
      startedAt: new Date().toISOString(),
      command: 'kimi',
    };
    const state = await invoke<AppState>('record_session', { session });
    set({ ...state, error: null });
  },
}));
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/store/useAppStore.ts package.json package-lock.json
git commit -m "feat: add zustand store with tauri command integration"
```

---

## Task 7: Implement ProjectList Component

**Files:**
- Create: `src/components/ProjectList.tsx`
- Create: `src/components/SearchBox.tsx`
- Create: `tests/components/ProjectList.test.tsx`

- [ ] **Step 1: Write SearchBox component**

Create `src/components/SearchBox.tsx`:
```tsx
interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({ value, onChange, placeholder = 'Search projects...' }: SearchBoxProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-600"
    />
  );
}
```

- [ ] **Step 2: Write failing test**

Create `tests/components/ProjectList.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from '../../src/components/ProjectList';

const projects = [
  { id: '1', name: 'web-app', path: '/tmp/web-app', createdAt: '2026-06-29T00:00:00Z', updatedAt: '2026-06-29T00:00:00Z' },
  { id: '2', name: 'backend', path: '/tmp/backend', createdAt: '2026-06-29T00:00:00Z', updatedAt: '2026-06-29T00:00:00Z' },
];

describe('ProjectList', () => {
  it('renders project names', () => {
    render(<ProjectList projects={projects} selectedId={null} onSelect={() => {}} onDelete={vi.fn()} />);
    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
  });

  it('filters projects by search', () => {
    render(<ProjectList projects={projects} selectedId={null} onSelect={() => {}} onDelete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Search projects...'), { target: { value: 'web' } });
    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.queryByText('backend')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

Add test script to `package.json`:
```json
"scripts": {
  "test": "vitest"
}
```

- [ ] **Step 4: Run tests to verify they fail**

Run:
```bash
npm test -- --run
```

Expected: FAIL because ProjectList component does not exist.

- [ ] **Step 5: Implement ProjectList component**

Create `src/components/ProjectList.tsx`:
```tsx
import { useState } from 'react';
import { SearchBox } from './SearchBox';
import type { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectList({ projects, selectedId, onSelect, onDelete }: ProjectListProps) {
  const [query, setQuery] = useState('');

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.path.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col border-r border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-4">
        <SearchBox value={query} onChange={setQuery} />
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelect(project.id)}
            className={`group relative mb-2 cursor-pointer rounded-md px-3 py-2 ${
              selectedId === project.id ? 'bg-blue-900/40' : 'hover:bg-neutral-800'
            }`}
          >
            <div className="font-medium text-neutral-100">{project.name}</div>
            <div className="truncate text-xs text-neutral-500">{project.path}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="absolute right-2 top-2 hidden text-neutral-500 hover:text-red-400 group-hover:block"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:
```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProjectList.tsx src/components/SearchBox.tsx tests/ vitest.config.ts package.json
git commit -m "feat: implement searchable project list component"
```

---

## Task 8: Implement ProjectDetail Component

**Files:**
- Create: `src/components/ProjectDetail.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `tests/components/ProjectDetail.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/ProjectDetail.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectDetail } from '../../src/components/ProjectDetail';

const project = {
  id: '1',
  name: 'web-app',
  path: '/tmp/web-app',
  description: 'Frontend app',
  createdAt: '2026-06-29T00:00:00Z',
  updatedAt: '2026-06-29T00:00:00Z',
};

describe('ProjectDetail', () => {
  it('renders project name and path', () => {
    render(<ProjectDetail project={project} sessions={[]} onOpenKimi={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.getByText('/tmp/web-app')).toBeInTheDocument();
  });

  it('calls onOpenKimi when button clicked', () => {
    const onOpenKimi = vi.fn();
    render(<ProjectDetail project={project} sessions={[]} onOpenKimi={onOpenKimi} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open in kimi/i }));
    expect(onOpenKimi).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npm test -- --run
```

Expected: FAIL because ProjectDetail does not exist.

- [ ] **Step 3: Implement ProjectDetail**

Create `src/components/ProjectDetail.tsx`:
```tsx
import type { Project, Session } from '../types';

interface ProjectDetailProps {
  project: Project;
  sessions: Session[];
  onOpenKimi: () => void;
  onEdit: () => void;
}

export function ProjectDetail({ project, sessions, onOpenKimi, onEdit }: ProjectDetailProps) {
  const projectSessions = sessions
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className="flex h-full flex-col bg-neutral-950 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">{project.name}</h2>
          <p className="mt-1 text-sm text-neutral-500">{project.path}</p>
          {project.description && <p className="mt-2 text-neutral-400">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-700"
          >
            Edit
          </button>
          <button
            onClick={onOpenKimi}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Open in Kimi
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent Sessions
        </h3>
        {projectSessions.length === 0 ? (
          <p className="text-neutral-600">No sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {projectSessions.map((session) => (
              <div key={session.id} className="rounded-md bg-neutral-900 p-3">
                <div className="text-sm text-neutral-300">
                  {new Date(session.startedAt).toLocaleString()}
                </div>
                {session.summary && (
                  <div className="mt-1 text-xs text-neutral-500">{session.summary}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement EmptyState**

Create `src/components/EmptyState.tsx`:
```tsx
export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-neutral-950 text-neutral-500">
      <p className="text-lg">Select a project or add a new one</p>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectDetail.tsx src/components/EmptyState.tsx tests/components/ProjectDetail.test.tsx
git commit -m "feat: implement project detail and empty state"
```

---

## Task 9: Implement AddProjectDialog Component

**Files:**
- Create: `src/components/AddProjectDialog.tsx`
- Modify: `src-tauri/tauri.conf.json` (if dialog plugin needed)

- [ ] **Step 1: Install dialog plugin**

Run:
```bash
npm install @tauri-apps/plugin-dialog
cargo add tauri-plugin-dialog --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 2: Register dialog plugin in lib.rs**

Update setup in `src-tauri/src/lib.rs`:
```rust
.plugin(tauri_plugin_dialog::init())
```

- [ ] **Step 3: Implement dialog component**

Create `src/components/AddProjectDialog.tsx`:
```tsx
import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

interface AddProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: { name: string; path: string; description?: string }) => Promise<void>;
}

export function AddProjectDialog({ isOpen, onClose, onAdd }: AddProjectDialogProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const pickDirectory = async () => {
    const selected = await open({ directory: true });
    if (typeof selected === 'string') {
      setPath(selected);
      if (!name) {
        const parts = selected.replace(/\\/g, '/').split('/');
        setName(parts[parts.length - 1] || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) return;
    await onAdd({ name, path, description: description || undefined });
    setName('');
    setPath('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-neutral-900 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-neutral-100">Add Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Path</label>
            <div className="flex gap-2">
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="flex-1 rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <button
                type="button"
                onClick={pickDirectory}
                className="rounded-md bg-neutral-700 px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-600"
              >
                Browse
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-neutral-800 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add minimal render test**

Create `tests/components/AddProjectDialog.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddProjectDialog } from '../../src/components/AddProjectDialog';

describe('AddProjectDialog', () => {
  it('renders form when open', () => {
    render(<AddProjectDialog isOpen={true} onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AddProjectDialog isOpen={false} onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/AddProjectDialog.tsx tests/components/AddProjectDialog.test.tsx src-tauri/src/lib.rs src-tauri/Cargo.toml package.json package-lock.json
git commit -m "feat: implement add project dialog with directory picker"
```

---

## Task 10: Implement EditProjectDialog Component

**Files:**
- Create: `src/components/EditProjectDialog.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/EditProjectDialog.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditProjectDialog } from '../../src/components/EditProjectDialog';

const project = {
  id: '1',
  name: 'web-app',
  path: '/tmp/web-app',
  description: 'Frontend',
  createdAt: '2026-06-29T00:00:00Z',
  updatedAt: '2026-06-29T00:00:00Z',
};

describe('EditProjectDialog', () => {
  it('prefills project data', () => {
    render(<EditProjectDialog project={project} isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue('web-app')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/tmp/web-app')).toBeInTheDocument();
  });

  it('calls onSave with updated project', () => {
    const onSave = vi.fn();
    render(<EditProjectDialog project={project} isOpen={true} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByDisplayValue('web-app'), { target: { value: 'web-app-v2' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'web-app-v2' }));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npm test -- --run
```

Expected: FAIL.

- [ ] **Step 3: Implement component**

Create `src/components/EditProjectDialog.tsx`:
```tsx
import { useState, useEffect } from 'react';
import type { Project } from '../types';

interface EditProjectDialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => Promise<void>;
}

export function EditProjectDialog({ project, isOpen, onClose, onSave }: EditProjectDialogProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setPath(project.path);
      setDescription(project.description || '');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) return;
    await onSave({ ...project, name, path, description: description || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-neutral-900 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-neutral-100">Edit Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Path</label>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-neutral-800 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run:
```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/EditProjectDialog.tsx tests/components/EditProjectDialog.test.tsx
git commit -m "feat: implement edit project dialog"
```

---

## Task 11: Wire Up App Layout and Theme

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Update App.tsx to wire components**

Update `src/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { EmptyState } from './components/EmptyState';
import { AddProjectDialog } from './components/AddProjectDialog';
import { EditProjectDialog } from './components/EditProjectDialog';
import { useAppStore } from './store/useAppStore';

function App() {
  const {
    projects,
    sessions,
    loaded,
    error,
    loadState,
    addProject,
    updateProject,
    deleteProject,
    openKimi,
  } = useAppStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(useAppStore.getState().projects.find((p) => p.id === selectedId) || null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    setEditingProject(projects.find((p) => p.id === selectedId) || null);
  }, [selectedId, projects]);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-red-400">
        Error: {error}
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <div className="w-72 flex-shrink-0">
        <ProjectList
          projects={projects}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={deleteProject}
        />
        <div className="border-r border-neutral-800 bg-neutral-900 p-4">
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full rounded-md bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            + Add Project
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            sessions={sessions}
            onOpenKimi={() => openKimi(selectedProject)}
            onEdit={() => setIsEditOpen(true)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
      <AddProjectDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addProject}
      />
      <EditProjectDialog
        project={editingProject}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={updateProject}
      />
    </div>
  );
}

export default App;
```

Note: The `setEditingProject` initialization uses `useAppStore.getState()` which is fine but reads state at render time. Simplify: initialize to `null` and use `useEffect` to update.

Correct initialization:
```tsx
const [editingProject, setEditingProject] = useState<Project | null>(null);
```

- [ ] **Step 2: Ensure CSS is loaded**

`src/index.css` already has Tailwind directives.

- [ ] **Step 3: Run dev and manually verify**

Run:
```bash
cargo tauri dev
```

Expected: App window opens. Click "Add Project", choose a directory, save, select project, click "Open in Kimi" — a terminal should open in that directory.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/index.css
git commit -m "feat: wire up app layout with project list, detail, and dialogs"
```

---

## Task 12: Add Error Handling and Notifications

**Files:**
- Create: `src/components/Toast.tsx`
- Modify: `src/store/useAppStore.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Toast component**

Create `src/components/Toast.tsx`:
```tsx
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-red-900 px-4 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}
```

- [ ] **Step 2: Add error display state and clear to store**

Update `src/store/useAppStore.ts`:
- Add `clearError` action.
- Wrap async actions in try/catch and set `error`.

Example addition:
```typescript
clearError: () => set({ error: null }),
```

Update `addProject`, `updateProject`, `deleteProject`, `openKimi` to catch errors:
```typescript
addProject: async (input) => {
  try {
    // existing logic
  } catch (err) {
    set({ error: String(err) });
  }
},
```

- [ ] **Step 3: Wire Toast in App.tsx**

Update `src/App.tsx`:
```tsx
import { Toast } from './components/Toast';
// ...
const { error, clearError } = useAppStore();
// ...
{error && <Toast message={error} onClose={clearError} />}
```

- [ ] **Step 4: Test error toast renders**

Add to `tests/components/Toast.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '../../src/components/Toast';

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Something went wrong" onClose={vi.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Toast.tsx tests/components/Toast.test.tsx src/store/useAppStore.ts src/App.tsx
git commit -m "feat: add error toasts and centralized error handling"
```

---

## Task 13: End-to-End Manual Verification

**Files:**
- Modify: any remaining rough edges discovered during testing

- [ ] **Step 1: Run full test suite**

Run:
```bash
npm test -- --run
cd src-tauri && cargo test
```

Expected: All frontend and Rust tests pass.

- [ ] **Step 2: Build release bundle**

Run:
```bash
cargo tauri build
```

Expected: Build succeeds. MSI/exe produced in `src-tauri/target/release/bundle/`.

- [ ] **Step 3: Manual smoke test checklist**

- [ ] Launch app
- [ ] Click "Add Project", browse to a real project directory
- [ ] Save and see it appear in sidebar
- [ ] Select project and see details
- [ ] Click "Open in Kimi" and verify terminal opens in correct directory
- [ ] Close terminal and click again, verify new session appears in "Recent Sessions"
- [ ] Click "Edit", change name, save, verify update
- [ ] Click delete button on sidebar, verify project removed
- [ ] Close app and reopen, verify projects persisted

- [ ] **Step 4: Fix any issues found**

If Kimi CLI command is not found in spawned terminal, add a settings field `kimiCommand` with default `"kimi"` and allow override. Implement in Phase 2 if not needed for MVP.

- [ ] **Step 5: Commit final changes**

```bash
git add .
git commit -m "chore: verify mvp and fix rough edges"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - Project CRUD → Tasks 3, 4, 6, 7, 8, 9, 10, 11
   - External terminal launch → Task 5, 11
   - Recent session recording → Tasks 3, 4, 6, 8
   - JSON persistence → Tasks 2, 3
   - Dark theme UI → Tasks 1, 7, 8, 9, 10, 11, 12
   - Error handling → Tasks 3, 5, 12
   - Testing → Tasks 3, 7, 8, 9, 10, 12, 13

2. **Placeholder scan:** No TBD/TODO placeholders. Each task has concrete code, commands, and expected output.

3. **Type consistency:**
   - Rust `Project` uses snake_case fields (`created_at`) while TS `Project` uses camelCase (`createdAt`). Serialization mapping is handled by serde default field names — decide now: either rename Rust to camelCase with `#[serde(rename_all = "camelCase")]` or accept mismatch. To avoid confusion, add `#[serde(rename_all = "camelCase")]` to all Rust structs in Task 2.
   - `open_kimi` command signature is consistent across Task 5 and Task 6.
   - `AppStateWrapper` is introduced in Task 4 and used in Task 4 commands.

4. **Scope check:** Plan focuses on Phase 1 MVP only. Phase 2 and Phase 3 are out of scope for this plan.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-06-29-kimi-project-desktop.md`.

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach would you like?
