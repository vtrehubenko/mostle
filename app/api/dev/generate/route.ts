import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  pickDailySpecialId,
  SPECIALS,
  type SpecialId,
} from "@/lib/game/special";
import {
  pickNBySeed,
  computeSpecialValue,
  dateKeyUTC,
} from "@/lib/game/generateDaily";

function addDays(dateKey: string, days: number) {
  const d = new Date(dateKey + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}) as any);
  const baseKey = (body?.baseDateKey as string) || dateKeyUTC();
  const nextKey = addDays(baseKey, 1);

  await prisma.dailyGame.deleteMany({ where: { dateKey: nextKey } });

  const allObjects = await prisma.gameObject.findMany();
  if (allObjects.length < 5) {
    return NextResponse.json(
      { error: "Not enough GameObject records (need 5+)." },
      { status: 500 },
    );
  }

  const specialId = pickDailySpecialId(new Date(nextKey)) as SpecialId;
  const special = SPECIALS[specialId];

  const picked = pickNBySeed(allObjects, 5, `objects:${nextKey}`);

  const created = await prisma.dailyGame.create({
    data: {
      dateKey: nextKey,
      theme: specialId,
      specialLabel: special.label,
      specialHint: special.hint,
      objects: { connect: picked.map((o) => ({ id: o.id })) },
    },
    include: { objects: true },
  });

  return NextResponse.json({
    ...created,
    date: created.dateKey,
    objects: created.objects.map((o) => ({
      ...o,
      specialValue: computeSpecialValue(o as any, created.theme as SpecialId),
    })),
  });
}
