/** Session categories (kept free of zod so the dashboard bundle stays small). */
export const CATEGORIES = ['cpp', 'matematica', 'progetto', 'corso', 'lettura', 'game_jam', 'altro'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  cpp: 'C++',
  matematica: 'Matematica',
  progetto: 'Progetto',
  corso: 'Corso',
  lettura: 'Lettura',
  game_jam: 'Game jam',
  altro: 'Altro',
};

export const WEEK_STATUSES = ['da_fare', 'in_corso', 'fatta', 'saltata'] as const;
export const MILESTONE_STATUSES = ['da_fare', 'in_corso', 'raggiunto', 'in_ritardo'] as const;
