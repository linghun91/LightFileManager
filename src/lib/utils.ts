import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Placeholder for nanoid or uuid.
 * In a real application, install and use a proper library like `nanoid` or `uuid`.
 * Example: `npm install nanoid` then `import { nanoid } from 'nanoid'`
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
