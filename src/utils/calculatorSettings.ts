export type CalculationMode = 'standard' | 'after-initial' | 'month-percent';

export interface CalculatorSettings {
  mode: CalculationMode;
  round: string;
  defaultPercent: string;
  defaultMonths: string;
}

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettings = {
  mode: 'standard',
  round: '50',
  defaultPercent: '',
  defaultMonths: '',
};

export const CALCULATION_MODE_OPTIONS: { value: CalculationMode; label: string; description: string }[] = [
  {
    value: 'standard',
    label: 'Стандартный (на всю сумму)',
    description: 'Надбавка % начисляется на полную сумму рассрочки',
  },
  {
    value: 'after-initial',
    label: 'Надбавка после вычета взноса',
    description: 'Надбавка % начисляется на сумму за вычетом первоначального взноса',
  },
  {
    value: 'month-percent',
    label: 'Процент за 1 месяц (× месяцев)',
    description: 'Указанный % умножается на количество месяцев',
  },
];

const STORAGE_KEY = 'calculator-settings';
const VALID_MODES: CalculationMode[] = ['standard', 'after-initial', 'month-percent'];

export const loadCalculatorSettings = (): CalculatorSettings => {
  if (typeof window === 'undefined') return DEFAULT_CALCULATOR_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CALCULATOR_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<CalculatorSettings>;
    const mode = parsed.mode && VALID_MODES.includes(parsed.mode) ? parsed.mode : DEFAULT_CALCULATOR_SETTINGS.mode;
    return {
      mode,
      round: typeof parsed.round === 'string' ? parsed.round : DEFAULT_CALCULATOR_SETTINGS.round,
      defaultPercent: typeof parsed.defaultPercent === 'string' ? parsed.defaultPercent : DEFAULT_CALCULATOR_SETTINGS.defaultPercent,
      defaultMonths: typeof parsed.defaultMonths === 'string' ? parsed.defaultMonths : DEFAULT_CALCULATOR_SETTINGS.defaultMonths,
    };
  } catch (error) {
    console.error('Error reading calculator settings:', error);
    return DEFAULT_CALCULATOR_SETTINGS;
  }
};

export const saveCalculatorSettings = (settings: CalculatorSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving calculator settings:', error);
  }
};

export const getCalculationModeLabel = (mode: CalculationMode): string => {
  return CALCULATION_MODE_OPTIONS.find(o => o.value === mode)?.label ?? mode;
};
