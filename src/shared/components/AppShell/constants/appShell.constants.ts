export const APP_VIEWS = [
  'dashboard',
  'events',
  'vendors',
  'settings',
  'profile',
] as const;

export type AppViewLiteral = typeof APP_VIEWS[number];
