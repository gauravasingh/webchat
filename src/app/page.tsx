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
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/70 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-900/40 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-xs font-semibold text-slate-950 shadow-lg shadow-indigo-500/40">
            AI
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                LLM Playground
              </h1>
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 uppercase tracking-wide">
                Multi‑model
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400 truncate">
              Experiment with different frontier models in a single, modern chat surface.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="hidden sm:inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900 transition-colors"
          >
            New chat
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-slate-400">Model</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              aria-label="Active model"
              className="mt-0.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs text-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
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
        <aside className="chat-sidebar hidden md:flex flex-col px-4 py-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                Session
              </h2>
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-200 hover:border-slate-500 hover:bg-slate-900 transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
              {conversationTitle}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">Temperature</span>
              <span className="text-[11px] text-slate-400">Coming soon</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800/90 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 opacity-70" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">System prompt</span>
              <span className="text-[11px] text-slate-500">Optional</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
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
                  <p className="text-xs font-semibold tracking-wide text-indigo-300 uppercase mb-1.5">
                    Ready when you are
                  </p>
                  <h2 className="text-lg font-semibold text-slate-50 mb-2">
                    Ask anything across your favorite models.
                  </h2>
                  <p className="text-sm text-slate-400">
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
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-indigo-500/90 border-indigo-400/80 text-slate-50'
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="mt-1.5 flex items-center gap-2 opacity-70">
                    <span className="text-[10px] uppercase tracking-wide">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className="text-[10px] text-slate-400">
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
                <div className="max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm bg-slate-900/80 border border-slate-700/80 text-slate-100 shadow-sm">
                  <div className="typing-indicator">
                    <span className="typing-indicator-dot" />
                    <span className="typing-indicator-dot" />
                    <span className="typing-indicator-dot" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-composer px-4 py-3">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_18px_60px_rgba(15,23,42,0.9)]">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-slate-50 placeholder:text-slate-500 focus-visible:outline-none"
                  placeholder="Send a message…"
                />
                <div className="flex items-center justify-between border-t border-slate-800/80 px-3 py-2">
                  <p className="text-[11px] text-slate-500">
                    Press{' '}
                    <kbd className="inline-flex items-center rounded border border-slate-700/80 bg-slate-900/80 px-1 text-[10px] font-medium text-slate-200">
                      Ctrl
                    </kbd>{' '}
                    /
                    <kbd className="inline-flex items-center rounded border border-slate-700/80 bg-slate-900/80 px-1 text-[10px] font-medium text-slate-200 ml-0.5">
                      ⌘
                    </kbd>{' '}
                    +
                    <kbd className="inline-flex items-center rounded border border-slate-700/80 bg-slate-900/80 px-1 text-[10px] font-medium text-slate-200 ml-0.5">
                      Enter
                    </kbd>{' '}
                    to send.
                  </p>
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={loading || !input.trim()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-3.5 py-1.5 text-xs font-medium text-slate-50 shadow-lg shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 transition-all"
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
