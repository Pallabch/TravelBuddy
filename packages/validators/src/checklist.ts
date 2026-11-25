import { z } from "zod";

export const checklistKinds = ["group", "personal"] as const;
export type ChecklistKind = (typeof checklistKinds)[number];

export const checklistSectionInput = z.object({
  title: z.string().trim().min(1, "Give the section a name.").max(80, "Keep the name under 80 characters."),
  detail: z.string().trim().max(120, "Keep the description under 120 characters."),
  kind: z.enum(checklistKinds).default("group"),
});

export const checklistItemInput = z.object({
  label: z.string().trim().min(1, "Write what needs doing.").max(160, "Keep it under 160 characters."),
  note: z.string().trim().max(300, "Keep the note under 300 characters."),
});

export type ChecklistSectionInput = z.infer<typeof checklistSectionInput>;
export type ChecklistItemInput = z.infer<typeof checklistItemInput>;
