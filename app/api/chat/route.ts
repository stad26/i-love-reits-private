import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { message, context } = await req.json();

  const systemPrompt = `You are a concise, knowledgeable REIT investment analyst assistant.
You help investors analyze public U.S. REITs — valuation, peer comparison, sector trends, and scenario modeling.
Keep responses practical, direct, and jargon-friendly (explain terms when used).
When asked about assumptions, suggest specific numbers where possible.
When asked about risks, be candid.
Context about the current REIT being analyzed: ${JSON.stringify(context ?? {})}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Claude API error" }, { status: 500 });
  }
}
