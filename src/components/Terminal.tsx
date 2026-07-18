import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { CanvasAddon } from '@xterm/addon-canvas';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';
import type { Project } from '../types';
import type { SessionStatus } from './StatusDot';

export interface TerminalHandle {
  sendCommand: (command: string) => void;
  focus: () => void;
}

interface TerminalProps {
  project: Project;
  sessionId: string;
  isActive: boolean;
  onSessionStart?: () => void;
  onSessionStatusChange?: (status: SessionStatus) => void;
}

const ANSI_ESCAPE_RE = /\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[()][0-9A-Z]/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_RE, '');
}

// Kimi CLI is a full-screen TUI: when it is idle it repaints the input box,
// so the bare ">" prompt appears as one of the LAST FEW LINES of the stream
// (followed by the box border and the bottom status bar), never at the very
// end of the output. While it is generating, no bare prompt line exists.
function looksLikePrompt(tail: string): boolean {
  const plain = stripAnsi(tail).replace(/\r/g, '\n');
  const lines = plain
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .slice(-8);
  return lines.some((line) => /^\s*[│┃|]?\s?>█?$/.test(line));
}

// Kimi-inspired purple/blue terminal palette
const TERMINAL_THEME = {
  background: '#121212',
  foreground: '#ffffffd6',
  cursor: '#ffffff',
  black: '#292929',
  brightBlack: '#4d4d4d',
  red: '#f87171',
  brightRed: '#fca5a5',
  green: '#34d399',
  brightGreen: '#6ee7b7',
  yellow: '#fbbf24',
  brightYellow: '#fcd34d',
  blue: '#258eff',
  brightBlue: '#5cadff',
  magenta: '#a16bff',
  brightMagenta: '#c9aaff',
  cyan: '#22d3ee',
  brightCyan: '#67e8f9',
  white: '#ffffffd6',
  brightWhite: '#ffffff',
};

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
  ({ project, sessionId, isActive, onSessionStart, onSessionStatusChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const initializedRef = useRef(false);
    const hasInputRef = useRef(false);
    const outputTailRef = useRef('');
    const userScrolledUpRef = useRef(false);
    const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(ref, () => ({
      sendCommand: (command: string) => {
        const term = terminalRef.current;
        if (!term || !command) return;
        hasInputRef.current = true;
        outputTailRef.current = '';
        onSessionStatusChange?.('running');
        term.write(command);
        term.write('\r');
        invoke('write_terminal', { sessionId, data: command + '\r' }).catch(
          (err) => {
            term.writeln(`\r\n[write error: ${err}]`);
          }
        );
      },
      focus: () => {
        terminalRef.current?.focus();
      },
    }));

    // Initialize the terminal and PTY session the first time this tab becomes active.
    // We intentionally do NOT return a cleanup here: the session must keep running
    // when the tab becomes inactive so the user can switch back without losing state.
    useEffect(() => {
      if (!isActive || !containerRef.current || initializedRef.current) return;
      initializedRef.current = true;

      const term = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
        fontWeight: 400,
        fontWeightBold: 700,
        lineHeight: 1.2,
        theme: TERMINAL_THEME,
        scrollback: 10000,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new CanvasAddon());

      term.open(containerRef.current);
      fitAddon.fit();

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;

      const onDataDisposable = term.onData((data) => {
        hasInputRef.current = true;
        outputTailRef.current = '';
        onSessionStatusChange?.('running');
        invoke('write_terminal', { sessionId, data }).catch((err) => {
          term.writeln(`\r\n[write error: ${err}]`);
        });
      });

      const onScrollDisposable = term.onScroll(() => {
        if (!terminalRef.current) return;
        const atBottom =
          terminalRef.current.buffer.active.viewportY ===
          terminalRef.current.buffer.active.baseY;
        userScrolledUpRef.current = !atBottom;
      });

      let mounted = true;
      let unlisten: UnlistenFn | null = null;

      async function setupSession() {
        unlisten = await listen<{ session_id: string; data: string }>(
          'terminal-output',
          (event) => {
            if (!mounted) return;
            if (
              event.payload.session_id === sessionId &&
              event.payload.data &&
              terminalRef.current
            ) {
              const term = terminalRef.current;
              const wasScrolledUp = userScrolledUpRef.current;
              term.write(event.payload.data);
              if (!wasScrolledUp) {
                requestAnimationFrame(() => {
                  terminalRef.current?.scrollToBottom();
                });
              }
              if (hasInputRef.current) {
                outputTailRef.current += event.payload.data;
                if (outputTailRef.current.length > 4096) {
                  outputTailRef.current = outputTailRef.current.slice(-4096);
                }
                if (looksLikePrompt(outputTailRef.current)) {
                  // Idle frame detected. Confirm with a short quiet period so
                  // mid-stream ">" lines can't cause status flicker.
                  if (completedTimerRef.current) {
                    clearTimeout(completedTimerRef.current);
                  }
                  completedTimerRef.current = setTimeout(() => {
                    completedTimerRef.current = null;
                    onSessionStatusChange?.('completed');
                  }, 800);
                } else {
                  if (completedTimerRef.current) {
                    clearTimeout(completedTimerRef.current);
                    completedTimerRef.current = null;
                  }
                  onSessionStatusChange?.('running');
                }
              }
            }
          }
        );

        try {
          await invoke('start_terminal', { sessionId, cwd: project.path });
          onSessionStart?.();
        } catch (err) {
          onSessionStatusChange?.('completed');
          if (terminalRef.current) {
            terminalRef.current.writeln(`\r\n[failed to start terminal: ${err}]`);
          }
        }
      }
      setupSession();

      cleanupRef.current = () => {
        mounted = false;
        if (completedTimerRef.current) {
          clearTimeout(completedTimerRef.current);
          completedTimerRef.current = null;
        }
        onDataDisposable.dispose();
        onScrollDisposable.dispose();
        unlisten?.();
        invoke('stop_terminal', { sessionId }).catch(() => {});
        term.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
      };
    }, [isActive, project, onSessionStart, onSessionStatusChange]);

    // Fit on actual container size changes; scroll/focus when becoming active.
    useEffect(() => {
      if (!isActive || !containerRef.current || !terminalRef.current || !fitAddonRef.current) {
        terminalRef.current?.blur();
        return;
      }

      const container = containerRef.current;
      let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

      const fitAndResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (!fitAddonRef.current || !terminalRef.current || !containerRef.current) return;
          const { clientWidth, clientHeight } = containerRef.current;
          if (clientWidth === 0 || clientHeight === 0) return;
          fitAddonRef.current.fit();
          const rows = terminalRef.current.rows;
          const cols = terminalRef.current.cols;
          if (rows && cols) {
            invoke('resize_terminal', { sessionId, rows, cols }).catch(() => {});
          }
          requestAnimationFrame(() => {
            terminalRef.current?.scrollToBottom();
          });
        }, 100);
      };

      const ro = new ResizeObserver(fitAndResize);
      ro.observe(container);

      // Aggressively scroll to bottom when the tab becomes visible; xterm's
      // canvas renderer sometimes resets the viewport while hidden or during
      // the first paint after visibility changes.
      const scrollLater = (delay: number) => {
        setTimeout(() => {
          terminalRef.current?.scrollToBottom();
        }, delay);
      };
      scrollLater(0);
      scrollLater(50);
      scrollLater(150);
      scrollLater(300);
      terminalRef.current?.focus();

      return () => {
        ro.disconnect();
        if (resizeTimeout) clearTimeout(resizeTimeout);
      };
    }, [isActive, sessionId]);

    // On unmount (tab closed), tear everything down.
    useEffect(() => {
      return () => {
        cleanupRef.current?.();
        cleanupRef.current = null;
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="h-full w-full"
      />
    );
  }
);

Terminal.displayName = 'Terminal';
