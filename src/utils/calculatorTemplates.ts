export interface CalculatorTemplate {
  id: string;
  name: string;
  amount: string;
  months: string;
  initial: string;
  percent: string;
  round: string;
  startDate: string;
}

const STORAGE_KEY = 'calculator-templates';

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const normalizeTemplate = (raw: unknown): CalculatorTemplate | null => {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.id !== 'string' || typeof t.name !== 'string') return null;
  return {
    id: t.id,
    name: t.name,
    amount: asString(t.amount),
    months: asString(t.months),
    initial: asString(t.initial),
    percent: asString(t.percent),
    round: asString(t.round),
    startDate: asString(t.startDate),
  };
};

export const loadCalculatorTemplates = (): CalculatorTemplate[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeTemplate)
      .filter((t): t is CalculatorTemplate => t !== null);
  } catch (error) {
    console.error('Error reading calculator templates:', error);
    return [];
  }
};

export const saveCalculatorTemplates = (templates: CalculatorTemplate[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving calculator templates:', error);
  }
};

export const createTemplateId = (): string => {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};
