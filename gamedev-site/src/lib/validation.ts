import { z } from 'zod';
import { isIsoDate } from './plan';

import { CATEGORIES, MILESTONE_STATUSES, WEEK_STATUSES } from './categories';

export { CATEGORIES, CATEGORY_LABELS, MILESTONE_STATUSES, WEEK_STATUSES, type Category } from './categories';

export const isoDate = z.string().refine(isIsoDate, 'Data non valida (YYYY-MM-DD)');

/**
 * Optional free text: trimmed; empty string or null clears the value (null);
 * undefined means "not provided" (left unchanged in PATCH requests).
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v === undefined ? undefined : v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v === undefined ? undefined : v ? v : null))
  .refine((v) => v == null || /^https?:\/\/\S+$/i.test(v), 'Link non valido (deve iniziare con http:// o https://)');

export const sessionInput = z.object({
  date: isoDate,
  minutes: z.coerce.number().int().min(1).max(960),
  category: z.enum(CATEGORIES),
  note: optionalText(1000),
  link: optionalUrl,
});
export type SessionInput = z.infer<typeof sessionInput>;

export const weekPatch = z
  .object({
    status: z.enum(WEEK_STATUSES).optional(),
    goal: z.string().trim().min(1).max(500).optional(),
    notes: optionalText(2000),
    link: optionalUrl,
  })
  .strict();

export const milestonePatch = z
  .object({
    status: z.enum(MILESTONE_STATUSES).optional(),
    reached_date: isoDate.nullish(),
    notes: optionalText(2000),
    is_public: z.boolean().optional(),
  })
  .strict();

export const settingsPatch = z
  .object({
    start_date: isoDate.optional(),
    weekly_target_hours: z.coerce.number().min(1).max(100).optional(),
    public_show_hours: z.boolean().optional(),
  })
  .strict();

export const rangeQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const idParam = z.coerce.number().int().positive();
export const weekParam = z.coerce.number().int().min(1).max(104);
export const milestoneIdParam = z.string().regex(/^[a-z0-9_-]{1,32}$/i);
