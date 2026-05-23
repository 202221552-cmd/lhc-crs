// Utility to normalize Arabic text (remove diacritics, normalize Alef/Yaa/Taa Marbuta)
export const normalizeArabic = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove diacritics (tashkeel)
    .trim();
};

export const normalizeNumbers = (text: string) => {
  if (!text) return '';
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
};

// Advanced filter
export const smartFilter = (items: any[], query: string, keys: string[]) => {
  if (!query) return items;

  const normalizedQuery = normalizeNumbers(normalizeArabic(query.toLowerCase()));

  return items.filter(item => {
    return keys.some(key => {
      const val = item[key];
      if (!val) return false;
      const normalizedVal = normalizeNumbers(normalizeArabic(String(val).toLowerCase()));
      return normalizedVal.includes(normalizedQuery);
    });
  });
};
