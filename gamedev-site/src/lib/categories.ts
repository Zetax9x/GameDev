/** Session categories (kept free of zod so the dashboard bundle stays small). */
export const CATEGORIES = [
  'cpp',
  'unreal',
  'matematica',
  'progetto',
  'godot',
  'blender',
  'corso',
  'lettura',
  'inglese',
  'game_jam',
  'altro',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  cpp: 'C++',
  unreal: 'Unreal',
  matematica: 'Matematica',
  progetto: 'Progetto',
  godot: 'Godot',
  blender: 'Blender',
  corso: 'Corso',
  lettura: 'Lettura',
  inglese: 'Inglese',
  game_jam: 'Game jam',
  altro: 'Altro',
};

export const WEEK_STATUSES = ['da_fare', 'in_corso', 'fatta', 'saltata'] as const;
export const MILESTONE_STATUSES = ['da_fare', 'in_corso', 'raggiunto', 'in_ritardo'] as const;
