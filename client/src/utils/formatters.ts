export const formatPrice = (price: number | null): string => {
  if (price === null) return "—";
  // Форматируем число с двумя знаками после запятой и разделителем тысяч
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};
