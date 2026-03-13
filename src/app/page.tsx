'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

interface ChatSettings {
  temperature: number;
  systemPrompt: string;
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
  const [settings, setSettings] = useState<ChatSettings>({
    temperature: 0.7,
    systemPrompt: '',
  });

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('llm-playground-settings');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        model?: string;
        temperature?: number;
        systemPrompt?: string;
      };
      if (parsed.model) {
        setSelectedModel(parsed.model);
      }
      setSettings((prev) => ({
        temperature: parsed.temperature ?? prev.temperature,
        systemPrompt: parsed.systemPrompt ?? prev.systemPrompt,
      }));
    } catch {
      // ignore malformed settings
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({
      model: selectedModel,
      temperature: settings.temperature,
      systemPrompt: settings.systemPrompt,
    });
    window.localStorage.setItem('llm-playground-settings', payload);
  }, [selectedModel, settings.temperature, settings.systemPrompt]);

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
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          temperature: settings.temperature,
          systemPrompt: settings.systemPrompt || undefined,
          stream: selectedModel === 'openai',
        }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      let responseText: string;

      if (contentType.startsWith('text/plain')) {
        responseText = await res.text();
      } else {
        const data = await res.json();
        responseText = data.response || 'Error';
      }

      const assistantMessage: Message = {
        id: createId(),
        role: 'assistant',
        content: responseText,
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
  }, [
    input,
    loading,
    messages,
    selectedModel,
    settings.temperature,
    settings.systemPrompt,
  ]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event,
  ) => {
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
            <span className="text-[11px] text-[color:var(--muted-foreground)]">
              Model
            </span>
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
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  temperature: Number(event.target.value),
                }))
              }
              className="w-full accent-[color:var(--accent-strong)]"
              aria-label="Sampling temperature"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[color:var(--foreground)]">
                System prompt
              </span>
              <span className="text-[11px] text-[color:var(--muted-foreground)]">
                Optional
              </span>
            </div>
            <textarea
              rows={4}
              value={settings.systemPrompt}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  systemPrompt: event.target.value,
                }))
              }
              placeholder="You are a helpful AI assistant..."
              className="mt-1.5 w-full resize-none rounded-xl border border-[color:var(--border-subtle)] bg-white/70 px-3 py-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent-strong)]"
            />
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
                className={`mb-3 flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`group max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-[color:var(--accent-strong)] text-white border-transparent'
                      : 'bg-white text-[color:var(--foreground)] border-[color:var(--border-subtle)]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match) {
                            return (
                              <div className="relative mt-2 rounded-lg bg-[#111827]">
                                <button
                                  type="button"
                                  className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-100 opacity-0 transition group-hover:opacity-100"
                                  onClick={() => {
                                    navigator.clipboard
                                      .writeText(String(children))
                                      .catch(() => {
                                        // ignore clipboard errors
                                      });
                                  }}
                                >
                                  Copy
                                </button>
                                <SyntaxHighlighter
                                  {...props}
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    margin: 0,
                                    padding: '0.9rem 1rem',
                                    background: 'transparent',
                                  }}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          return (
                            <code {...props} className={className}>
                              {children}
                            </code>
                          );
                        },
                        p({ children }) {
                          return (
                            <p className="mb-1.5 last:mb-0 whitespace-pre-wrap leading-relaxed">
                              {children}
                            </p>
                          );
                        },
                        ul({ children }) {
                          return (
                            <ul className="mb-1.5 ml-4 list-disc space-y-1 text-sm">
                              {children}
                            </ul>
                          );
                        },
                        ol({ children }) {
                          return (
                            <ol className="mb-1.5 ml-4 list-decimal space-y-1 text-sm">
                              {children}
                            </ol>
                          );
                        },
                        a({ children, href }) {
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[color:var(--accent-strong)] underline decoration-[color:var(--accent-soft)] underline-offset-2"
                            >
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-2 opacity-80">
                    <div className="flex items-center gap-2">
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
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="text-[10px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(msg.content)
                              .catch(() => {
                                // ignore clipboard errors
                              });
                          }}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          className="text-[10px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                          onClick={() => {
                            const lastUser = [...messages]
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (!lastUser || loading) return;
                            setInput(lastUser.content);
                          }}
                        >
                          Regenerate
                        </button>
                      </div>
                    )}
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

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

