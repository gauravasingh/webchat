export async function POST(request: Request) {
  try {
    const { message, model = 'openai' } = await request.json();

    let response: string;
    let apiUrl: string;
    let headers: Record<string, string>;
    let body: any;

    if (model === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      };
      body = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      };
    } else if (model === 'mistral') {
      apiUrl = 'https://api.mistral.ai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      };
      body = {
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: message }],
      };
    } else if (model === 'minimax') {
      apiUrl = 'https://api.minimax.chat/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
      };
      body = {
        model: 'abab5.5-chat',
        messages: [{ role: 'user', content: message }],
      };
    } else if (model === 'claude') {
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      };
      body = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: message }],
      };
    } else if (model === 'gemini') {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;
      headers = {
        'Content-Type': 'application/json',
      };
      body = {
        contents: [{ parts: [{ text: message }] }],
      };
    } else if (model === 'grok') {
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      };
      body = {
        model: 'grok-beta',
        messages: [{ role: 'user', content: message }],
      };
    } else if (model === 'llama') {
      apiUrl = 'https://api.together.xyz/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
      };
      body = {
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [{ role: 'user', content: message }],
      };
    } else if (model === 'phi') {
      apiUrl = 'https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct';
      headers = {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
      };
      body = {
        inputs: message,
        parameters: { max_new_tokens: 200 },
      };
    } else {
      return Response.json({ response: 'Unsupported model.' });
    }

    // Check if API key is set
    const apiKeyRequired = ['openai', 'mistral', 'minimax', 'claude', 'grok', 'llama'].includes(model) ? headers['Authorization']?.split(' ')[1] : 
                           model === 'gemini' ? process.env.GOOGLE_API_KEY :
                           model === 'phi' ? process.env.HF_TOKEN : '';
    if (!apiKeyRequired) {
      return Response.json({ response: `${model} API key not configured.` });
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return Response.json({ response: `Error from ${model} API.` });
    }

    const data = await res.json();

    if (model === 'claude') {
      response = data.content[0].text || 'No response';
    } else if (model === 'gemini') {
      response = data.candidates[0].content.parts[0].text || 'No response';
    } else if (model === 'phi') {
      response = data[0].generated_text || 'No response';
    } else {
      response = data.choices[0].message.content || 'No response';
    }

    return Response.json({ response });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to get response' }, { status: 500 });
  }
}