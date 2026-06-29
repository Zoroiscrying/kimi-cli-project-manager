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
              aria-label={`Delete ${project.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
