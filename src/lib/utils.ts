import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAvatarUrl(userId: string) {
  return `https://i.pravatar.cc/150?u=${userId}`;
}
