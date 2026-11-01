import { z } from "zod";

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const createTripInput = z
  .object({
    title: z.string().trim().min(1, "Add a title").max(80),
    destination: z.string().trim().min(1, "Add a destination").max(80),
    startDate: day,
    endDate: day,
  })
  .refine((trip) => trip.endDate >= trip.startDate, {
    message: "The end date is before the start date",
    path: ["endDate"],
  });

export type CreateTripInput = z.infer<typeof createTripInput>;
