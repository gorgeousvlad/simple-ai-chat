import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response, NextFunction } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port: number = 3000;

// CORS middleware - allow requests from frontend
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

// Logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// Error handling for JSON parsing
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('[ERROR] Invalid JSON:', err.message);
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  _next();
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AskRequestBody {
  question: string;
}

interface AskResponse {
  answer: string;
}

interface ErrorResponse {
  error: string;
}

interface HealthResponse {
  status: string;
  endpoint: string;
}

// API endpoint for health check
app.get('/api/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'Server is running',
    endpoint: 'POST /ask with {"question": "your question"}',
  });
});

// API endpoint for asking Claude
app.post(
  '/ask',
  async (
    req: Request<unknown, AskResponse | ErrorResponse, AskRequestBody>,
    res: Response<AskResponse | ErrorResponse>
  ) => {
    const timestamp = new Date().toISOString();
    try {
      const { question } = req.body;

      if (!question) {
        console.warn(`[${timestamp}] [WARN] Missing question in request body`);
        return res.status(400).json({ error: 'Question is required' });
      }

      console.log(`[${timestamp}] [INFO] Processing question: "${question.substring(0, 50)}..."`);

      const startTime = Date.now();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: question }],
      });
      const duration = Date.now() - startTime;

      console.log(`[${timestamp}] [INFO] Claude API response received in ${duration}ms`);

      const textContent = response.content[0];
      if (textContent.type === 'text') {
        console.log(
          `[${timestamp}] [INFO] Sending response (${textContent.text.length} characters)`
        );
        res.json({
          answer: textContent.text,
        });
      } else {
        console.error(`[${timestamp}] [ERROR] Unexpected response type: ${textContent.type}`);
        res.status(500).json({ error: 'Unexpected response format from Claude' });
      }
    } catch (error) {
      console.error(`[${timestamp}] [ERROR] Exception in /ask endpoint:`);
      if (error instanceof Error) {
        console.error(`[${timestamp}] [ERROR] Message: ${error.message}`);
        console.error(`[${timestamp}] [ERROR] Stack: ${error.stack}`);
      } else {
        console.error(`[${timestamp}] [ERROR] Unknown error:`, error);
      }

      // Check for specific Anthropic API errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status?: number; message?: string };
        if (apiError.status === 401) {
          console.error(`[${timestamp}] [ERROR] Authentication failed - check ANTHROPIC_API_KEY`);
          return res.status(500).json({ error: 'API authentication failed' });
        } else if (apiError.status === 429) {
          console.error(`[${timestamp}] [ERROR] Rate limit exceeded`);
          return res.status(429).json({ error: 'Rate limit exceeded, please try again later' });
        }
      }

      res.status(500).json({ error: 'Failed to get response from Claude' });
    }
  }
);

// Serve static files from the client build directory (AFTER API routes)
const clientBuildPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientBuildPath));

// Serve the React app for all other GET routes (SPA fallback) - MUST BE LAST
// For Express 5, we need to handle both root and nested paths separately
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Check for API key on startup
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[ERROR] ANTHROPIC_API_KEY is not set in environment variables');
  console.error('[ERROR] Please create a .env file with ANTHROPIC_API_KEY=your_api_key');
  process.exit(1);
}

app.listen(port, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [INFO] ========================================`);
  console.log(`[${timestamp}] [INFO] Claude API server started successfully`);
  console.log(`[${timestamp}] [INFO] Server: http://localhost:${port}`);
  console.log(`[${timestamp}] [INFO] Client app: http://localhost:${port}/`);
  console.log(`[${timestamp}] [INFO] Health check: GET http://localhost:${port}/api/health`);
  console.log(`[${timestamp}] [INFO] Ask endpoint: POST http://localhost:${port}/ask`);
  console.log(`[${timestamp}] [INFO] Static files: ${clientBuildPath}`);
  console.log(`[${timestamp}] [INFO] ========================================`);
});
