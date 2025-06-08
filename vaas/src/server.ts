import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { saveAesthetic, listAesthetics, getAesthetic } from "./storage.js";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("⛔️  OPENAI_API_KEY missing in environment");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Centralise model selection
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini"; // vision-capable chat model
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

const app = express();
app.use(cors()); // Allow all origins for development simplicity
app.use(express.json({ limit: "25mb" })); // allow large base64 images

// Helper: describe a single image via GPT-Vision
async function describeImage(base64Url: string): Promise<string> {
  // Ensure URL is a proper data URL
  const dataUrl = base64Url.startsWith("data:") ? base64Url : `data:image/png;base64,${base64Url}`;

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
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

// Endpoint: fetch remote HTML by URL and transform
app.post("/api/transform-url", async (req: Request, res: Response) => {
  // @ts-ignore
  const body = req.body as TransformUrlBody;

  if (!body?.url || (!body.aesthetic && !body.aesthetic_name)) {
    // @ts-ignore
    return res.status(400).json({ error: "Provide 'url' and either 'aesthetic' or 'aesthetic_name'." });
  }

  try {
    // Fetch HTML
    // @ts-ignore fetch global
    const resp = await fetch(body.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) throw new Error(`Failed to fetch URL: ${resp.status}`);
    let html = await resp.text();

    // Inject a <base> tag so that all relative links and images resolve correctly when the transformed HTML is displayed
    try {
      const hasHead = /<head[^>]*>/i.test(html);
      const hasBase = /<base\s[^>]*href=/i.test(html);
      if (hasHead && !hasBase) {
        const baseHref = new URL('.', body.url).href;
        html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
      }
    } catch {
      /* ignore */
    }

    let aestheticText = body.aesthetic ?? "";
    if (!aestheticText && body.aesthetic_name) {
      const saved = getAesthetic(body.aesthetic_name);
      if (!saved) {
        // @ts-ignore
        return res.status(404).json({ error: "aesthetic_name not found" });
      }
      aestheticText = saved.embedding;
    }

    const transformed = await applyAestheticToHtml(html, aestheticText);

    // @ts-ignore
    return res.json({ html: transformed });
  } catch (err: any) {
    console.error(err);
    // @ts-ignore
    return res.status(500).json({ error: err?.message || "Failed to transform URL" });
  }
});

// Helper: craft aesthetic embedding text from collected descriptions
async function generateAestheticEmbedding(descriptions: string[]): Promise<string> {
  const prompt = `Using the following descriptions of images and text snippets, craft a single, vivid textual embedding that captures the aesthetic essence, mood and style. Use evocative adjectives and nouns, separated by commas, without numbering or line breaks. Limit to 120 words.\n\nDescriptions:\n${descriptions.join("\n")}`;

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
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
    model: EMBEDDING_MODEL,
    input: text,
  });

  return embeddingResp.data[0].embedding;
}

// Helper: apply aesthetic embedding onto raw HTML using GPT-4
async function applyAestheticToHtml(html: string, aesthetic: string): Promise<string> {
  // Limit html to 20k chars to fit context
  const snippet = html.slice(0, 20000);

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.7,
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are a senior front-end engineer. You receive an existing full HTML document and an aesthetic description.\n\nRequirements:\n1. DO NOT remove or rename any existing text elements.\n 2. Understand and do low level changes. \n3. Add the aesthetic via CSS: inline styles, CSS classes, or a <style> block in <head>. Remember to be very creative and stick to theme. \n5. Make bold and creative changes and make sure the changes portray the aesthetic.\n6.Make sure to choose font and background color such that there is contrast and the text remains legible\n7. Deliver the final, complete HTML with correct syntax document ONLY (no markdown fences, no extra commentary).",
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

  name?: string; // Optional name to save this aesthetic under
}

interface TransformRequestBody {
  html: string; // raw HTML string
  aesthetic: string; // textual aesthetic embedding/description
}

interface TransformUrlBody {
  url: string;
  aesthetic?: string; // direct embedding
  aesthetic_name?: string; // saved name to fetch
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

    // Save if name supplied
    if (body.name) {
      try {
        saveAesthetic(body.name, aestheticText);
      } catch (err) {
        console.error("Failed to save aesthetic", err);
      }
    }

    // Respond
    // @ts-ignore
    return res.json({ aesthetic_embedding: aestheticText, saved_as: body.name ?? undefined });
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

// List saved aesthetics
app.get("/api/aesthetics", (_req: Request, res: Response) => {
  // @ts-ignore
  return res.json({ data: listAesthetics() });
});

// Fetch single aesthetic by name
app.get("/api/aesthetic/:name", (req: Request, res: Response) => {
  // @ts-ignore
  const name = (req.params as any).name as string;
  const entry = getAesthetic(name);
  if (!entry) {
    // @ts-ignore
    return res.status(404).json({ error: "Not found" });
  }
  // @ts-ignore
  return res.json(entry);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("===========================================");
  console.log(`🚀 Backend ready on http://localhost:${PORT}`);
  console.log("Press CTRL+C to stop\n");
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`\n💀  Received ${sig}. Shutting down...`);
    server.close(() => {
      console.log("✓ HTTP server closed – port released");
      process.exit(0);
    });
  });
}
