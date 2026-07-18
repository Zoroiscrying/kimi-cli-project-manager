import { open } from '@tauri-apps/plugin-shell';
import type { Project, Session } from '../types';
import type { SessionStatus } from './StatusDot';

interface RightPanelProps {
  project: Project | null;
  sessions: Session[];
  status?: SessionStatus | 'none';
  onOpenKimi?: () => void;
  onEdit?: () => void;
  onCollapse?: () => void;
  onRefresh?: () => void;
}

export function RightPanel({
  project,
  sessions,
  status = 'none',
  onOpenKimi,
  onEdit,
  onCollapse,
  onRefresh,
}: RightPanelProps) {
  const projectSessions = project
    ? sessions.filter((s) => s.projectId === project.id).slice(-10).reverse()
    : [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f5f5f5]">
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-black/5 px-4">
        <h2 className="text-sm font-semibold text-[#000000e6]">环境信息</h2>
        <button
          onClick={onCollapse}
          className="rounded-md p-1.5 text-[#00000099] hover:bg-black/5 hover:text-black"
          aria-label="收起右侧面板"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!project ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-[#00000073]">选择一个项目以查看详情</p>
          </div>
        ) : (
          <div className="space-y-6">
            {status !== 'none' && (
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#00000073]">
                  状态
                </h3>
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium ${
                    status === 'running'
                      ? 'border-[#985ffb]/25 bg-[#985ffb]/10 text-[#8a4df0]'
                      : status === 'completed'
                      ? 'border-[#1783ff]/20 bg-[#1783ff]/10 text-[#1783ff]'
                      : 'border-black/10 bg-black/5 text-[#00000099]'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status === 'running'
                        ? 'animate-pulse bg-[#985ffb]'
                        : status === 'completed'
                        ? 'bg-[#1783ff]'
                        : 'bg-black/30'
                    }`}
                  />
                  {status === 'running'
                    ? 'Kimi 正在运行…'
                    : status === 'completed'
                    ? 'Kimi 已结束'
                    : 'Kimi 未启动'}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#00000073]">
                项目
              </h3>
              <div className="rounded-2xl border border-black/5 bg-[#ffffff] p-4">
                <p className="text-base font-semibold text-[#000000e6]">{project.name}</p>
                <p className="mt-1 break-all text-xs text-[#00000073]" title={project.path}>
                  {project.path}
                </p>
                {project.description && (
                  <p className="mt-3 text-sm leading-relaxed text-[#00000099]">
                    {project.description}
                  </p>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#985ffb]/20 px-2.5 py-0.5 text-xs text-[#8a4df0]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenKimi}
                className="rounded-xl bg-gradient-to-r from-[#985ffb] to-[#a16bff] px-3 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/20 hover:from-[#935cf3] hover:to-[#905aee]"
              >
                在 Kimi 中打开
              </button>
              <button
                onClick={onEdit}
                className="rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-sm font-medium text-[#000000e6] hover:bg-black/10"
              >
                编辑项目
              </button>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#00000073]">
                最近会话
              </h3>
              {projectSessions.length === 0 ? (
                <p className="text-sm text-[#00000073]">暂无会话记录。</p>
              ) : (
                <ul className="space-y-2">
                  {projectSessions.map((session) => (
                    <li
                      key={session.id}
                      className="rounded-2xl border border-black/5 bg-[#ffffff] p-3"
                    >
                      <p className="text-xs text-[#000000e6]">
                        {new Date(session.startedAt).toLocaleString('zh-CN')}
                      </p>
                      {session.command && (
                        <p className="mt-1 font-mono text-xs text-[#00000073]">
                          {session.command}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#00000073]">
                工具
              </h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => project && open(project.path)}
                  className="w-full rounded-xl border border-black/5 bg-[#ffffff] px-3 py-2 text-left text-xs text-[#00000099] hover:bg-[#eeeeee]"
                >
                  打开文件夹
                </button>
                <button
                  onClick={() => project && navigator.clipboard.writeText(project.path)}
                  className="w-full rounded-xl border border-black/5 bg-[#ffffff] px-3 py-2 text-left text-xs text-[#00000099] hover:bg-[#eeeeee]"
                >
                  复制项目路径
                </button>
                <button
                  onClick={onRefresh}
                  className="w-full rounded-xl border border-black/5 bg-[#ffffff] px-3 py-2 text-left text-xs text-[#00000099] hover:bg-[#eeeeee]"
                >
                  刷新窗口渲染
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
