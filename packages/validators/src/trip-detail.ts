import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const itineraryInput = z.object({
  day,
  title: z.string().trim().min(1, "Add a title").max(120),
  details: z.string().trim().max(500),
});

export const expenseInput = z.object({
  title: z.string().trim().min(1, "Add what this was for").max(80),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 42.50"),
  paidBy: z.string().trim().min(1),
});

export type ItineraryInput = z.infer<typeof itineraryInput>;
export type ExpenseInput = z.infer<typeof expenseInput>;
