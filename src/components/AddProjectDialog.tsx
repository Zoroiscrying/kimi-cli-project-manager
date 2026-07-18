import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useI18n } from '../i18n';

interface AddProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: { name: string; path: string; description?: string }) => Promise<void>;
}

export function AddProjectDialog({ isOpen, onClose, onAdd }: AddProjectDialogProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPath('');
      setDescription('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pickDirectory = async () => {
    try {
      const selected = await open({ directory: true });
      if (typeof selected === 'string') {
        setPath(selected);
        if (!name) {
          const parts = selected.replace(/\\/g, '/').split('/');
          setName(parts[parts.length - 1] || '');
        }
      }
    } catch {
      // User cancelled or dialog failed; ignore.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) return;
    try {
      await onAdd({ name, path, description: description || undefined });
      onClose();
    } catch {
      // Error is stored in the app store and surfaced via toast/alert elsewhere.
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-project-title"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl">
        <h2 id="add-project-title" className="mb-4 text-xl font-bold text-[#ffffff]">
          {t('dialog.addTitle')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="add-project-name" className="mb-1 block text-sm text-[#ffffff99]">
              {t('dialog.name')}
            </label>
            <input
              id="add-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#161616] px-3 py-2 text-[#ffffff] outline-none focus:border-[#1783ff] focus:ring-1 focus:ring-[#1783ff]/50"
              required
            />
          </div>
          <div>
            <label htmlFor="add-project-path" className="mb-1 block text-sm text-[#ffffff99]">
              {t('dialog.path')}
            </label>
            <div className="flex gap-2">
              <input
                id="add-project-path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-[#161616] px-3 py-2 text-[#ffffff] outline-none focus:border-[#1783ff] focus:ring-1 focus:ring-[#1783ff]/50"
                required
              />
              <button
                type="button"
                onClick={pickDirectory}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#ffffff] hover:bg-white/10"
              >
                {t('dialog.browse')}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="add-project-description" className="mb-1 block text-sm text-[#ffffff99]">
              {t('dialog.description')}
            </label>
            <input
              id="add-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#161616] px-3 py-2 text-[#ffffff] outline-none focus:border-[#1783ff] focus:ring-1 focus:ring-[#1783ff]/50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#ffffff] hover:bg-white/10"
            >
              {t('dialog.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-[#1783ff] to-[#258eff] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-black/20 hover:from-[#258eff] hover:to-[#1a88ff]"
            >
              {t('dialog.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
