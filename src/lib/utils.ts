import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAvatarUrl(seed?: string | null): string {
  if (!seed) {
    // Return a default or placeholder avatar if no seed is provided
    return `https://api.dicebear.com/8.x/adventurer/svg?seed=placeholder`;
  }
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
}
