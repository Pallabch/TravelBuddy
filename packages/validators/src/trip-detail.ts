import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const itineraryInput = z.object({
  day,
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time")
    .or(z.literal("")),
  title: z.string().trim().min(1, "Add a title").max(120),
  location: z.string().trim().max(120),
  details: z.string().trim().max(500),
  participants: z.array(z.string().trim().min(1)).min(1, "Choose who is going"),
});

export const documentCategory = z
  .string()
  .trim()
  .min(1, "Add a category")
  .max(40, "Keep the category under 40 characters");

export const documentName = z
  .string()
  .trim()
  .min(1, "Name the document.")
  .max(180, "Keep the name under 180 characters.");

export type ItineraryInput = z.infer<typeof itineraryInput>;