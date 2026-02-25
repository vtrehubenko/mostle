export const dynamic = "force-dynamic";

async function getDaily() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/daily`,
    {
      cache: "no-store",
    },
  );
  return res.json();
}

export default async function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Mostle</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Next step: show today’s game from DB.
      </p>
      <p style={{ marginTop: 16 }}>
        Сейчас сделаем UI через client fetch (чтобы работало и локально, и на
        Vercel).
      </p>
    </main>
  );
}
