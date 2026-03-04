import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MetricKey = "oldest" | "largest" | "value" | "influence" | "specialValue";
type SpecialId = "employees" | "users" | "marketCap" | "patents";

const METRICS: MetricKey[] = [
  "oldest",
  "largest",
  "value",
  "influence",
  "specialValue",
];

function dateKeyUTC(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function sortedObjects(
  objects: any[],
  metric: MetricKey,
  specialId: SpecialId,
) {
  const arr = objects.slice();

  if (metric === "oldest")
    return arr.sort((a, b) => (a.oldest ?? 0) - (b.oldest ?? 0));
  if (metric === "largest")
    return arr.sort((a, b) => (b.largest ?? 0) - (a.largest ?? 0));
  if (metric === "value")
    return arr.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  if (metric === "influence")
    return arr.sort((a, b) => (b.influence ?? 0) - (a.influence ?? 0));

  return arr.sort((a, b) => (b[specialId] ?? 0) - (a[specialId] ?? 0));
}

export async function POST(req: Request) {
  const body = await req.json();
  const userOrder = body.userOrder as string[] | undefined;

  if (!Array.isArray(userOrder) || userOrder.length !== 5) {
    return NextResponse.json({ error: "Invalid userOrder" }, { status: 400 });
  }

  const dateKey = body.dateKey ?? dateKeyUTC();

  const game = await prisma.dailyGame.findUnique({
    where: { dateKey },
    include: { objects: true },
  });

  if (!game)
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.objects.length !== 5) {
    return NextResponse.json(
      { error: "Game objects mismatch" },
      { status: 500 },
    );
  }

  const specialId = (game.theme as SpecialId) || "marketCap";

  const result = METRICS.map((key, index) => {
    const sorted = sortedObjects(game.objects, key, specialId);
    const correctId = sorted[index]?.id;
    return { key, isCorrect: userOrder[index] === correctId };
  });

  return NextResponse.json({
    allCorrect: result.every((r) => r.isCorrect),
    result,
  });
}
