import DailyGame from "@/components/DailyGame";

export default function Home() {
  return (
    <main className="h-screen bg-neutral-100 flex flex-col">
      <header className="mx-auto max-w-5xl px-4 pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Mostle</h1>
        <p className="mt-2 text-neutral-600">
          A daily ranking puzzle: five objects, five metrics.
        </p>
      </header>

      <DailyGame />
    </main>
  );
}
