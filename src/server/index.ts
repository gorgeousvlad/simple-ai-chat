import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port: number = 3000;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, path: req.path }, 'HTTP Request');
  next();
});

app.use(express.json());

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    logger.error({ err: err.message }, 'Invalid JSON in request body');
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

app.get('/api/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'Server is running',
    endpoint: 'POST /ask with {"question": "your question"}',
  });
});

app.post(
  '/ask',
  async (
    req: Request<unknown, AskResponse | ErrorResponse, AskRequestBody>,
    res: Response<AskResponse | ErrorResponse>
  ) => {
    try {
      const { question } = req.body;

      if (!question) {
        logger.warn('Missing question in request body');
        return res.status(400).json({ error: 'Question is required' });
      }

      logger.info({ questionPreview: question.substring(0, 50) }, 'Processing question');

      const startTime = Date.now();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: question }],
      });
      const duration = Date.now() - startTime;

      logger.info({ duration }, 'Claude API response received');

      const textContent = response.content[0];
      if (textContent.type === 'text') {
        logger.info({ responseLength: textContent.text.length }, 'Sending response');
        res.json({
          answer: textContent.text,
        });
      } else {
        logger.error({ responseType: textContent.type }, 'Unexpected response type from Claude');
        res.status(500).json({ error: 'Unexpected response format from Claude' });
      }
    } catch (error) {
      logger.error({ err: error }, 'Exception in /ask endpoint');

      // Check for specific Anthropic API errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status?: number; message?: string };
        if (apiError.status === 401) {
          logger.error('Authentication failed - check ANTHROPIC_API_KEY');
          return res.status(500).json({ error: 'API authentication failed' });
        } else if (apiError.status === 429) {
          logger.error('Rate limit exceeded');
          return res.status(429).json({ error: 'Rate limit exceeded, please try again later' });
        }
      }

      res.status(500).json({ error: 'Failed to get response from Claude' });
    }
  }
);

const clientBuildPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientBuildPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

if (!process.env.ANTHROPIC_API_KEY) {
  logger.error('ANTHROPIC_API_KEY is not set in environment variables');
  logger.error('Please create a .env file with ANTHROPIC_API_KEY=your_api_key');
  process.exit(1);
}

app.listen(port, () => {
  logger.info('========================================');
  logger.info('Claude API server started successfully');
  logger.info({ url: `http://localhost:${port}` }, 'Server');
  logger.info({ url: `http://localhost:${port}/` }, 'Client app');
  logger.info({ url: `http://localhost:${port}/api/health` }, 'Health check endpoint');
  logger.info({ url: `http://localhost:${port}/ask` }, 'Ask endpoint');
  logger.info({ path: clientBuildPath }, 'Static files');
  logger.info('========================================');
});
