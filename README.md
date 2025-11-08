# Simple AI Chat

A simple chat application powered by Anthropic's Claude AI. Built with Next.js.

## Features

- 💬 Real-time chat with Claude AI
- ⚡ Built with Next.js 16 (App Router)
- 🎨 Styled with SCSS modules
- 📝 Structured logging with Pino
- 🔒 Type-safe with TypeScript

## Getting Started

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the root directory:

```bash
ANTHROPIC_API_KEY=your_api_key_here
NODE_ENV=development
LOG_LEVEL=info
```

To obtain an API key, visit [Anthropic Console](https://console.anthropic.com/).

## Development Mode

Run the development server with hot-reload:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app includes:
- Frontend React components with automatic hot reload
- API route at `/api/ask` for Claude integration
- Structured logging for debugging

## Production Mode

### 1. Build the application

```bash
npm run build
```

This creates an optimized production build.

### 2. Start the production server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── app/
│   ├── api/ask/         # API route for Claude integration
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   └── Chat/            # Chat component
├── lib/
│   └── logger.ts        # Pino logger configuration
└── .env.local           # Environment variables (not in git)
```
