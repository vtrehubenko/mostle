import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/ai/openai";
import { GeneratedObjectsSchema } from "@/lib/ai/schemas";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const theme = String(body?.theme ?? "Popular tech companies");
  const count = Math.min(Math.max(Number(body?.count ?? 10), 1), 20);

  const prompt = `
Generate ${count} objects for a daily ranking puzzle.
Theme: ${theme}

Return ONLY valid JSON: an array of objects with keys:
name, oldest, largest, value, influence, employees, users, marketCap, patents.

Rules:
- name must be unique
- numbers should be plausible (not necessarily real)
- oldest is a year (e.g. 1976)
- largest/value/influence are 1..10
- employees/users/marketCap/patents are integers >= 0
No extra text. No markdown.
`.trim();

  const r = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = r.output_text?.trim() ?? "";
  let json: unknown;

  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Model did not return valid JSON", raw: text.slice(0, 2000) },
      { status: 502 },
    );
  }

  const parsed = GeneratedObjectsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid schema", details: parsed.error.flatten(), raw: json },
      { status: 502 },
    );
  }

  const existingNames = new Set(
    (await prisma.gameObject.findMany({ select: { name: true } })).map((x) =>
      x.name.toLowerCase(),
    ),
  );

  const toInsert = parsed.data.filter(
    (o) => !existingNames.has(o.name.toLowerCase()),
  );

  if (toInsert.length === 0) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
      skipped: parsed.data.length,
    });
  }

  await prisma.gameObject.createMany({ data: toInsert });

  return NextResponse.json({
    ok: true,
    inserted: toInsert.length,
    skipped: parsed.data.length - toInsert.length,
  });
}
