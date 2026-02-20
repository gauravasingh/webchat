# Web-Based Chat Interface Assistant

A Next.js application that provides a web-based chat interface for interacting with AI assistants powered by multiple LLM providers including OpenAI, Mistral, and Minimax.

## Features

- Real-time chat interface
- Support for multiple LLM providers: OpenAI (GPT-3.5), Mistral Large, Minimax ABAB5.5, Anthropic Claude, Google Gemini, xAI Grok, Meta Llama 3.1, Microsoft Phi-3
- Model selection dropdown
- Responsive design with Tailwind CSS
- TypeScript support

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository or navigate to the project directory.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API keys:
   Copy the `.env.example` file to `.env.local` and fill in your actual API keys:
   ```
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your keys.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Type your message in the input field at the bottom of the chat interface.
- Press Enter or click the Send button to send your message.
- The AI assistant will respond with a generated reply.

## Project Structure

- `src/app/page.tsx`: Main chat interface component
- `src/app/api/chat/route.ts`: API endpoint for handling chat requests
- `src/app/layout.tsx`: Root layout component

## Build

To build the project for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Technologies Used

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- OpenAI API

## License

This project is licensed under the MIT License.
