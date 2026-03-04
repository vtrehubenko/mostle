import { z } from "zod";

export const GameObjectSchema = z.object({
  name: z.string().min(2).max(60),
  oldest: z.number().int().min(1000).max(2100),
  largest: z.number().int().min(1).max(10),
  value: z.number().int().min(1).max(10),
  influence: z.number().int().min(1).max(10),

  employees: z.number().int().min(0),
  users: z.number().int().min(0),
  marketCap: z.number().int().min(0),
  patents: z.number().int().min(0),
});

export const GeneratedObjectsSchema = z.array(GameObjectSchema).min(1).max(50);
