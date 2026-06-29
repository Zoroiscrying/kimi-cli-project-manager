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
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set, _get) => ({
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
    try {
      const now = new Date().toISOString();
      const project: Project = {
        ...input,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      const state = await invoke<AppState>('add_project', { project });
      set({ ...state, error: null });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  updateProject: async (project) => {
    try {
      const updated = { ...project, updatedAt: new Date().toISOString() };
      const state = await invoke<AppState>('update_project', { project: updated });
      set({ ...state, error: null });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteProject: async (id) => {
    try {
      const state = await invoke<AppState>('delete_project', { id });
      set({ ...state, error: null });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  openKimi: async (project) => {
    try {
      await invoke('open_kimi', { projectPath: project.path });
      const session: Session = {
        id: uuidv4(),
        projectId: project.id,
        startedAt: new Date().toISOString(),
        command: 'kimi',
      };
      const state = await invoke<AppState>('record_session', { session });
      set({ ...state, error: null });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
