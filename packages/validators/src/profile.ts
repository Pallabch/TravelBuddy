import { z } from "zod";

const styleValues = ["relaxed", "food", "outdoors", "cities", "mixed"] as const;

export const travelStyles = [
  { value: "relaxed", label: "Relaxed" },
  { value: "food", label: "Food" },
  { value: "outdoors", label: "Outdoors" },
  { value: "cities", label: "Cities" },
  { value: "mixed", label: "A bit of everything" },
] as const;

export const profileInput = z.object({
  homeCity: z.string().trim().max(80, "Keep the city under 80 characters"),
  bio: z.string().trim().max(280, "Keep the bio under 280 characters"),
  languages: z.string().trim().max(80, "Keep languages under 80 characters"),
  travelStyle: z.union([z.literal(""), z.enum(styleValues)]),
});

export type ProfileInput = z.infer<typeof profileInput>;
