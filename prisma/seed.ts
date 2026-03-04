import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // на деве удобно чистить, чтобы сид был идемпотентным
  await prisma.gameObject.deleteMany();

  await prisma.gameObject.createMany({
    data: [
      {
        name: "Apple",
        oldest: 1976,
        largest: 10,
        value: 9,
        influence: 10,
        employees: 161000,
        users: 2000,
        marketCap: 3000,
        patents: 50000,
      },
      {
        name: "Google",
        oldest: 1998,
        largest: 9,
        value: 10,
        influence: 10,
        employees: 182000,
        users: 3500,
        marketCap: 2000,
        patents: 60000,
      },
      {
        name: "Microsoft",
        oldest: 1975,
        largest: 9,
        value: 10,
        influence: 10,
        employees: 221000,
        users: 1500,
        marketCap: 2800,
        patents: 70000,
      },
      {
        name: "Amazon",
        oldest: 1994,
        largest: 10,
        value: 9,
        influence: 9,
        employees: 1500000,
        users: 300,
        marketCap: 1600,
        patents: 40000,
      },
      {
        name: "Tesla",
        oldest: 2003,
        largest: 7,
        value: 8,
        influence: 9,
        employees: 140000,
        users: 50,
        marketCap: 600,
        patents: 20000,
      },
    ],
  });

  console.log("✅ Seeded GameObject");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
