import type { Sheet } from "@fortune-sheet/core";

export type InvestorCalculationField =
  | "fullName"
  | "period"
  | "investment"
  | "profit"
  | "payout"
  | "balance";

export type CellRangeBinding = {
  sheetId: string;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
};

export type InvestorCalculation = {
  id: string;
  name: string;
  poolId?: number;
  fields: Partial<Record<InvestorCalculationField, CellRangeBinding>>;
};

export type InvestorCalculationEntry = {
  period: string;
  investment: number;
  profit: number;
  payout: number;
  balance?: number;
};

export type CalculatedInvestor = {
  calculationId: string;
  fullName: string;
  poolId?: number;
  investment: number;
  profit: number;
  payout: number;
  balance: number;
  entries: InvestorCalculationEntry[];
};

const cellValue = (sheet: Sheet, row: number, column: number) => {
  const cell = sheet.data?.[row]?.[column]
    ?? sheet.celldata?.find((item) => item.r === row && item.c === column)?.v;
  return cell?.v ?? cell?.m ?? "";
};

const valuesFromRange = (sheets: Sheet[], binding?: CellRangeBinding) => {
  if (!binding) return [];
  const sheet = sheets.find((item) => item.id === binding.sheetId);
  if (!sheet) return [];
  const values: unknown[] = [];
  for (let row = binding.rowStart; row <= binding.rowEnd; row += 1) {
    for (let column = binding.columnStart; column <= binding.columnEnd; column += 1) {
      values.push(cellValue(sheet, row, column));
    }
  }
  return values;
};

const textAt = (values: unknown[], index: number, fallback: string) => {
  const value = values[index] ?? (values.length === 1 ? values[0] : undefined);
  const text = value == null ? "" : String(value).trim();
  return text || fallback;
};

const numberAt = (values: unknown[], index: number) => {
  const value = values[index] ?? (values.length === 1 ? values[0] : undefined);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateInvestors = (
  sheets: Sheet[],
  calculations: InvestorCalculation[],
): CalculatedInvestor[] => calculations.flatMap((calculation) => {
  const values = Object.fromEntries(
    Object.entries(calculation.fields).map(([field, binding]) => [field, valuesFromRange(sheets, binding)]),
  ) as Partial<Record<InvestorCalculationField, unknown[]>>;
  const count = Math.max(1, ...Object.values(values).map((items) => items?.length ?? 0));
  const grouped = new Map<string, InvestorCalculationEntry[]>();

  for (let index = 0; index < count; index += 1) {
    const fullName = textAt(values.fullName ?? [], index, calculation.name || "Расчётный инвестор");
    const entry: InvestorCalculationEntry = {
      period: textAt(values.period ?? [], index, `Период ${index + 1}`),
      investment: numberAt(values.investment ?? [], index),
      profit: numberAt(values.profit ?? [], index),
      payout: numberAt(values.payout ?? [], index),
      ...(calculation.fields.balance && { balance: numberAt(values.balance ?? [], index) }),
    };
    grouped.set(fullName, [...(grouped.get(fullName) ?? []), entry]);
  }

  return [...grouped.entries()].map(([fullName, entries]) => {
    const investment = entries.reduce((sum, item) => sum + item.investment, 0);
    const profit = entries.reduce((sum, item) => sum + item.profit, 0);
    const payout = entries.reduce((sum, item) => sum + item.payout, 0);
    const explicitBalances = entries.map((item) => item.balance).filter((value): value is number => value != null);
    return {
      calculationId: calculation.id,
      fullName,
      poolId: calculation.poolId,
      investment,
      profit,
      payout,
      balance: explicitBalances.length ? explicitBalances.at(-1)! : investment + profit - payout,
      entries,
    };
  });
});