interface ChatSettings {
  temperature: number;
  systemPrompt: string;
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
  const [settings, setSettings] = useState<ChatSettings>({
    temperature: 0.7,
    systemPrompt: '',
  });

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('llm-playground-settings');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        model?: string;
        temperature?: number;
        systemPrompt?: string;
      };
      if (parsed.model) {
        setSelectedModel(parsed.model);
      }
      setSettings((prev) => ({
        temperature: parsed.temperature ?? prev.temperature,
        systemPrompt: parsed.systemPrompt ?? prev.systemPrompt,
      }));
    } catch {
      // ignore malformed settings
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({
      model: selectedModel,
      temperature: settings.temperature,
      systemPrompt: settings.systemPrompt,
    });
    window.localStorage.setItem('llm-playground-settings', payload);
  }, [selectedModel, settings.temperature, settings.systemPrompt]);

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
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          temperature: settings.temperature,
          systemPrompt: settings.systemPrompt || undefined,
          stream: selectedModel === 'openai',
        }),
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
  }, [input, loading, messages, selectedModel, settings.temperature, settings.systemPrompt]);

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
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  temperature: Number(event.target.value),
                }))
              }
              className="w-full accent-[color:var(--accent-strong)]"
              aria-label="Sampling temperature"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[color:var(--foreground)]">
                System prompt
              </span>
              <span className="text-[11px] text-[color:var(--muted-foreground)]">Optional</span>
            </div>
            <textarea
              rows={4}
              value={settings.systemPrompt}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  systemPrompt: event.target.value,
                }))
              }
              placeholder="You are a helpful AI assistant..."
              className="mt-1.5 w-full resize-none rounded-xl border border-[color:var(--border-subtle)] bg-white/70 px-3 py-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent-strong)]"
            />
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
                  className={`group max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-[color:var(--accent-strong)] text-white border-transparent'
                      : 'bg-white text-[color:var(--foreground)] border-[color:var(--border-subtle)]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match) {
                            return (
                              <div className="relative mt-2 rounded-lg bg-[#111827]">
                                <button
                                  type="button"
                                  className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-100 opacity-0 transition group-hover:opacity-100"
                                  onClick={() => {
                                    navigator.clipboard
                                      .writeText(String(children))
                                      .catch(() => {
                                        // ignore clipboard errors
                                      });
                                  }}
                                >
                                  Copy
                                </button>
                                <SyntaxHighlighter
                                  {...props}
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    margin: 0,
                                    padding: '0.9rem 1rem',
                                    background: 'transparent',
                                  }}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          return (
                            <code
                              {...props}
                              className={className}
                            >
                              {children}
                            </code>
                          );
                        },
                        p({ children }) {
                          return (
                            <p className="mb-1.5 last:mb-0 whitespace-pre-wrap leading-relaxed">
                              {children}
                            </p>
                          );
                        },
                        ul({ children }) {
                          return (
                            <ul className="mb-1.5 ml-4 list-disc space-y-1 text-sm">
                              {children}
                            </ul>
                          );
                        },
                        ol({ children }) {
                          return (
                            <ol className="mb-1.5 ml-4 list-decimal space-y-1 text-sm">
                              {children}
                            </ol>
                          );
                        },
                        a({ children, href }) {
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[color:var(--accent-strong)] underline decoration-[color:var(--accent-soft)] underline-offset-2"
                            >
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-2 opacity-80">
                    <div className="flex items-center gap-2">
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
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="text-[10px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(msg.content)
                              .catch(() => {
                                // ignore clipboard errors
                              });
                          }}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          className="text-[10px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                          onClick={() => {
                            const lastUser = [...messages]
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (!lastUser || loading) return;
                            setInput(lastUser.content);
                          }}
                        >
                          Regenerate
                        </button>
                      </div>
                    )}
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
