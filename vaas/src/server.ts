import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("⛔️  OPENAI_API_KEY missing in environment");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json({ limit: "25mb" })); // allow large base64 images

// Helper: describe a single image via GPT-Vision
async function describeImage(base64Url: string): Promise<string> {
  // Ensure URL is a proper data URL
  const dataUrl = base64Url.startsWith("data:") ? base64Url : `data:image/png;base64,${base64Url}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // vision-capable model
    max_tokens: 120,
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe the overall mood, colour palette, lighting and style in this image in one concise sentence.",
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}

// Helper: craft aesthetic embedding text from collected descriptions
async function generateAestheticEmbedding(descriptions: string[]): Promise<string> {
  const prompt = `Using the following descriptions of images and text snippets, craft a single, vivid textual embedding that captures the aesthetic essence, mood and style. Use evocative adjectives and nouns, separated by commas, without numbering or line breaks. Limit to 120 words.\n\nDescriptions:\n${descriptions.join("\n")}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 150,
    temperature: 0.7,
    messages: [
      { role: "system", content: "You distill visual and textual input into concise aesthetic embeddings." },
      { role: "user", content: prompt },
    ],
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}

// Helper: turn embedding text into numeric vector (optional)
async function vectorize(text: string): Promise<number[]> {
  const embeddingResp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return embeddingResp.data[0].embedding;
}

// Helper: apply aesthetic embedding onto raw HTML using GPT-4
async function applyAestheticToHtml(html: string, aesthetic: string): Promise<string> {
  // Limit html to 20k chars to fit context
  const snippet = html.slice(0, 20000);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are a senior front-end engineer. You receive an existing HTML document and a high-level aesthetic description. Your task is to modify the HTML so that its visual style (CSS) reflects the aesthetic while keeping structure and functionality intact. You may add <style> blocks or inline styles. Output ONLY the final, complete HTML document with no explanations or markdown code fences.",
      },
      {
        role: "user",
        content: `AESTHETIC:\n${aesthetic}\n\nHTML:\n${snippet}`,
      },
    ],
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}

interface MoodRequestBody {
  texts?: string[];
  images?: string[]; // base64 strings, with or without data URI prefix
  urls?: string[]; // webpage URLs to scrape design cues from
  // vector embeddings are no longer supported; flag kept for backward compatibility but ignored
  returnVector?: boolean;
}

interface TransformRequestBody {
  html: string; // raw HTML string
  aesthetic: string; // textual aesthetic embedding/description
}

// Helper: extract aesthetic description from a webpage URL
async function describeUrl(targetUrl: string): Promise<string> {
  try {
    // Basic fetch – Node 18+ has global fetch
    // @ts-ignore - fetch available globally in Node 18+, but types not in CommonJS context
    const res = await fetch(targetUrl, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Limit content length to avoid token overflow
    const snippet = html.slice(0, 15000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 120,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "You are an expert web designer who can infer a website's visual aesthetic solely from its HTML and inline CSS.",
        },
        {
          role: "user",
          content:
            `Here is a partial HTML source of a website. Based on structural cues, CSS, colour codes (#rrggbb, rgb), class names and text, describe the site's visual aesthetic (colour palette, typography, layout, mood, style) in one concise sentence. Do not mention HTML or code.\n\nHTML:\n${snippet}`,
        },
      ],
    });

    return (completion.choices[0]?.message?.content ?? "").trim();
  } catch (err: any) {
    console.error("URL description failed", targetUrl, err);
    return ""; // ignore failed URL
  }
}

app.post("/api/mood", async (req: Request, res: Response) => {
  const body = req.body as MoodRequestBody;

  if (!body.texts && !body.images && !body.urls) {
    // @ts-ignore Ignore custom response key on Express Response
    return res.status(400).json({ error: "Provide texts, images or urls." });
  }

  try {
    const descriptions: string[] = [];

    // Include raw texts first
    if (body.texts?.length) {
      descriptions.push(...body.texts);
    }

    // For images, generate descriptions in parallel but with limited concurrency
    if (body.images?.length) {
      const MAX_PARALLEL = 3;
      const chunks = [] as Promise<string>[];
      for (const img of body.images) {
        const p = describeImage(img);
        chunks.push(p);
        // Wait in batches to avoid rate limiting
        if (chunks.length >= MAX_PARALLEL) {
          const batchResults = await Promise.all(chunks);
          descriptions.push(...batchResults);
          chunks.length = 0;
        }
      }
      if (chunks.length) {
        const batchResults = await Promise.all(chunks);
        descriptions.push(...batchResults);
      }
    }

    // For URLs, scrape and describe similarly (limited concurrency)
    if (body.urls?.length) {
      const MAX_PARALLEL_URL = 3;
      let bucket: Promise<string>[] = [];
      for (const url of body.urls) {
        bucket.push(describeUrl(url));
        if (bucket.length >= MAX_PARALLEL_URL) {
          const results = await Promise.all(bucket);
          descriptions.push(...results.filter(Boolean));
          bucket = [];
        }
      }
      if (bucket.length) {
        const results = await Promise.all(bucket);
        descriptions.push(...results.filter(Boolean));
      }
    }

    // Create final aesthetic embedding text
    const aestheticText = await generateAestheticEmbedding(descriptions);

    // Always return only textual embedding – numeric vectors deprecated
    // @ts-ignore Ignore type mismatch for error response shape
    return res.json({ aesthetic_embedding: aestheticText });
  } catch (err: any) {
    console.error(err);
    // @ts-ignore Ignore type mismatch for error response shape
    return res.status(500).json({ error: err?.message || "Failed to generate embedding" });
  }
});

// Endpoint: apply aesthetic to HTML
app.post("/api/transform", async (req: Request, res: Response) => {
  // @ts-ignore: ignore Express body typing limitations
  const body = req.body as TransformRequestBody;
  if (!body?.html || !body?.aesthetic) {
    // @ts-ignore
    return res.status(400).json({ error: "Provide 'html' and 'aesthetic' fields." });
  }

  try {
    const transformed = await applyAestheticToHtml(body.html, body.aesthetic);
    // @ts-ignore
    return res.json({ html: transformed });
  } catch (err: any) {
    console.error(err);
    // @ts-ignore
    return res.status(500).json({ error: err?.message || "Failed to transform HTML" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Mood embedding backend running on http://localhost:${PORT}`);
});
