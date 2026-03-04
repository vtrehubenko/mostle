export type SpecialId = "employees" | "users" | "marketCap" | "patents";

export const SPECIALS: Record<SpecialId, { label: string; hint: string }> = {
  employees: { label: "Employees", hint: "Bigger is better" },
  users: { label: "Users", hint: "Bigger is better" },
  marketCap: { label: "Market cap", hint: "Bigger is better" },
  patents: { label: "Patents", hint: "Bigger is better" },
};

export function pickDailySpecialId(date: Date): SpecialId {
  const key = date.toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const ids = Object.keys(SPECIALS) as SpecialId[];
  return ids[h % ids.length];
}
