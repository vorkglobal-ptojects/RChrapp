import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateLeaveDays(leaveType: string, startDate: string, endDate: string, startTime?: string | null, endTime?: string | null): number {
  if (leaveType === 'Short') {
    if (!startTime || !endTime) return 0;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, totalMinutes / 60) / 8; // 8 hours is considered a full day
  } else {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}

export function isMainAdmin(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  return user.role === 'super' || email === 'dinushapushparajah@gmail.com' || email === 'dinusha.pushparajah@hrpulse.com';
}

export function isITTeamMember(user?: { branch?: string; department?: string } | null): boolean {
  if (!user || !user.branch) return false;
  const b = user.branch.trim().toLowerCase();
  return b === 'it team' || b === 'it';
}

export function canViewEmployee(
  viewer?: { role?: string; uid?: string } | null,
  target?: { branch?: string; uid?: string } | null
): boolean {
  if (!target) return false;
  if (isITTeamMember(target)) {
    return isMainAdmin(viewer) || (Boolean(viewer?.uid) && viewer?.uid === target.uid);
  }
  return true;
}
