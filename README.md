# Web-Based Chat Interface Assistant

A Next.js application that provides a web-based chat interface for interacting with AI assistants powered by multiple LLM providers. Supports OpenAI, Mistral, Minimax, Anthropic Claude, Google Gemini, xAI Grok, Meta Llama 3.1, and Microsoft Phi-3.

## Features

- **Configurable Multi-LLM Support**: Easily add and configure support for various LLM providers through a centralized configuration
  - Currently supports: OpenAI GPT-3.5, Mistral Large, Minimax ABAB5.5, Anthropic Claude 3.5 Sonnet, Google Gemini 1.5 Flash, xAI Grok Beta, Meta Llama 3.1 (via Together AI), and Microsoft Phi-3 (via Hugging Face)
  - Extensible: Add new LLM providers by updating the configuration object
- **Real-time Chat Interface**: Interactive chat with streaming responses
- **Model Selection Dropdown**: Easily switch between configured LLM providers
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **TypeScript Support**: Full type safety throughout the application
- **Environment Configuration**: Simple `.env.local` setup for API keys

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Building & Deployment](#building--deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before getting started, ensure you have:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- At least one API key from the supported LLM providers

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd d:\LLM_projects\web-based chat interface\webchat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   This will install all required packages including Next.js, React, TypeScript, and Tailwind CSS.

3. **Verify installation**:
   ```bash
   npm run build
   ```
   Ensure there are no compilation errors.

## Configuration

### Setting Up API Keys

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your API keys**:
   ```
   # OpenAI
   OPENAI_API_KEY=sk-...

   # Mistral AI
   MISTRAL_API_KEY=...

   # Minimax
   MINIMAX_API_KEY=...

   # Anthropic
   ANTHROPIC_API_KEY=sk-ant-...

   # Google
   GOOGLE_API_KEY=...

   # xAI
   XAI_API_KEY=...

   # Together AI (for Llama)
   TOGETHER_API_KEY=...

   # Hugging Face (for Phi-3)
   HF_TOKEN=hf_...
   ```

### Obtaining API Keys

- **OpenAI**: Visit [OpenAI API](https://platform.openai.com/api-keys)
- **Mistral**: Visit [Mistral AI Platform](https://console.mistral.ai/)
- **Minimax**: Visit [Minimax API](https://api.minimax.chat/)
- **Anthropic**: Visit [Anthropic Console](https://console.anthropic.com/)
- **Google**: Visit [Google AI Studio](https://aistudio.google.com/)
- **xAI**: Visit [xAI Console](https://console.x.ai/)
- **Together AI**: Visit [Together AI Platform](https://www.together.ai/)
- **Hugging Face**: Visit [Hugging Face Tokens](https://huggingface.co/settings/tokens)

## Usage

### Running the Development Server

Start the development server with hot-reload:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Using the Chat Interface

1. **Select a Model**: Use the dropdown menu in the header to choose your preferred LLM provider
2. **Type Your Message**: Enter your question or prompt in the input field
3. **Send Message**: Either press Enter or click the Send button
4. **Wait for Response**: The assistant will process your message and display the response
5. **Continue Chatting**: Messages are kept in the chat history for context

### Tips

- Each LLM provider has different strengths. Try different models for comparison.
- Some models may have rate limits. Check your provider's documentation.
- Keep your API keys secure and never commit `.env.local` to version control.
- The chat history is stored in the browser's state and will be cleared on page refresh.

## Project Structure

```
webchat/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main chat interface component
│   │   ├── layout.tsx               # Root layout component
│   │   ├── globals.css              # Global styles
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts         # Chat API endpoint
│   └── ...
├── public/                          # Static assets
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment variables (git ignored)
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS configuration
└── README.md                        # This file
```

## API Integration

### Chat API Endpoint

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "Your message here",
  "model": "openai"
}
```

**Model Options** (configurable in `modelsConfig`):
- `openai` - OpenAI GPT-3.5
- `mistral` - Mistral Large
- `minimax` - Minimax ABAB5.5
- `claude` - Anthropic Claude 3.5 Sonnet
- `gemini` - Google Gemini 1.5 Flash
- `grok` - xAI Grok Beta
- `llama` - Meta Llama 3.1 (via Together AI)
- `phi` - Microsoft Phi-3 (via Hugging Face)
- Additional models can be added by extending the configuration

**Response**:
```json
{
  "response": "Assistant's response text"
}
```

### Adding a New LLM Provider

To add a new LLM provider, update the `modelsConfig` object in `src/app/api/chat/route.ts`:

1. **Add a new entry to the `modelsConfig` object**:
   ```typescript
   newmodel: {
     apiUrl: 'https://api.provider.com/v1/chat/completions',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${process.env.NEW_MODEL_API_KEY}`,
     },
     body: {
       model: 'model-name',
       messages: [{ role: 'user', content: message }],
     },
     responsePath: ['choices', 0, 'message', 'content'],
     apiKeyEnv: 'NEW_MODEL_API_KEY',
   },
   ```

2. **Update the UI** in `src/app/page.tsx` to include the new model in the dropdown:
   ```tsx
   <option value="newmodel">New Model Name</option>
   ```

3. **Add the API key** to `.env.example` and `.env.local`:
   ```
   NEW_MODEL_API_KEY=your_key_here
   ```

4. **Update the documentation** in this README to include the new provider in the list and configuration instructions.

## Building & Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Production Server

After building, start the production server:
```bash
npm start
```

### Deployment Options

- **Vercel** (Recommended): Push to GitHub and deploy directly from Vercel
- **Netlify**: Connect your repository and configure build settings
- **Docker**: Create a Dockerfile for containerization
- **Self-hosted**: Run on your own server using `npm start`

## Troubleshooting

### Issue: "API key not configured"
**Solution**: Ensure all required API keys are in `.env.local` and match the provider names.

### Issue: "Cannot find module"
**Solution**: Run `npm install` to ensure all dependencies are installed.

### Issue: TypeScript compilation errors
**Solution**: Run `npm run build` to check for type errors and fix them.

### Issue: Rate limiting errors
**Solution**: Some providers have rate limits. Check your API quota and wait before retrying.

### Issue: CORS errors in browser
**Solution**: The API calls are made from the backend (server-side), so CORS should not be an issue. If you encounter this, check your Next.js API route configuration.

### Issue: Port 3000 already in use
**Solution**: Use a different port:
```bash
npm run dev -- -p 3001
```

## Environment Variables Reference

| Variable | Provider | Required |
|----------|----------|----------|
| `OPENAI_API_KEY` | OpenAI | No* |
| `MISTRAL_API_KEY` | Mistral | No* |
| `MINIMAX_API_KEY` | Minimax | No* |
| `ANTHROPIC_API_KEY` | Anthropic | No* |
| `GOOGLE_API_KEY` | Google | No* |
| `XAI_API_KEY` | xAI | No* |
| `TOGETHER_API_KEY` | Together AI | No* |
| `HF_TOKEN` | Hugging Face | No* |

*At least one API key is required to use the application.

## Supporting Multiple Models

The application uses a unified API endpoint that handles requests across all supported models. Each provider has its own:
- **Authentication method** (Bearer token, API key header, etc.)
- **Request format** (message structure, model names)
- **Response format** (where to find the generated text)

The backend (`route.ts`) normalizes these differences to provide a consistent interface.

## Performance Considerations

- Responses time varies by model and current load on provider servers
- The UI shows a "Thinking..." indicator while waiting for a response
- Chat history is stored in browser memory; it clears on page refresh

## Security Notes

- Never hardcode API keys in your code
- Use `.env.local` which is git-ignored
- Rotate API keys regularly
- Monitor your API usage to detect unauthorized access

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Future Enhancements

Potential features for future versions:
- Chat history persistence (local storage or database)
- Model comparison mode
- Streaming responses
- Custom system prompts
- User authentication
- API usage analytics
- Dark mode
- Message export

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review API provider documentation
- Open an issue on GitHub

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Integrated with multiple LLM providers
