// Utility functions for the application

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
