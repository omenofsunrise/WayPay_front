/**
 * Форматирует числовую строку в удобочитаемый формат с разделителями тысяч и символом рубля
 * @param {string} priceString - Строка с числом для форматирования
 * @param {string} [currencySymbol='₽'] - Символ валюты (по умолчанию '₽')
 * @returns {string} Отформатированная строка (например "1 000₽")
 */
export function formatMoney(
  priceString: string,
  currencySymbol: string = '₽'
): string {
  const numericString = priceString.replace(/[^\d-]/g, '');

  const number = parseInt(numericString, 10);

  if (isNaN(number)) {
    return `0${currencySymbol}`;
  }

  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);

  return `${formattedNumber}${currencySymbol}`;
}

export function parseMoney(priceString: string): number {
  const numericString = priceString.replace(/\D/g, '');
  
  return parseInt(numericString, 10);
}