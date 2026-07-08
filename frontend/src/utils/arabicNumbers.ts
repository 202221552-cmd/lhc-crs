const ARABIC_DIGIT_MAP: Record<string, string> = {
  '\u0660': '0', '\u0661': '1', '\u0662': '2', '\u0663': '3', '\u0664': '4',
  '\u0665': '5', '\u0666': '6', '\u0667': '7', '\u0668': '8', '\u0669': '9',
  '\u06f0': '0', '\u06f1': '1', '\u06f2': '2', '\u06f3': '3', '\u06f4': '4',
  '\u06f5': '5', '\u06f6': '6', '\u06f7': '7', '\u06f8': '8', '\u06f9': '9',
};

function convertArabicDigits(v: string) {
  return v.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, d => ARABIC_DIGIT_MAP[d] || d);
}

export function cleanNum(v: string) {
  return convertArabicDigits(v).replace(/[^\d]/g, '');
}

export function cleanDecimal(v: string) {
  return convertArabicDigits(v)
    .replace(/[٫,]/g, '.')
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1');
}

export function toNumber(v: string, fallback = 0): number {
  const n = Number(cleanDecimal(v));
  return isNaN(n) ? fallback : n;
}
