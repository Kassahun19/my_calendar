import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini AI endpoint for AI Horizon Coach
  app.post('/api/ai-plan', async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Please add your Gemini API key in the secrets panel.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are Cadence AI, an elite productivity and strategic life coach. 
The user wants to achieve this goal or focus: "${prompt}".
Generate a comprehensive multi-horizon plan spanning these 6 horizons:
- day (Daily action)
- week (Weekly milestone)
- month (Monthly objective)
- quarter (Quarterly milestone)
- half (Half-year ambition)
- year (Annual vision)

Return ONLY valid JSON with no markdown formatting or backticks, structured exactly as:
{
  "summary": "Short inspiring overview of this goal plan",
  "plans": [
    {
      "t": "Task or milestone title (max 140 chars)",
      "h": "day | week | month | quarter | half | year",
      "p": 1 or 2 or 3 (priority: 1=Low, 2=Medium, 3=High),
      "g": "Tag name (e.g. Work, Health, Money, Growth, Life)",
      "n": "Detailed notes or steps",
      "sub": [{"t": "Subtask 1"}, {"t": "Subtask 2"}]
    }
  ]
}`
              }
            ]
          }
        ]
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      res.json(data);
    } catch (error: any) {
      console.error('AI plan error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate AI plan' });
    }
  });

  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
