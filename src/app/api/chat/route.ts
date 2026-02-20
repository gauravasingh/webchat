export async function POST(request: Request) {
  try {
    const { message, model = 'openai' } = await request.json();

    // Configuration for different LLM providers
    const modelsConfig: Record<string, {
      apiUrl: string;
      headers: Record<string, string>;
      body: any;
      responsePath: string[];
      apiKeyEnv: string;
    }> = {
      openai: {
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }],
        },
        responsePath: ['choices', 0, 'message', 'content'],
        apiKeyEnv: 'OPENAI_API_KEY',
      },
      mistral: {
        apiUrl: 'https://api.mistral.ai/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: {
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: message }],
        },
        responsePath: ['choices', 0, 'message', 'content'],
        apiKeyEnv: 'MISTRAL_API_KEY',
      },
      minimax: {
        apiUrl: 'https://api.minimax.chat/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
        },
        body: {
          model: 'abab5.5-chat',
          messages: [{ role: 'user', content: message }],
        },
        responsePath: ['choices', 0, 'message', 'content'],
        apiKeyEnv: 'MINIMAX_API_KEY',
      },
      claude: {
        apiUrl: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: message }],
        },
        responsePath: ['content', 0, 'text'],
        apiKeyEnv: 'ANTHROPIC_API_KEY',
      },
      gemini: {
        apiUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          contents: [{ parts: [{ text: message }] }],
        },
        responsePath: ['candidates', 0, 'content', 'parts', 0, 'text'],
        apiKeyEnv: 'GOOGLE_API_KEY',
      },
      grok: {
        apiUrl: 'https://api.x.ai/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: {
          model: 'grok-beta',
          messages: [{ role: 'user', content: message }],
        },
        responsePath: ['choices', 0, 'message', 'content'],
        apiKeyEnv: 'XAI_API_KEY',
      },
      llama: {
        apiUrl: 'https://api.together.xyz/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        },
        body: {
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
          messages: [{ role: 'user', content: message }],
        },
        responsePath: ['choices', 0, 'message', 'content'],
        apiKeyEnv: 'TOGETHER_API_KEY',
      },
      phi: {
        apiUrl: 'https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        },
        body: {
          inputs: message,
          parameters: { max_new_tokens: 200 },
        },
        responsePath: [0, 'generated_text'],
        apiKeyEnv: 'HF_TOKEN',
      },
    };

    const config = modelsConfig[model];
    if (!config) {
      return Response.json({ response: 'Unsupported model.' });
    }

    // Check if API key is set
    if (!process.env[config.apiKeyEnv]) {
      return Response.json({ response: `${model} API key not configured.` });
    }

    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(config.body),
    });

    if (!res.ok) {
      return Response.json({ response: `Error from ${model} API.` });
    }

    const data = await res.json();

    // Extract response using the path
    let response: any = data;
    for (const key of config.responsePath) {
      response = response?.[key];
    }
    response = response || 'No response';

    return Response.json({ response });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to get response' }, { status: 500 });
  }
}