import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  pickDailySpecialId,
  SPECIALS,
  type SpecialId,
} from "@/lib/game/special";
import {
  dateKeyUTC,
  pickNBySeed,
  computeSpecialValue,
} from "@/lib/game/generateDaily";

export async function GET() {
  const dateKey = dateKeyUTC();
  const existing = await prisma.dailyGame.findUnique({
    where: { dateKey },
    include: { objects: true },
  });

  if (existing) {
    return NextResponse.json({
      ...existing,
      date: existing.dateKey,
      objects: existing.objects.map((o) => ({
        ...o,
        specialValue: computeSpecialValue(
          o as any,
          existing.theme as SpecialId,
        ),
      })),
    });
  }

  // пул всех объектов (позже можно ограничить темой/категорией)
  const allObjects = await prisma.gameObject.findMany();

  const specialId = pickDailySpecialId(new Date(dateKey));
  const special = SPECIALS[specialId];

  // ровно 5 объектов детерминированно на день
  const picked = pickNBySeed(allObjects, 5, `objects:${dateKey}`);

  const created = await prisma.dailyGame.create({
    data: {
      dateKey,
      theme: specialId,
      specialLabel: special.label,
      specialHint: special.hint,
      objects: {
        connect: picked.map((o) => ({ id: o.id })),
      },
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
