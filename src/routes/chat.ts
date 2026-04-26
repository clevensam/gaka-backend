import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  parts?: { text: string }[];
  content?: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  systemInstruction?: string;
}

router.post('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages, systemInstruction } = req.body as ChatRequestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: { message: 'Messages array is required and cannot be empty.' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing');
      return res.status(500).json({
        error: { message: 'GEMINI_API_KEY is not configured on the server.' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: msg.parts || [{ text: msg.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    res.json({ text: response.text, user: req.user });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ error: { message: errorMessage } });
  }
});

export default router;