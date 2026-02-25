import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const today = startOfToday();

  const game = await prisma.dailyGame.findUnique({
    where: { date: today },
    include: { objects: true },
  });

  if (!game) {
    return NextResponse.json(
      { error: "No daily game for today" },
      { status: 404 },
    );
  }

  return NextResponse.json(game);
}
