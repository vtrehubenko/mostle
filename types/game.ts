export type MetricKey =
  | "oldest"
  | "largest"
  | "value"
  | "influence"
  | "specialValue";

export type Metric = {
  key: MetricKey;
  label: string;
  hint: string;
};

export type DailyGameDTO = {
  id: string;
  date: string; // ISO
  theme: string;
  specialLabel: string;
  specialHint: string;
  objects: Array<{
    id: string;
    name: string;
    oldest: number;
    largest: number;
    value: number;
    influence: number;
    specialValue: number;
  }>;
};

export const BASE_METRICS: Metric[] = [
  { key: "oldest", label: "Oldest", hint: "Earliest year / origin" },
  { key: "largest", label: "Largest", hint: "Biggest scale" },
  { key: "value", label: "Most valuable", hint: "Highest worth" },
  { key: "influence", label: "Most influential", hint: "Widest impact" },
];

export function metricsForGame(
  game: Pick<DailyGameDTO, "specialLabel" | "specialHint">,
): Metric[] {
  return [
    ...BASE_METRICS,
    {
      key: "specialValue",
      label: game.specialLabel || "Special",
      hint: game.specialHint || "Daily special metric",
    },
  ];
}
