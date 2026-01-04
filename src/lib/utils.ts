import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Throttle function to limit how often a function can be called
 * @param func - The function to throttle
 * @param limit - The minimum time (in ms) between function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function parseBackendError(error: unknown): {
  category?: string;
  message: string;
} {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Regex to match [Category] Message
  const match = errorMessage.match(/^\[(.*?)\]\s?(.*)/);

  if (match) {
    return {
      category: match[1], // e.g. "Network", "Python"
      message: match[2] || errorMessage, // The rest of the message
    };
  }

  return {
    message: errorMessage,
  };
}
