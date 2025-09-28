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

export function getProfileName(
  profile: { full_name?: string | null; email?: string | null } | null,
  userId?: string | null
): string {
  if (profile?.full_name) {
    return profile.full_name;
  }
  if (profile?.email) {
    const localPart = profile.email.split('@')[0];
    // Use local part if it's a reasonable length
    if (localPart && localPart.length > 0 && localPart.length < 30) {
      return localPart;
    }
    // Otherwise, if it's a valid email, use the full thing
    if (profile.email.includes('@')) {
      return profile.email;
    }
  }
  if (userId) {
    return `User ${userId.substring(0, 8)}`;
  }
  // This should ideally not be reached if a userId is always provided for messages.
  return 'User';
}
