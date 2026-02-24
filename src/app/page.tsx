'use client';

import { useCallback, useMemo, useState } from 'react';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

const MODELS = [
  { id: 'openai', label: 'OpenAI GPT-3.5' },
  { id: 'mistral', label: 'Mistral Large' },
  { id: 'minimax', label: 'Minimax ABAB5.5' },
  { id: 'claude', label: 'Anthropic Claude' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'grok', label: 'xAI Grok' },
  { id: 'llama', label: 'Meta Llama 3.1' },
  { id: 'phi', label: 'Microsoft Phi-3' },
] as const;

function createId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('openai');

  const hasMessages = messages.length > 0;
  const conversationTitle = useMemo(() => {
    const firstUser = messages.find((m) => m.role === 'user');
    if (!firstUser) return 'New conversation';
    const snippet =
      firstUser.content.length > 60
        ? `${firstUser.content.slice(0, 57).trimEnd()}…`
        : firstUser.content;
    return snippet || 'Conversation';
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const now = new Date().toISOString();
    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: input,
      createdAt: now,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, model: selectedModel }),
      });
      const data = await res.json();
      const assistantMessage: Message = {
        id: createId(),
        role: 'assistant',
        content: data.response || 'Error',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: createId(),
        role: 'assistant',
        content: 'Sorry, something went wrong.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedModel]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void sendMessage();
      return;
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[color:var(--border-subtle)] bg-[color:var(--background-elevated)]/80 backdrop-blur-md">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-[color:var(--accent-soft)] flex items-center justify-center text-xs font-semibold text-[color:var(--accent-strong)]">
            AI
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)] truncate">
                LLM Playground
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-full border border-[color:var(--border-subtle)] bg-white/70 px-2.5 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)] uppercase tracking-wide">
                Multi‑model
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[color:var(--muted-foreground)] truncate">
              A clean, focused interface for exploring AI models.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="hidden sm:inline-flex items-center rounded-full border border-[color:var(--border-subtle)] bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[color:var(--foreground)] shadow-sm hover:bg-white transition"
          >
            New chat
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[color:var(--muted-foreground)]">Model</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              aria-label="Active model"
              className="mt-0.5 rounded-full border border-[color:var(--border-subtle)] bg-white/80 px-3 py-1 text-xs text-[color:var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-strong)]"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="chat-shell">
        <aside className="chat-sidebar hidden md:flex flex-col px-5 py-5 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-[color:var(--muted-foreground)] uppercase tracking-wide">
                Session
              </h2>
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center rounded-full border border-[color:var(--border-subtle)] bg-white px-2.5 py-0.5 text-[11px] text-[color:var(--foreground)] hover:bg-[color:var(--background-muted)] transition"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)] leading-relaxed line-clamp-3">
              {conversationTitle}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[color:var(--foreground)]">
                Temperature
              </span>
              <span className="text-[11px] text-[color:var(--muted-foreground)]">
                Coming soon
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[rgba(210,213,219,0.5)] overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-[color:var(--accent-soft)]" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[color:var(--foreground)]">
                System prompt
              </span>
              <span className="text-[11px] text-[color:var(--muted-foreground)]">Optional</span>
            </div>
            <p className="text-[11px] text-[color:var(--muted-foreground)] leading-relaxed">
              Configure how the assistant behaves. A full prompt editor and presets will live
              here.
            </p>
          </div>
        </aside>

        <section className="chat-main">
          <div className="chat-messages">
            {!hasMessages && !loading && (
              <div className="h-full flex items-center justify-center">
                <div className="max-w-md text-center">
                  <p className="text-xs font-semibold tracking-wide text-[color:var(--muted-foreground)] uppercase mb-1.5">
                    Ready when you are
                  </p>
                  <h2 className="text-xl font-semibold text-[color:var(--foreground)] mb-2">
                    Ask anything across your favorite models.
                  </h2>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    Start typing below or press{' '}
                    <kbd className="inline-flex items-center rounded border border-slate-700/80 bg-slate-900/80 px-1 text-[11px] font-medium text-slate-200">
                      Ctrl
                      <span className="mx-0.5">/</span>
                      ⌘
                    </kbd>{' '}
                    +
                    <kbd className="inline-flex items-center rounded border border-slate-700/80 bg-slate-900/80 px-1 text-[11px] font-medium text-slate-200 ml-0.5">
                      Enter
                    </kbd>{' '}
                    to send.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-[color:var(--accent-strong)] text-white border-transparent'
                      : 'bg-white text-[color:var(--foreground)] border-[color:var(--border-subtle)]'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 opacity-80">
                    <span className="text-[10px] uppercase tracking-wide">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className="text-[10px] text-[color:var(--muted-foreground)]">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="mb-4 flex justify-start">
                <div className="max-w-[70%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-[color:var(--border-subtle)] text-[color:var(--foreground)] shadow-sm">
                  <div className="typing-indicator">
                    <span className="typing-indicator-dot" />
                    <span className="typing-indicator-dot" />
                    <span className="typing-indicator-dot" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-composer px-5 py-3">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:outline-none"
                  placeholder="Send a message…"
                />
                <div className="flex items-center justify-between border-t border-[color:var(--border-subtle)] px-3 py-2">
                  <p className="text-[11px] text-[color:var(--muted-foreground)]">
                    Press{' '}
                    <kbd className="inline-flex items-center rounded border border-[color:var(--border-subtle)] bg-[color:var(--background-muted)] px-1 text-[10px] font-medium text-[color:var(--foreground)]">
                      Ctrl
                    </kbd>{' '}
                    /
                    <kbd className="inline-flex items-center rounded border border-[color:var(--border-subtle)] bg-[color:var(--background-muted)] px-1 text-[10px] font-medium text-[color:var(--foreground)] ml-0.5">
                      ⌘
                    </kbd>{' '}
                    +
                    <kbd className="inline-flex items-center rounded border border-[color:var(--border-subtle)] bg-[color:var(--background-muted)] px-1 text-[10px] font-medium text-[color:var(--foreground)] ml-0.5">
                      Enter
                    </kbd>{' '}
                    to send.
                  </p>
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={loading || !input.trim()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent-strong)] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                  >
                    <span>{loading ? 'Sending…' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
