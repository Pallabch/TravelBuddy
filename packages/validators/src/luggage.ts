import { z } from "zod";

export const luggageNameInput = z.object({
  name: z.string().trim().min(1, "Name the luggage.").max(60, "Keep the name under 60 characters."),
});

export const luggageSectionInput = z.object({
  title: z.string().trim().min(1, "Name the section.").max(80, "Keep the name under 80 characters."),
});

export const luggageItemInput = z.object({
  label: z.string().trim().min(1, "Write the item.").max(160, "Keep it under 160 characters."),
  sectionId: z.string().uuid().nullable().optional(),
});

export const luggageMoveInput = z.object({
  sectionId: z.string().uuid().nullable(),
  index: z.number().int().min(0).max(500),
});

export const luggageMoveManyInput = luggageMoveInput.extend({
  itemIds: z.array(z.string().uuid()).min(1).max(40),
});

export type LuggageNameInput = z.infer<typeof luggageNameInput>;
export type LuggageSectionInput = z.infer<typeof luggageSectionInput>;
export type LuggageItemInput = z.infer<typeof luggageItemInput>;
export type LuggageMoveInput = z.infer<typeof luggageMoveInput>;
export type LuggageMoveManyInput = z.infer<typeof luggageMoveManyInput>;
