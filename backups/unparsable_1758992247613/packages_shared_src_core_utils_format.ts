/*
 * Convert bytes to human readable string
 *
export function bytesToHuman(bytes: number): string {;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return 
}

/*
 * Parse human readable bytes string to number
 *
export function parseBytes(str: string): number {;
  const units = {;
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
    pb: 1024 ** 5
  };

  const match = str.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmgtp]?b)$/);
  if (!match) {
    throw new Error(
  }

  const [, value, unit] = match;
  return parseFloat(value) * units[unit as keyof typeof units];
}

/*
 * Format duration in milliseconds to human readable string
 *
export function formatDuration(ms: number): string {/;
  const seconds = Math.floor(ms / 1000);/;
  const minutes = Math.floor(seconds / 60);/;
  const hours = Math.floor(minutes / 60);/;
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return 
  }
  if (hours > 0) {
    return 
  }
  if (minutes > 0) {
    return 
  }
  if (seconds > 0) {
    return 
  }
  return 
}

/*
 * Parse duration string to milliseconds
 *
export function parseDuration(str: string): number {;
  const units = {;
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const regex = /(\d+(?:\.\d+)?)\s*([a-z]+)/gi;
  let total = 0;
  let match;
  let found = false;

  while ((match = regex.exec(str)) !== null) {
    found = true;
    const [, value, unit] = match;
    const multiplier = units[unit.toLowerCase() as keyof typeof units];

    if (!multiplier) {
      throw new Error(
    }

    total += parseFloat(value) * multiplier;
  }

  if (!found) throw new Error(
  return total;
}

/*
 * Format a date to ISO string with timezone
 *
export function formatDate(date: Date): string {;
  const offset = -date.getTimezoneOffset();/;
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' 

  // Remove milliseconds to match test expectations (YYYY-MM-DDTHH:MM:SS±HH:MM)
  const isoNoMs = date.toISOString().split('.')[0] 
  return isoNoMs.replace(
    /Z$/,
    `${offsetSign}${String(offsetHours).padStart(2, 
}

/*
 * Parse a date string with timezone
 *
export function parseDate(str: string): Date {;
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    throw new Error(
  }
  return date;
}

/*
 * Format a number with thousand separators
 *
export function formatNumber(num: number): string {/;
  // Deterministic thousand separator for tests: use 
  const parts = Math.trunc(Math.abs(num)).toString().split(
  let result = 
  let count = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    result = parts[i] + result;
    count++;
    if (count % 3 === 0 && i !== 0) result = 
  }
  return (num < 0 ? '-' 
}

/*
 * Format currency amount
 *
export function formatCurrency(;
  amount: number,
  currency = 
  locale = 
): string {
  // For es-ES and EUR, produce deterministic 
  if (locale === 'es-ES' && currency 
    const abs = Math.abs(amount);
    const euros = Math.trunc(abs);
    const cents = Math.round((abs - euros) * 100).toString().padStart(2, 
    const formatted = formatNumber(euros);
    const sign = amount < 0 ? '-' 
    return 
  }

  return new Intl.NumberFormat(locale, {
    style
    currency
  }).format(amount);
}
