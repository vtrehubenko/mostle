import { prisma } from "../lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const today = startOfToday();

  const existing = await prisma.dailyGame.findUnique({
    where: { date: today },
  });
  if (existing) {
    console.log("Seed skipped: today's game already exists.");
    return;
  }

  await prisma.dailyGame.create({
    data: {
      date: today,
      theme: "Tech Giants",
      specialLabel: "Employees",
      specialHint: "Company with the most employees",
      objects: {
        create: [
          {
            name: "Apple",
            oldest: 1976,
            largest: 220,
            value: 3000,
            influence: 95,
            specialValue: 164000,
          },
          {
            name: "Microsoft",
            oldest: 1975,
            largest: 230,
            value: 2800,
            influence: 92,
            specialValue: 221000,
          },
          {
            name: "Google",
            oldest: 1998,
            largest: 180,
            value: 1900,
            influence: 98,
            specialValue: 190000,
          },
          {
            name: "Amazon",
            oldest: 1994,
            largest: 200,
            value: 1600,
            influence: 90,
            specialValue: 1500000,
          },
          {
            name: "Meta",
            oldest: 2004,
            largest: 120,
            value: 900,
            influence: 88,
            specialValue: 67000,
          },
        ],
      },
    },
  });

  console.log("Seeded: daily game created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
