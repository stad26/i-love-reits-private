import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a top-tier public REIT equity research analyst.

I will provide an earnings call transcript.

Your task is to convert it into a concise investor-ready summary optimized for a website dashboard.

RULES:
- Keep total output under 250 words.
- Ignore operator introductions, disclaimers, and filler.
- Focus only on information relevant to investors.
- Be sharp, specific, and concise.
- No fluff.

OUTPUT FORMAT:

[Company Name] – Earnings Call Snapshot

1. What Mattered
- 3 bullet points on major developments

2. Key Metrics
- NOI:
- Occupancy:
- Guidance:
- Leverage:
- Acquisitions / Dispositions:

3. Management Tone
(1 sentence: confident / cautious / promotional / realistic)

4. Stock View
(2 sentences: why this is bullish, bearish, or neutral)

5. Watch Next Quarter
- 2 bullets`;

export async function POST(req: NextRequest) {
  // Initialize client inside the handler so a bad/missing env var returns a
  // proper JSON error instead of an unhandled module-level throw.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isPDF =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    let messageContent: Anthropic.MessageParam["content"];

    if (isPDF) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      messageContent = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        } as Anthropic.DocumentBlockParam,
        {
          type: "text",
          text: "Please analyze this earnings call transcript and produce the investor summary.",
        },
      ];
    } else {
      const text = await file.text();
      if (!text.trim()) {
        return NextResponse.json({ error: "File appears to be empty" }, { status: 400 });
      }
      messageContent = [
        {
          type: "text",
          text: `Earnings call transcript:\n\n${text}\n\nPlease analyze this and produce the investor summary.`,
        },
      ];
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: messageContent }],
    });

    const output = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("\n");

    return NextResponse.json({ result: output });
  } catch (err: unknown) {
    console.error("analyze-transcript error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
