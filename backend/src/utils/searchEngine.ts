// ==========================================
// Smart Fuzzy Search Engine
// ==========================================

export function normalizeNumbers(str: string): string {
  return String(str || '')
    .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
    .replace(/[\u06f0-\u06f9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 48));
}

export function normalizeArabic(str: string): string {
  return String(str || '')
    .replace(/أ|إ|آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getFieldValue(obj: any, field: string): string {
  const val = obj[field];
  if (!val) return '';
  if (typeof val === 'string') {
    // Handle JSON arrays (phones)
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return generatePhoneVariants(parsed);
    } catch {}
    return val;
  }
  if (Array.isArray(val)) {
    // If it contains phone-like strings, generate variants
    if (val.length > 0 && typeof val[0] === 'string' && /[\d+]{7,}/.test(val[0])) {
      return generatePhoneVariants(val);
    }
    return val.join(' ');
  }
  return String(val);
}

function generatePhoneVariants(phones: string[]): string {
  const variants = phones.flatMap(p => {
    const clean = p.replace(/[^0-9+]/g, '');
    const digitsOnly = clean.replace(/\D/g, '');
    let trimmed = digitsOnly;
    if (trimmed.startsWith('00')) trimmed = trimmed.slice(2);
    const v: string[] = [];
    if (clean) v.push(clean);
    if (digitsOnly && digitsOnly !== clean) v.push(digitsOnly);
    if (trimmed && trimmed !== digitsOnly) v.push(trimmed);
    if (trimmed.startsWith('0')) {
      const noZero = trimmed.replace(/^0+/, '');
      v.push(noZero);
      v.push('962' + noZero);
      v.push('+962' + noZero);
      v.push('00962' + noZero);
    }
    if (!trimmed.startsWith('0') && !trimmed.startsWith('+')) {
      v.push('0' + trimmed);
    }
    if (trimmed.startsWith('962')) {
      const no962 = trimmed.replace(/^962/, '');
      v.push(no962);
      v.push('0' + no962);
    }
    if (clean.startsWith('+')) {
      const noPlus = clean.slice(1);
      v.push(noPlus);
      if (noPlus.startsWith('962')) {
        const no962 = noPlus.replace(/^962/, '');
        v.push(no962);
        v.push('0' + no962);
      }
    }
    return v;
  });
  return [...new Set(variants)].join(' ');
}

function fuzzyMatch(text: string, word: string): boolean {
  if (text.includes(word)) return true;
  if (word.length < 3) return false;

  // Split text into words and check each word
  const words = text.split(' ');
  for (const w of words) {
    if (w === word) return true;
    if (w.includes(word)) return true;
    if (word.includes(w) && w.length >= 3) return true;
    // Levenshtein on each word
    if (Math.abs(w.length - word.length) <= 1 && levenshtein(w, word) <= 1) return true;
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(dp[j], dp[j - 1], prev);
      prev = temp;
    }
  }
  return dp[n];
}

export function smartFilter<T>(items: T[], query: string, fields: string[]): T[] {
  if (!query.trim()) return items;

  const q = normalizeArabic(normalizeNumbers(query.toLowerCase()));
  const words = q.split(' ').filter(Boolean);

  return items.filter(item => {
    const combined = fields.map(f => getFieldValue(item, f)).join(' ');
    const normalizedCombined = normalizeArabic(normalizeNumbers(combined.toLowerCase()));
    return words.every(word => fuzzyMatch(normalizedCombined, word));
  });
}
