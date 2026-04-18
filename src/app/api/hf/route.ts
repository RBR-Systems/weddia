import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type HfPostBody = {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HfPostBody;
    const { prompt } = body;
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const MODEL =
      body.model ?? process.env.DEFAULT_HF_MODEL ?? "mistralai/Mistral-7B-Instruct-v0.2";
    const HF_API_KEY =
      process.env.HUGGINGFACE_API_KEY ?? process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    if (!HF_API_KEY) {
      return NextResponse.json(
        { error: "Hugging Face API key not configured on server" },
        { status: 500 },
      );
    }

    const url = "https://router.huggingface.co/v1/chat/completions";

    const payload: any = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: body.max_tokens ?? 1200,
      temperature: body.temperature ?? 0.7,
      top_p: body.top_p ?? 0.9,
      stream: !!body.stream,
    };

    const hfRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = hfRes.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await hfRes.json();
      if (!hfRes.ok) {
        console.error("HF API Error:", hfRes.status, data);
      }
      return NextResponse.json(data, { status: hfRes.status });
    }

    // Non-JSON response (plain text or stream)
    const text = await hfRes.text();
    if (!hfRes.ok) {
      console.error("HF API Error:", hfRes.status, text);
    }
    return new Response(text, {
      status: hfRes.status,
      headers: {
        "Content-Type": contentType || "text/plain",
      },
    });
  } catch (err) {
    console.error("HF proxy error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
