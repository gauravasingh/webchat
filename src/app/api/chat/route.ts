type ProviderKey =
  | 'openai'
  | 'mistral'
  | 'minimax'
  | 'claude'
  | 'gemini'
  | 'grok'
  | 'llama'
  | 'phi';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  message?: string;
  model?: ProviderKey;
  temperature?: number;
  systemPrompt?: string;
  stream?: boolean;
}

interface ProviderConfig {
  apiUrl: string;
  headers: Record<string, string>;
  apiKeyEnv: string;
}

const providers: Record<ProviderKey, ProviderConfig> = {
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  mistral: {
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    apiKeyEnv: 'MISTRAL_API_KEY',
  },
  minimax: {
    apiUrl: 'https://api.minimax.chat/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
    },
    apiKeyEnv: 'MINIMAX_API_KEY',
  },
  claude: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  gemini: {
    apiUrl:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
      process.env.GOOGLE_API_KEY,
    headers: {
      'Content-Type': 'application/json',
    },
    apiKeyEnv: 'GOOGLE_API_KEY',
  },
  grok: {
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    apiKeyEnv: 'XAI_API_KEY',
  },
  llama: {
    apiUrl: 'https://api.together.xyz/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
    },
    apiKeyEnv: 'TOGETHER_API_KEY',
  },
  phi: {
    apiUrl:
      'https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct',
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
    },
    apiKeyEnv: 'HF_TOKEN',
  },
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const {
      messages,
      message,
      model = 'openai',
      temperature = 0.7,
      systemPrompt,
      stream = false,
    } = body;

    const target = providers[model];
    if (!target) {
      return Response.json({ error: 'Unsupported model.' }, { status: 400 });
    }

    if (!process.env[target.apiKeyEnv]) {
      return Response.json(
        { error: `${model} API key not configured.` },
        { status: 400 },
      );
    }

    const chatMessages: ChatMessage[] =
      messages && messages.length > 0
        ? messages
        : message
        ? [{ role: 'user', content: message }]
        : [];

    if (!chatMessages.length) {
      return Response.json(
        { error: 'No messages provided.' },
        { status: 400 },
      );
    }

    const userFacingMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...chatMessages]
      : chatMessages;

    if (model === 'openai' && stream) {
      const openaiBody = {
        model: 'gpt-3.5-turbo',
        temperature,
        stream: true,
        messages: userFacingMessages,
      };

      const res = await fetch(target.apiUrl, {
        method: 'POST',
        headers: target.headers,
        body: JSON.stringify(openaiBody),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        console.error('openai_error', res.status, text);
        return Response.json(
          { error: 'Error from openai API.' },
          { status: 502 },
        );
      }

      const encoder = new TextEncoder();
      const streamBody = new ReadableStream({
        async start(controller) {
          const reader = res.body!.getReader();
          let assistantText = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = new TextDecoder().decode(value);
              const lines = chunk
                .split('\n')
                .filter((line) => line.trim().startsWith('data:'));
              for (const line of lines) {
                const data = line.replace(/^data:\s*/, '');
                if (data === '[DONE]') continue;
                try {
                  const json = JSON.parse(data);
                  const delta =
                    json.choices?.[0]?.delta?.content ??
                    json.choices?.[0]?.message?.content ??
                    '';
                  if (delta) {
                    assistantText += delta;
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // ignore malformed chunks
                }
              }
            }
          } catch (error) {
            console.error('openai_stream_error', error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamBody, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    const modelsConfig: Record<
      ProviderKey,
      {
        body: any;
        responsePath: (string | number)[];
      }
    > = {
      openai: {
        body: {
          model: 'gpt-3.5-turbo',
          temperature,
          messages: userFacingMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      mistral: {
        body: {
          model: 'mistral-large-latest',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      minimax: {
        body: {
          model: 'abab5.5-chat',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      claude: {
        body: {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: chatMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: [{ type: 'text', text: m.content }],
          })),
        },
        responsePath: ['content', 0, 'text'],
      },
      gemini: {
        body: {
          contents: chatMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        },
        responsePath: ['candidates', 0, 'content', 'parts', 0, 'text'],
      },
      grok: {
        body: {
          model: 'grok-beta',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      llama: {
        body: {
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      phi: {
        body: {
          inputs:
            chatMessages
              .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
              .join('\n\n') ?? '',
          parameters: { max_new_tokens: 200 },
        },
        responsePath: [0, 'generated_text'],
      },
    };

    const modelConfig = modelsConfig[model];

    const res = await fetch(target.apiUrl, {
      method: 'POST',
      headers: target.headers,
      body: JSON.stringify(modelConfig.body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('provider_error', model, res.status, errorText);
      return Response.json(
        { error: `Error from ${model} API.` },
        { status: 502 },
      );
    }

    const data = await res.json();

    // Extract response using the path
    let response: any = data;
    for (const key of modelConfig.responsePath) {
      response = response?.[key as any];
    }
    response = response || 'No response';

    return Response.json({ response });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to get response' }, { status: 500 });
  }
}

type ProviderKey =
  | 'openai'
  | 'mistral'
  | 'minimax'
  | 'claude'
  | 'gemini'
  | 'grok'
  | 'llama'
  | 'phi';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  message?: string;
  model?: ProviderKey;
  temperature?: number;
  systemPrompt?: string;
  stream?: boolean;
}

interface ProviderConfig {
  apiUrl: string;
  headers: Record<string, string>;
  apiKeyEnv: string;
}

const providers: Record<ProviderKey, ProviderConfig> = {
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  mistral: {
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    apiKeyEnv: 'MISTRAL_API_KEY',
  },
  minimax: {
    apiUrl: 'https://api.minimax.chat/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
    },
    apiKeyEnv: 'MINIMAX_API_KEY',
  },
  claude: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  gemini: {
    apiUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    headers: {
      'Content-Type': 'application/json',
    },
    apiKeyEnv: 'GOOGLE_API_KEY',
  },
  grok: {
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    apiKeyEnv: 'XAI_API_KEY',
  },
  llama: {
    apiUrl: 'https://api.together.xyz/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
    },
    apiKeyEnv: 'TOGETHER_API_KEY',
  },
  phi: {
    apiUrl: 'https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct',
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
    },
    apiKeyEnv: 'HF_TOKEN',
  },
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const {
      messages,
      message,
      model = 'openai',
      temperature = 0.7,
      systemPrompt,
      stream = false,
    } = body;

    const target = providers[model];
    if (!target) {
      return Response.json({ error: 'Unsupported model.' }, { status: 400 });
    }

    if (!process.env[target.apiKeyEnv]) {
      return Response.json(
        { error: `${model} API key not configured.` },
        { status: 400 },
      );
    }

    const chatMessages: ChatMessage[] =
      messages && messages.length > 0
        ? messages
        : message
        ? [{ role: 'user', content: message }]
        : [];

    if (!chatMessages.length) {
      return Response.json(
        { error: 'No messages provided.' },
        { status: 400 },
      );
    }

    const userFacingMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...chatMessages]
      : chatMessages;

    if (model === 'openai' && stream) {
      const openaiBody = {
        model: 'gpt-3.5-turbo',
        temperature,
        stream: true,
        messages: userFacingMessages,
      };

      const res = await fetch(target.apiUrl, {
        method: 'POST',
        headers: target.headers,
        body: JSON.stringify(openaiBody),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        console.error('openai_error', res.status, text);
        return Response.json(
          { error: 'Error from openai API.' },
          { status: 502 },
        );
      }

      const encoder = new TextEncoder();
      const streamBody = new ReadableStream({
        async start(controller) {
          const reader = res.body!.getReader();
          let assistantText = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter((line) =>
                line.trim().startsWith('data:'),
              );
              for (const line of lines) {
                const data = line.replace(/^data:\s*/, '');
                if (data === '[DONE]') continue;
                try {
                  const json = JSON.parse(data);
                  const delta =
                    json.choices?.[0]?.delta?.content ??
                    json.choices?.[0]?.message?.content ??
                    '';
                  if (delta) {
                    assistantText += delta;
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // ignore malformed chunks
                }
              }
            }
          } catch (error) {
            console.error('openai_stream_error', error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamBody, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    const modelsConfig: Record<
      ProviderKey,
      {
        body: any;
        responsePath: (string | number)[];
      }
    > = {
      openai: {
        body: {
          model: 'gpt-3.5-turbo',
          temperature,
          messages: userFacingMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      mistral: {
        body: {
          model: 'mistral-large-latest',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      minimax: {
        body: {
          model: 'abab5.5-chat',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      claude: {
        body: {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: chatMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: [{ type: 'text', text: m.content }],
          })),
        },
        responsePath: ['content', 0, 'text'],
      },
      gemini: {
        body: {
          contents: chatMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        },
        responsePath: ['candidates', 0, 'content', 'parts', 0, 'text'],
      },
      grok: {
        body: {
          model: 'grok-beta',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      llama: {
        body: {
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
          messages: chatMessages,
        },
        responsePath: ['choices', 0, 'message', 'content'],
      },
      phi: {
        body: {
          inputs:
            chatMessages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') ??
            '',
          parameters: { max_new_tokens: 200 },
        },
        responsePath: [0, 'generated_text'],
      },
    };

    const modelConfig = modelsConfig[model];

    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: target.headers,
      body: JSON.stringify(modelConfig.body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('provider_error', model, res.status, errorText);
      return Response.json(
        { error: `Error from ${model} API.` },
        { status: 502 },
      );
    }

    const data = await res.json();

    // Extract response using the path
    let response: any = data;
    for (const key of modelConfig.responsePath) {
      response = response?.[key as any];
    }
    response = response || 'No response';

    return Response.json({ response });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to get response' }, { status: 500 });
  }
}