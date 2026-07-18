import { useState } from 'react';
import { SearchBox } from './SearchBox';
import { StatusDot, type SessionStatus } from './StatusDot';
import type { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  collapsed?: boolean;
  getStatus?: (projectId: string) => SessionStatus;
}

export function ProjectList({
  projects,
  selectedId,
  onSelect,
  onDelete,
  collapsed = false,
  getStatus = () => 'not-started',
}: ProjectListProps) {
  const [query, setQuery] = useState('');

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.path.toLowerCase().includes(query.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center gap-2 overflow-auto py-3">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelect(project.id)}
            title={project.name}
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
              selectedId === project.id
                ? 'bg-gradient-to-br from-[#985ffb] to-[#a16bff] text-white'
                : 'bg-black/5 text-[#00000099] hover:bg-black/10 hover:text-black'
            }`}
          >
            {project.name.slice(0, 2).toUpperCase()}
            <span className="absolute -right-0.5 -top-0.5">
              <StatusDot status={getStatus(project.id)} size="sm" />
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <SearchBox value={query} onChange={setQuery} />
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#00000073]">
            {projects.length === 0 ? 'No projects yet.' : 'No projects match your search.'}
          </div>
        ) : (
          filtered.map((project) => (
            <div
              key={project.id}
              tabIndex={0}
              role="button"
              aria-label={project.name}
              aria-pressed={selectedId === project.id}
              onClick={() => onSelect(project.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(project.id);
                }
              }}
              className={`group relative mb-2 flex cursor-pointer items-start justify-between rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#985ffb] ${
                selectedId === project.id
                  ? 'bg-gradient-to-r from-[#985ffb]/20 to-[#a16bff]/10 ring-1 ring-[#985ffb]/50'
                  : 'hover:bg-black/5'
              }`}
            >
              <div className="mr-2 flex shrink-0 items-center pt-0.5">
                <StatusDot status={getStatus(project.id)} size="md" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[#000000e6]">{project.name}</div>
                <div className="truncate text-xs text-[#00000073]">{project.path}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="ml-2 shrink-0 rounded p-1 text-[#00000073] hover:bg-black/10 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-[#985ffb]"
                aria-label={`Delete ${project.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
