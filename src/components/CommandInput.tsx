import { useState, useRef, useEffect } from 'react';
import type { SessionStatus } from './StatusDot';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
  status?: SessionStatus | 'none';
}

export function CommandInput({
  onSubmit,
  disabled = false,
  placeholder = '输入命令发送到终端...',
  status = 'none',
}: CommandInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full items-center gap-2 border-t border-white/5 bg-[#0f0c17] px-4 py-2"
    >
      {status !== 'none' && (
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium ${
            status === 'running'
              ? 'border-white/10 bg-black text-white'
              : status === 'completed'
              ? 'border-blue-500/20 bg-blue-500/10 text-blue-300'
              : 'border-white/10 bg-white/10 text-[#d4c8e8]'
          }`}
          title={
            status === 'running'
              ? 'Kimi CLI 正在运行'
              : status === 'completed'
              ? 'Kimi CLI 已结束'
              : 'Kimi CLI 未启动'
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'running'
                ? 'animate-pulse bg-white'
                : status === 'completed'
                ? 'bg-blue-400'
                : 'bg-white/70'
            }`}
          />
          {status === 'running' ? '运行中' : status === 'completed' ? '已完成' : '未开始'}
        </div>
      )}
      <div className="flex h-10 flex-1 items-center rounded-full border border-white/10 bg-[#151222] px-4 focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]/50">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? '先选择一个项目' : placeholder}
          className="h-full w-full bg-transparent text-sm text-[#e8e2f0] placeholder-[#7d7196] outline-none disabled:text-[#5e5670]"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-lg shadow-purple-900/20 hover:from-[#6d28d9] hover:to-[#4338ca] disabled:cursor-not-allowed disabled:from-[#2d264d] disabled:to-[#2d264d] disabled:text-[#7d7196]"
        aria-label="发送命令"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M3.105 2.289a.75.75 0 00-.826.95l1.832 6.12H9.75a.75.75 0 010 1.5H4.111l-1.832 6.12a.75.75 0 00.826.95l15.5-7.25a.75.75 0 000-1.36l-15.5-7.25z" />
        </svg>
      </button>
    </form>
  );
}
