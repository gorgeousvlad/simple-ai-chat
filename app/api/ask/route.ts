import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question) {
      logger.warn('Missing question in request body');
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
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
      return NextResponse.json({ answer: textContent.text });
    } else {
      logger.error({ responseType: textContent.type }, 'Unexpected response type from Claude');
      return NextResponse.json(
        { error: 'Unexpected response format from Claude' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error({ err: error }, 'Exception in /ask endpoint');

    // Check for specific Anthropic API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message?: string };
      if (apiError.status === 401) {
        logger.error('Authentication failed - check ANTHROPIC_API_KEY');
        return NextResponse.json({ error: 'API authentication failed' }, { status: 500 });
      } else if (apiError.status === 429) {
        logger.error('Rate limit exceeded');
        return NextResponse.json(
          { error: 'Rate limit exceeded, please try again later' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json({ error: 'Failed to get response from Claude' }, { status: 500 });
  }
}
