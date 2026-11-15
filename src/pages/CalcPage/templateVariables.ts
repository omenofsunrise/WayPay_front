import type { Sheet } from "@fortune-sheet/core";
import type {
  CalcMetricDefinition,
  CalcMetricOptions,
  CalcMetricQuery,
} from "../../api/types/calc";

export type DetectedMetricBinding = CalcMetricQuery & {
  sheetId: string;
  row: number;
  column: number;
  label: string;
  mode: "value" | "series";
  groupBy?: "day" | "month";
  rowCount?: number;
  source: "template";
};

type DetectionDefaults = {
  from?: string;
  to?: string;
  groupBy: "day" | "month";
};

export type TemplateDetectionResult = {
  bindings: DetectedMetricBinding[];
  unknown: string[];
  issues: string[];
};

const markerPattern = /^\s*\{\{?\s*([a-z_]+)((?:\s*;\s*[^{};=]+\s*=\s*[^{};]+)*)\s*\}\}?\s*$/i;

const parseParameters = (source: string): Map<string, string> => new Map(
  source.split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      return separator < 0
        ? [part.toLowerCase(), ""] as const
        : [part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim()] as const;
    }),
);

const resolveOption = (
  source: string | undefined,
  options: CalcMetricOptions["pools"],
) => {
  if (!source) return undefined;
  if (/^\d+$/.test(source)) return Number(source);
  return options.find((option) => option.name.trim().toLowerCase() === source.trim().toLowerCase())?.id;
};

const cellText = (cell: NonNullable<NonNullable<Sheet["data"]>[number]>[number]) => {
  if (!cell) return undefined;
  if (typeof cell.v === "string") return cell.v;
  return typeof cell.m === "string" ? cell.m : undefined;
};

export const detectTemplateVariables = (
  sheets: Sheet[],
  metrics: CalcMetricDefinition[],
  options: CalcMetricOptions,
  defaults: DetectionDefaults,
): TemplateDetectionResult => {
  const bindings: DetectedMetricBinding[] = [];
  const unknown: string[] = [];
  const issues: string[] = [];
  const metricByCode = new Map(metrics.map((metric) => [metric.code.toLowerCase(), metric]));

  sheets.forEach((sheet) => sheet.data?.forEach((row, rowIndex) => row?.forEach((cell, columnIndex) => {
    const text = cellText(cell);
    if (!text) return;
    const match = text.match(markerPattern);
    if (!match) return;

    let code = match[1].toLowerCase();
    const shorthandSeries = code.endsWith("_series");
    if (shorthandSeries) code = code.slice(0, -7);
    const metric = metricByCode.get(code);
    const reference = `${sheet.name}!R${rowIndex + 1}C${columnIndex + 1}`;
    if (!metric) {
      unknown.push(`${reference}: ${text.trim()}`);
      return;
    }

    const parameters = parseParameters(match[2]);
    const requestedMode = parameters.get("mode")?.toLowerCase();
    const mode = shorthandSeries || requestedMode === "series" ? "series" : "value";
    const requestedGroup = (parameters.get("group") ?? parameters.get("groupby"))?.toLowerCase();
    const groupBy = requestedGroup === "day" || requestedGroup === "month"
      ? requestedGroup
      : defaults.groupBy;

    const poolSource = parameters.get("pool");
    const investorSource = parameters.get("investor");
    const resolvedPoolId = resolveOption(poolSource, options.pools);
    const resolvedInvestorId = resolveOption(investorSource, options.investors);
    if (poolSource && !resolvedPoolId) issues.push(`${reference}: пул «${poolSource}» не найден`);
    if (investorSource && !resolvedInvestorId) issues.push(`${reference}: инвестор «${investorSource}» не найден`);

    const binding: DetectedMetricBinding = {
      code: metric.code,
      sheetId: sheet.id,
      row: rowIndex,
      column: columnIndex,
      label: metric.name,
      mode,
      source: "template",
      ...(mode === "series" && { groupBy, rowCount: 1 }),
      ...((parameters.get("from") ?? defaults.from) && { from: parameters.get("from") ?? defaults.from }),
      ...((parameters.get("to") ?? defaults.to) && { to: parameters.get("to") ?? defaults.to }),
      ...(resolvedPoolId && { poolId: resolvedPoolId }),
      ...(resolvedInvestorId && { investorId: resolvedInvestorId }),
    };
    if (metric.requiresInvestor && !binding.investorId) {
      issues.push(`${reference}: для «${metric.name}» укажите investor=имя или ID`);
    }
    if (mode === "series" && (!binding.from || !binding.to)) {
      issues.push(`${reference}: для отчёта укажите период в конструкторе`);
    }
    bindings.push(binding);
  })));

  return { bindings, unknown, issues };
};
