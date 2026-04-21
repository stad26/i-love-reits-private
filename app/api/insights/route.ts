import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { reit, valuation, peers, assumptions, scenarios } = await req.json();

  const prompt = `You are a concise REIT analyst. Generate a practical investment insights section for the following REIT.

REIT: ${JSON.stringify(reit)}
Valuation Metrics: ${JSON.stringify(valuation)}
Peer Comparison: ${JSON.stringify(peers)}
User Assumptions: ${JSON.stringify(assumptions)}
Scenarios: ${JSON.stringify(scenarios)}

Respond in JSON with exactly this structure:
{
  "summary": "2-3 sentence plain-English summary of current valuation",
  "premiumDiscount": "sentence on premium/discount vs peers",
  "peerContext": "sentence on how it compares to sector peers",
  "limitations": ["limitation 1", "limitation 2", "limitation 3"],
  "keyAssumptions": ["most important assumption 1", "assumption 2"],
  "questionsToTest": ["question 1", "question 2", "question 3"],
  "managementQuestions": ["question for mgmt/analysts 1", "question 2"],
  "swot": {
    "strengths": ["s1", "s2"],
    "weaknesses": ["w1", "w2"],
    "opportunities": ["o1", "o2"],
    "threats": ["t1", "t2"]
  },
  "bullCase": "2 sentence bull case",
  "bearCase": "2 sentence bear case"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
