import { describe, expect, it } from "vitest";
import type { Sheet } from "@fortune-sheet/core";
import type { CalcMetricDefinition, CalcMetricOptions } from "../../api/types/calc";
import { detectTemplateVariables } from "./templateVariables";

const metrics: CalcMetricDefinition[] = [
  { code: "payment_income", name: "Приыбль с платежей", unit: "₽", requiresInvestor: false },
  { code: "capital", name: "Капитал инвестора", unit: "₽", requiresInvestor: true },
  { code: "incassa", name: "Инкасса", unit: "₽", requiresInvestor: false },
];

const options: CalcMetricOptions = {
  pools: [{ id: 12, name: "Основной пул" }],
  investors: [{ id: 34, name: "Иванов И.И." }],
};

const sheetWith = (value: string): Sheet => ({
  id: "sheet-1",
  name: "Отчёт",
  order: 0,
  row: 10,
  column: 10,
  data: [[{ v: value, m: value }]],
});

describe("detectTemplateVariables", () => {
  it("detects a scalar WayPay variable", () => {
    const result = detectTemplateVariables(
      [sheetWith("{payment_income}")], metrics, options, { groupBy: "month" },
    );

    expect(result.issues).toEqual([]);
    expect(result.unknown).toEqual([]);
    expect(result.bindings[0]).toMatchObject({
      code: "payment_income", sheetId: "sheet-1", row: 0, column: 0, mode: "value",
    });
  });

  it.each([
    ["{incassa}", "value"],
    ["{incassa_series}", "series"],
  ])("detects the Incassa variable %s", (marker, mode) => {
    const result = detectTemplateVariables(
      [sheetWith(marker)], metrics, options,
      { from: "2026-01-01", to: "2026-01-31", groupBy: "month" },
    );

    expect(result.issues).toEqual([]);
    expect(result.unknown).toEqual([]);
    expect(result.bindings[0]).toMatchObject({ code: "incassa", label: "Инкасса", mode });
  });

  it("resolves the pool and investor written in the template", () => {
    const result = detectTemplateVariables(
      [sheetWith("{capital;pool=Основной пул;investor=Иванов И.И.}")],
      metrics,
      options,
      { groupBy: "month" },
    );

    expect(result.issues).toEqual([]);
    expect(result.bindings[0]).toMatchObject({ poolId: 12, investorId: 34 });
  });

  it("detects a report and takes its period from the constructor", () => {
    const result = detectTemplateVariables(
      [sheetWith("{{payment_income_series}}")],
      metrics,
      options,
      { from: "2026-01-01", to: "2026-12-31", groupBy: "month" },
    );

    expect(result.issues).toEqual([]);
    expect(result.bindings[0]).toMatchObject({
      mode: "series", from: "2026-01-01", to: "2026-12-31", groupBy: "month",
    });
  });

  it("reports an unknown variable and a missing required investor", () => {
    const result = detectTemplateVariables(
      [sheetWith("{unknown_metric}")], metrics, options, { groupBy: "month" },
    );
    const missingInvestor = detectTemplateVariables(
      [sheetWith("{capital}")], metrics, options, { groupBy: "month" },
    );

    expect(result.unknown).toHaveLength(1);
    expect(missingInvestor.issues[0]).toContain("investor=");
  });
});
