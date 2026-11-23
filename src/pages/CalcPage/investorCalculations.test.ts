import { describe, expect, it } from "vitest";
import type { Sheet } from "@fortune-sheet/core";
import { calculateInvestors, type InvestorCalculation } from "./investorCalculations";

const sheet = {
  id: "sheet-1",
  name: "Расчёт",
  data: [
    [{ v: "Иванов Иван" }, { v: "Январь" }, { v: 100000 }, { v: 12000 }, { v: 2000 }],
    [null, { v: "Февраль" }, { v: 50000 }, { v: 7000 }, { v: 1000 }],
  ],
} as Sheet;

const range = (column: number, rowStart = 0, rowEnd = 1) => ({
  sheetId: "sheet-1", rowStart, rowEnd, columnStart: column, columnEnd: column,
});

describe("calculateInvestors", () => {
  it("создаёт кассу и историю из связанных диапазонов", () => {
    const calculation: InvestorCalculation = {
      id: "one",
      name: "Инвестор",
      fields: {
        fullName: range(0, 0, 0),
        period: range(1),
        investment: range(2),
        profit: range(3),
        payout: range(4),
      },
    };
    const [result] = calculateInvestors([sheet], [calculation]);
    expect(result.fullName).toBe("Иванов Иван");
    expect(result.investment).toBe(150000);
    expect(result.profit).toBe(19000);
    expect(result.payout).toBe(3000);
    expect(result.balance).toBe(166000);
    expect(result.entries).toHaveLength(2);
  });
});
