import { getHideCurrencySetting } from "../components/modal/SettingsModal";

/**
 * Форматирует числовую строку в удобочитаемый формат с разделителями тысяч и символом рубля
 * @param {string} priceString - Строка с числом для форматирования
 * @param {string} [currencySymbol='₽'] - Символ валюты (по умолчанию '₽')
 * @param {boolean} [showDecimals=true] - Показывать ли десятичные знаки (по умолчанию true)
 * @returns {string} Отформатированная строка (например "1 000,50₽" или "1 000₽")
 */
export function formatMoney(
  priceString: string,
  currencySymbol: string = '₽',
  showDecimals: boolean = true
): string {
  if (!priceString || priceString.trim() === '') {
    return getHideCurrencySetting() ? '0' : `0${currencySymbol}`;
  }
  
  // Разделяем целую и дробную части, учитывая разделитель точка или запятая
  const match = priceString.match(/^(-?\d+)[,.]?(\d*)/);
  
  if (!match) {
    return getHideCurrencySetting() ? '0' : `0${currencySymbol}`;
  }
  
  const integerPart = match[1];
  const decimalPart = match[2] || '';
  
  // Форматируем целую часть
  const formattedInteger = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseInt(integerPart, 10));
  
  // Определяем, показывать ли десятичную часть
  const shouldShowDecimals = showDecimals && decimalPart.length > 0;
  
  // Формируем отформатированную строку
  let formattedNumber = formattedInteger;
  if (shouldShowDecimals) {
    // Обрезаем десятичную часть до 2 знаков
    const truncatedDecimal = decimalPart.slice(0, 2);
    formattedNumber += `,${truncatedDecimal}`;
  }
  
  const shouldShowCurrency = !getHideCurrencySetting();
  
  return shouldShowCurrency 
    ? `${formattedNumber}${currencySymbol}`
    : formattedNumber;
}

/**
 * Парсит денежную строку в число с десятичными знаками
 * @param {string} priceString - Строка с денежным значением (например "1 000,50" или "1,000.50")
 * @returns {number} Числовое значение в рублях (например 1000.5)
 */
export function parseMoney(priceString: string): number {
  if (!priceString) return 0;
  
  // Удаляем все пробелы (разделители тысяч) и заменяем запятую на точку
  const normalizedString = priceString
    .replace(/\s/g, '') // удаляем пробелы
    .replace(',', '.'); // заменяем запятую на точку для parseFloat
  
  const number = parseFloat(normalizedString);
  
  // Возвращаем число или 0 в случае NaN
  return isNaN(number) ? 0 : number;
}

/**
 * Альтернативная версия formatMoney с поддержкой указания количества знаков после запятой
 * @param {string} priceString - Строка с числом для форматирования
 * @param {string} [currencySymbol='₽'] - Символ валюты (по умолчанию '₽')
 * @param {number} [decimals=2] - Количество знаков после запятой (по умолчанию 2)
 * @param {boolean} [alwaysShowDecimals=false] - Всегда показывать указанное количество знаков после запятой
 * @returns {string} Отформатированная строка
 */
export function formatMoneyWithDecimals(
  priceString: string,
  currencySymbol: string = '₽',
  decimals: number = 2,
  alwaysShowDecimals: boolean = false
): string {
  if (!priceString || priceString.trim() === '') {
    return getHideCurrencySetting() ? '0' : `0${currencySymbol}`;
  }
  
  const number = parseMoney(priceString);
  
  if (isNaN(number)) {
    return getHideCurrencySetting() ? '0' : `0${currencySymbol}`;
  }
  
  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: alwaysShowDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
    useGrouping: true,
  };
  
  const formattedNumber = new Intl.NumberFormat('ru-RU', options).format(number);
  
  const shouldShowCurrency = !getHideCurrencySetting();
  
  return shouldShowCurrency 
    ? `${formattedNumber}${currencySymbol}`
    : formattedNumber;
}