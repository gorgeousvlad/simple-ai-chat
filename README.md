# Simple AI Chat

A simple chat application powered by Anthropic's Claude AI. Built with React (frontend) and Express (backend).

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file in the root directory:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

To obtain an API key, visit [Anthropic Console](https://console.anthropic.com/).

## Development Mode

Development mode runs the frontend and backend separately with hot-reload capabilities.

**Run backend:**

```bash
npm run dev:server
```

or watch mode:

```bash
npm run watch:server
```

The backend server will start on `http://localhost:3000`

**Run frontend development server:**

```bash
npm run dev:client
```

The frontend will start on `http://localhost:5173`

### Development URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

The Vite dev server proxies `/ask` requests to the backend server automatically.

## Production Mode

Production mode builds both frontend and backend, then serves the frontend as static files from the backend server.

### 1. Build the application

```bash
npm run build
```

This command:

- Compiles TypeScript backend code to `dist/server/`
- Builds optimized React frontend to `dist/client/`

### 2. Start the production server

```bash
npm start
```

The application will be available at `http://localhost:3000`
