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

export function getProfileName(profile: { full_name?: string | null, email?: string | null } | null): string {
  if (profile?.full_name) {
    return profile.full_name;
  }
  if (profile?.email) {
    const localPart = profile.email.split('@')[0];
    // Prevent extremely long or empty local parts from being displayed
    if (localPart && localPart.length < 30) {
      return localPart;
    }
    // Fallback for very long or unusual emails
    return profile.email;
  }
  return "Unknown User";
}
