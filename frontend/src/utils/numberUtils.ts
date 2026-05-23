export const normalizeNumbers = (text: string): string => {
  if (!text) return '';
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
};
