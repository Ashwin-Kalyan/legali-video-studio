import clsx, { type ClassValue } from "clsx";

/** Tiny className combiner (clsx alias used across the app). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Format a large number compactly: 284000 -> "284K", 1840000 -> "1.8M". */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/** Format a millisecond timestamp as "M:SS.mmm" (subtitle style). */
export function formatTimecode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const millis = ms % 1000;
  return `${m}:${String(s).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

/** Format a millisecond timestamp as SRT time "HH:MM:SS,mmm". */
export function formatSrtTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s,
  ).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

/** "18:00" -> "6:00 PM" */
export function to12Hour(time24: string): string {
  const [hStr, m] = time24.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/** ISO -> "Jun 3" */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
