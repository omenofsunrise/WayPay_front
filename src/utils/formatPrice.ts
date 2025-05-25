/**
 * Форматирует числовую строку в удобочитаемый формат с разделителями тысяч и символом рубля
 * @param {string} priceString - Строка с числом для форматирования
 * @param {string} [currencySymbol='₽'] - Символ валюты (по умолчанию '₽')
 * @returns {string} Отформатированная строка (например "1 000₽")
 */
export function formatPrice(
  priceString: string,
  currencySymbol: string = '₽'
): string {
  // Удаляем все нецифровые символы (кроме минуса для отрицательных чисел)
  const numericString = priceString.replace(/[^\d-]/g, '');

  // Парсим число
  const number = parseInt(numericString, 10);

  // Если результат не число, возвращаем исходную строку или 0
  if (isNaN(number)) {
    return `0${currencySymbol}`;
  }

  // Форматируем число с разделителями тысяч
  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);

  // Возвращаем результат с символом валюты
  return `${formattedNumber}${currencySymbol}`;
}