import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import styled from "styled-components";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import type { Cell, CellWithRowAndCol, Sheet } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import calcService from "../../api/services/calcService";
import EmployeeService from "../../api/services/employeeService";
import CustomCalendar from "../../components/ui/fields/CustomCalendar";
import CustomSelect from "../../components/ui/fields/CustomSelect";
import { detectTemplateVariables } from "./templateVariables";
import type {
  CalcMetricDefinition,
  CalcMetricOptions,
  CalcMetricQuery,
  CalcMetricSeries,
  CalcSheetSummary,
  CalcSheetAccessRule,
  CalcAccessLevel,
} from "../../api/types/calc";
import type { Employee } from "../../api/types/employee";
import {
  calculateInvestors,
  type CellRangeBinding,
  type InvestorCalculation,
  type InvestorCalculationField,
} from "./investorCalculations";

type MetricBinding = CalcMetricQuery & {
  sheetId: string;
  row: number;
  column: number;
  label: string;
  mode?: "value" | "series";
  groupBy?: "day" | "month";
  rowCount?: number;
  source?: "template";
};

type CalcDocument = {
  version: 3;
  sheets: Sheet[];
  bindings: MetricBinding[];
  accessRules: CalcSheetAccessRule[];
  investorCalculations: InvestorCalculation[];
};

const MAX_DOCUMENT_BYTES = 10_000_000;

const requestErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (typeof response?.data === "string") return response.data;
  }
  return error instanceof Error ? error.message : fallback;
};

const createSheetId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `sheet-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const emptySheets = (): Sheet[] => [{
  id: createSheetId(),
  name: "Лист 1",
  order: 0,
  status: 1,
  row: 100,
  column: 26,
  data: [],
}];

const finiteIndex = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
};

const normalizeRangeBinding = (range: Partial<CellRangeBinding>): CellRangeBinding => {
  const rowStart = finiteIndex(range.rowStart);
  const columnStart = finiteIndex(range.columnStart);
  return {
    sheetId: typeof range.sheetId === "string" ? range.sheetId : "",
    rowStart,
    rowEnd: finiteIndex(range.rowEnd, rowStart),
    columnStart,
    columnEnd: finiteIndex(range.columnEnd, columnStart),
  };
};

const normalizeInvestorCalculation = (calculation: InvestorCalculation): InvestorCalculation => ({
  ...calculation,
  fields: Object.fromEntries(Object.entries(calculation.fields ?? {}).map(([field, range]) => [
    field,
    normalizeRangeBinding(range ?? {}),
  ])),
});

const bindingsForSheets = (bindings: MetricBinding[], sheets: Sheet[]): MetricBinding[] => {
  const sheetIds = new Set(sheets.map((sheet) => sheet.id));
  return bindings.filter((binding) => binding?.sheetId && sheetIds.has(binding.sheetId));
};

const parseDocument = (content: string): CalcDocument => {
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed?.sheets)) throw new Error("Некорректное содержимое книги");
  const sheets: Sheet[] = parsed.sheets.length ? parsed.sheets : emptySheets();
  return {
    version: 3,
    sheets,
    bindings: Array.isArray(parsed.bindings) ? bindingsForSheets(parsed.bindings, sheets) : [],
    accessRules: Array.isArray(parsed.accessRules) ? parsed.accessRules : [],
    investorCalculations: Array.isArray(parsed.investorCalculations)
      ? parsed.investorCalculations.map(normalizeInvestorCalculation)
      : [],
  };
};

const toSparseSheet = (sheet: Sheet): Sheet => {
  if (!sheet.data) return { ...sheet, data: undefined, celldata: sheet.celldata ?? [] };
  const celldata: CellWithRowAndCol[] = [];
  let columnCount = sheet.column ?? 0;
  sheet.data.forEach((row, r) => {
    if (!row) return;
    columnCount = Math.max(columnCount, row.length);
    row.forEach((cell, c) => {
      if (cell != null) celldata.push({ r, c, v: cell });
    });
  });
  return {
    ...sheet,
    row: Math.max(sheet.row ?? 0, sheet.data.length) || undefined,
    column: columnCount || undefined,
    data: undefined,
    celldata,
  };
};

const sheetToXlsx = (sheet: Sheet) => {
  const ws: XLSX.WorkSheet = {};
  let maxRow = 0;
  let maxColumn = 0;
  (toSparseSheet(sheet).celldata ?? []).forEach(({ r, c, v: cell }) => {
    if (!cell || (cell.v == null && !cell.f)) return;
    maxRow = Math.max(maxRow, r);
    maxColumn = Math.max(maxColumn, c);
    const value = cell.v;
    const target: XLSX.CellObject = {
      v: value as never,
      t: typeof value === "number" ? "n" : typeof value === "boolean" ? "b" : "s",
    };
    if (cell.f) target.f = cell.f.replace(/^=/, "");
    ws[XLSX.utils.encode_cell({ r, c })] = target;
  });
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxColumn } });
  const merges = Object.values(sheet.config?.merge ?? {}).map((merge) => ({
    s: { r: merge.r, c: merge.c },
    e: { r: merge.r + merge.rs - 1, c: merge.c + merge.cs - 1 },
  }));
  if (merges.length) ws["!merges"] = merges;
  const columnWidths = sheet.config?.columnlen ?? {};
  if (Object.keys(columnWidths).length) {
    ws["!cols"] = Array.from({ length: maxColumn + 1 }, (_, c) => ({ wpx: columnWidths[String(c)] }));
  }
  const rowHeights = sheet.config?.rowlen ?? {};
  if (Object.keys(rowHeights).length) {
    ws["!rows"] = Array.from({ length: maxRow + 1 }, (_, r) => ({ hpx: rowHeights[String(r)] }));
  }
  return ws;
};

const themeColors = ["#ffffff", "#000000", "#e7e6e6", "#44546a", "#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"];

const applyTint = (hex: string, tint = 0) => {
  if (!tint) return hex;
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const adjusted = channels.map((channel) => Math.round(tint > 0
    ? channel + (255 - channel) * tint
    : channel * (1 + tint)));
  return `#${adjusted.map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0")).join("")}`;
};

const excelColor = (color: ExcelJS.Color | undefined, fallback?: string) => {
  if (!color) return fallback;
  const base = color.argb
    ? `#${color.argb.slice(-6)}`
    : color.theme != null
      ? themeColors[color.theme] ?? fallback
      : fallback;
  return base ? applyTint(base, color.tint ?? 0) : fallback;
};

const borderStyle = (style?: ExcelJS.BorderStyle) => ({
  thin: "1", hair: "2", dotted: "3", dashed: "4", dashDot: "5", dashDotDot: "6",
  double: "7", medium: "8", mediumDashed: "9", mediumDashDot: "10",
  mediumDashDotDot: "11", slantDashDot: "12", thick: "13",
}[style ?? ""] ?? "1");

const objectDisplayValue = (value: object) => {
  if ("error" in value && typeof value.error === "string") return value.error;
  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part: { text?: string }) => part.text ?? "").join("");
  }
  if ("text" in value && typeof value.text === "string") return value.text;
  return "";
};

const safeCellText = (cell: ExcelJS.Cell) => {
  try {
    const text = cell.text ?? "";
    if (text !== "[object Object]") return text;
  } catch {
    // Some formula cells throw while converting a null cached result to text.
  }
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toLocaleDateString("ru-RU");
  if ("result" in value) {
    const result = value.result;
    if (result == null) return "";
    return typeof result === "object" ? objectDisplayValue(result) : String(result);
  }
  return objectDisplayValue(value);
};

const excelValue = (cell: ExcelJS.Cell): Cell["v"] => {
  const value = cell.value;
  if (value == null) return undefined;
  if (value instanceof Date) return (value.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if ("result" in value) {
    const result = value.result;
    if (result instanceof Date) return (result.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000;
    if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") return result;
    return result == null ? undefined : objectDisplayValue(result);
  }
  if ("richText" in value) return value.richText.map((part) => part.text).join("");
  if ("text" in value) return value.text;
  if ("error" in value) return value.error;
  return safeCellText(cell);
};

const formattedCellText = (cell: ExcelJS.Cell, value: Cell["v"]) => {
  if (typeof value === "number" && cell.numFmt) {
    try {
      return XLSX.SSF.format(cell.numFmt, value);
    } catch {
      // Unsupported custom formats fall back to ExcelJS' textual value.
    }
  }
  return safeCellText(cell);
};

const xlsxToSheets = async (buffer: ArrayBuffer): Promise<Sheet[]> => {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(buffer as never);
  return book.worksheets.map((worksheet, index) => {
    const maxRow = Math.max(worksheet.rowCount, 1);
    const maxColumn = Math.max(worksheet.columnCount, 1);
    const data: (Cell | null)[][] = Array.from(
      { length: maxRow },
      () => Array.from({ length: maxColumn }, () => null),
    );
    const borderInfo: NonNullable<NonNullable<Sheet["config"]>["borderInfo"]> = [];
    worksheet.eachRow({ includeEmpty: true }, (sourceRow, rowNumber) => {
      sourceRow.eachCell({ includeEmpty: true }, (source, columnNumber) => {
        const r = rowNumber - 1;
        const c = columnNumber - 1;
        const fill = source.fill?.type === "pattern" && source.fill.pattern !== "none"
          ? excelColor(source.fill.fgColor) : undefined;
        const fontColor = excelColor(source.font?.color);
        const formula = source.formula;
        const value = excelValue(source);
        const hasStyle = source.styleId > 0 || fill || fontColor || source.border;
        if (value != null || formula || hasStyle) {
          const horizontal = source.alignment?.horizontal;
          const vertical = source.alignment?.vertical;
          data[r][c] = {
            v: value,
            m: formattedCellText(source, value),
            ...(formula && { f: `=${formula.replace(/^=/, "")}` }),
            ...(fill && { bg: fill }),
            ...(fontColor && { fc: fontColor }),
            ...(source.font?.name && { ff: source.font.name }),
            ...(source.font?.size && { fs: source.font.size }),
            ...(source.font?.bold && { bl: 1 }),
            ...(source.font?.italic && { it: 1 }),
            ...(source.font?.underline && { un: 1 }),
            ...(source.font?.strike && { cl: 1 }),
            ...(horizontal && { ht: horizontal === "center" || horizontal === "centerContinuous" ? 0 : horizontal === "right" ? 2 : 1 }),
            ...(vertical && { vt: vertical === "middle" ? 0 : vertical === "top" ? 1 : 2 }),
            ...(source.alignment?.wrapText && { tb: "2" }),
            ...(typeof source.alignment?.textRotation === "number" && { rt: source.alignment.textRotation }),
            ...(source.numFmt && { ct: { fa: source.numFmt, t: typeof value === "number" ? "n" : "s" } }),
          };
        }
        const borders: Record<string, { color: string; style: string }> = {};
        (["left", "right", "top", "bottom"] as const).forEach((side) => {
          const border = source.border?.[side];
          if (!border?.style) return;
          borders[side[0]] = {
            color: excelColor(border.color, "#000000")!,
            style: borderStyle(border.style),
          };
        });
        if (Object.keys(borders).length) borderInfo.push({
          rangeType: "cell", value: { row_index: r, col_index: c, ...borders },
        });
      });
    });
    const merges = worksheet.model.merges ?? [];
    const merge = Object.fromEntries(merges.map((address) => {
      const range = XLSX.utils.decode_range(address);
      const value = { r: range.s.r, c: range.s.c, rs: range.e.r - range.s.r + 1, cs: range.e.c - range.s.c + 1 };
      return [`${value.r}_${value.c}`, value];
    }));
    const rowlen: Record<string, number> = {};
    const rowhidden: Record<string, number> = {};
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (row.height) rowlen[String(rowNumber - 1)] = row.height * 96 / 72;
      if (row.hidden) rowhidden[String(rowNumber - 1)] = 0;
    });
    const columnlen: Record<string, number> = {};
    const colhidden: Record<string, number> = {};
    worksheet.columns.forEach((column, columnIndex) => {
      if (column.width) columnlen[String(columnIndex)] = Math.max(12, column.width * 7 + 5);
      if (column.hidden) colhidden[String(columnIndex)] = 0;
    });
    return {
      id: createSheetId(), name: worksheet.name, order: index, status: index === 0 ? 1 : 0,
      row: Math.max(maxRow + 10, 100), column: Math.max(maxColumn + 5, 26), data,
      config: { merge, columnlen, rowlen, rowhidden, colhidden, borderInfo },
      showGridLines: worksheet.properties.showGridLines !== false,
    };
  });
};

export default function CalcPage() {
  const workbookRef = useRef<WorkbookInstance>(null);
  const workbookReadyRef = useRef<{ version: number; resolve: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const updatingMetricsRef = useRef(false);
  const [sheets, setSheets] = useState<Sheet[]>(emptySheets);
  const [workbookVersion, setWorkbookVersion] = useState(0);
  const [bindings, setBindings] = useState<MetricBinding[]>([]);
  const [savedSheets, setSavedSheets] = useState<CalcSheetSummary[]>([]);
  const [savedSheetsStatus, setSavedSheetsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingInitialSheets, setLoadingInitialSheets] = useState(true);
  const [openingSheet, setOpeningSheet] = useState(false);
  const [metrics, setMetrics] = useState<CalcMetricDefinition[]>([]);
  const [metricOptions, setMetricOptions] = useState<CalcMetricOptions>({ pools: [], investors: [] });
  const [currentId, setCurrentId] = useState<number>();
  const [canEdit, setCanEdit] = useState(true);
  const [accessLevel, setAccessLevel] = useState<CalcAccessLevel>("owner");
  const [canManageAccess, setCanManageAccess] = useState(true);
  const [accessRules, setAccessRules] = useState<CalcSheetAccessRule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<"edit" | "formulas" | "view">("view");
  const [investorCalculations, setInvestorCalculations] = useState<InvestorCalculation[]>([]);
  const [calculationName, setCalculationName] = useState("");
  const [calculationPoolId, setCalculationPoolId] = useState("");
  const [calculationField, setCalculationField] = useState<InvestorCalculationField>("fullName");
  const [calculationFields, setCalculationFields] = useState<InvestorCalculation["fields"]>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [name, setName] = useState("Новая таблица");
  const [isShared, setIsShared] = useState(false);
  const [metricCode, setMetricCode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [poolId, setPoolId] = useState("");
  const [investorId, setInvestorId] = useState("");
  const [insertMode, setInsertMode] = useState<"value" | "series">("value");
  const [groupBy, setGroupBy] = useState<"day" | "month">("month");
  const [working, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedMetric = useMemo(() => metrics.find((x) => x.code === metricCode), [metrics, metricCode]);
  const templateCode = selectedMetric?.code ?? "код_показателя";
  const busy = working || openingSheet || savedSheetsStatus === "loading";
  const workbookSheets = useMemo(() => sheets.map(toSparseSheet), [sheets]);
  const calculatedInvestors = useMemo(
    () => calculateInvestors(sheets, investorCalculations),
    [sheets, investorCalculations],
  );

  const handleWorkbookChange = useCallback((nextSheets: Sheet[]) => {
    const pending = workbookReadyRef.current;
    if (pending && pending.version !== workbookVersion) return;
    setSheets(nextSheets);
    if (pending) {
      workbookReadyRef.current = null;
      pending.resolve();
    }
  }, [workbookVersion]);

  const replaceWorkbook = (nextSheets: Sheet[]): Promise<void> => {
    const version = workbookVersion + 1;
    const ready = new Promise<void>((resolve) => {
      workbookReadyRef.current = { version, resolve };
    });
    setSheets(nextSheets);
    setWorkbookVersion(version);
    return ready;
  };

  const reloadList = async (signal?: AbortSignal) => {
    setSavedSheetsStatus("loading");
    try {
      const items = await calcService.list(signal);
      if (signal?.aborted) return;
      setSavedSheets(items);
      setSavedSheetsStatus("ready");
      return items;
    } catch {
      if (!signal?.aborted) setSavedSheetsStatus("error");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void reloadList(controller.signal).then((items) => {
      if (controller.signal.aborted) return;
      setLoadingInitialSheets(false);
      if (items?.length) void openSheet(items[0].id, controller.signal);
    });
    return () => controller.abort();
    // При входе открываем последний сохранённый документ с его сохранёнными параметрами.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([calcService.options().then(setMetricOptions), EmployeeService.getEmployees({ page: 1, pageSize: 200 })
      .then((page) => setEmployees(page.items)), calcService.catalog().then((items) => {
      setMetrics(items);
      setMetricCode(items[0]?.code ?? "");
    })]).catch(() => setMessage((current) => current || "Не удалось загрузить данные конструктора"));
  }, []);

  useEffect(() => {
    const resizeWorkbook = () => window.dispatchEvent(new Event("resize"));
    const frame = window.requestAnimationFrame(resizeWorkbook);
    const timer = window.setTimeout(resizeWorkbook, 120);
    if (!isFullscreen) return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
    const close = (event: KeyboardEvent) => event.key === "Escape" && setIsFullscreen(false);
    window.addEventListener("keydown", close);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("keydown", close);
    };
  }, [isFullscreen]);

  const serialize = (currentSheets: Sheet[] = sheets) => JSON.stringify({
    version: 3,
    sheets: currentSheets.map(toSparseSheet),
    bindings: bindingsForSheets(bindings, currentSheets),
    accessRules,
    investorCalculations,
  } satisfies CalcDocument);

  const save = async () => {
    if (!canEdit) return;
    // onChange у таблицы приходит асинхронно, поэтому перед сохранением берём
    // актуальный снимок напрямую из Workbook, а не из предыдущего React state.
    const currentSheets = workbookRef.current?.getAllSheets() ?? sheets;
    setSheets(currentSheets);
    const content = serialize(currentSheets);
    if (new Blob([content]).size > MAX_DOCUMENT_BYTES) {
      setMessage("Таблица слишком большая для сохранения. Максимальный размер — 10 МБ");
      return;
    }
    setBusy(true);
    try {
      const request = { name, content, isShared };
      const result = currentId ? await calcService.update(currentId, request) : await calcService.create(request);
      setCurrentId(result.id);
      setSavedSheets((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      setMessage("Таблица сохранена");
      await reloadList();
    } catch (error) {
      setMessage(requestErrorMessage(error, "Не удалось сохранить таблицу"));
    } finally { setBusy(false); }
  };

  const openSheet = async (id: number, signal?: AbortSignal) => {
    setOpeningSheet(true);
    setMessage("Загружаем таблицу…");
    try {
      const result = await calcService.get(id, signal);
      if (signal?.aborted) return;
      const document = parseDocument(result.content);
      setCurrentId(result.id);
      setName(result.name);
      setIsShared(result.isShared);
      setCanEdit(result.canEdit);
      setAccessLevel(result.accessLevel ?? (result.canEdit ? "owner" : "view"));
      setCanManageAccess(result.canManageAccess ?? false);
      setBindings(document.bindings);
      setAccessRules(document.accessRules);
      setInvestorCalculations(document.investorCalculations);
      const ready = replaceWorkbook(document.sheets);
      setMessage(document.bindings.length
        ? "Таблица открыта. Обновляем показатели WayPay…"
        : result.canEdit ? "Таблица открыта" : "Открыт общий документ — только просмотр");
      await ready;
      if (!signal?.aborted && workbookRef.current && document.bindings.length) {
        await refreshMetrics(document.bindings, true, result.canEdit);
      }
    } catch (error) {
      if (signal?.aborted) return;
      if (isAxiosError(error) && error.response?.status === 404) {
        setSavedSheets((items) => items.filter((item) => item.id !== id));
        setMessage("Таблица не найдена или доступ к ней закрыт");
      } else {
        setMessage("Не удалось открыть таблицу");
      }
    } finally {
      if (!signal?.aborted) setOpeningSheet(false);
    }
  };

  const createNew = () => {
    const next = emptySheets();
    setCurrentId(undefined);
    setName("Новая таблица");
    setIsShared(false);
    setCanEdit(true);
    setAccessLevel("owner");
    setCanManageAccess(true);
    setAccessRules([]);
    setInvestorCalculations([]);
    setCalculationFields({});
    setCalculationName("");
    setBindings([]);
    setSheets(next);
    setWorkbookVersion((version) => version + 1);
  };

  const deleteSheet = async () => {
    if (!currentId || !canManageAccess || !window.confirm(`Удалить таблицу «${name}»?`)) return;
    setBusy(true);
    try {
      await calcService.remove(currentId);
      createNew();
      setSavedSheets((items) => items.filter((item) => item.id !== currentId));
      await reloadList();
      setMessage("Таблица удалена");
    } catch (error) {
      setMessage(requestErrorMessage(error, "Не удалось удалить таблицу"));
    } finally {
      setBusy(false);
    }
  };

  const metricQuery = (): CalcMetricQuery => ({
    code: metricCode,
    ...(from && { from }), ...(to && { to }),
    ...(poolId && { poolId: Number(poolId) }),
    ...(investorId && { investorId: Number(investorId) }),
  });

  const writeSeries = (series: CalcMetricSeries, sheetId: string, row: number, column: number) => {
    const values = [
      ["Период", `${series.name}, ${series.unit}`],
      ...series.points.map((point) => [point.label, point.value]),
    ];
    updatingMetricsRef.current = true;
    workbookRef.current?.setCellValuesByRange(values, {
      row: [row, row + values.length - 1],
      column: [column, column + 1],
    }, { id: sheetId });
    workbookRef.current?.setCellFormatByRange("bl", 1, {
      row: [row, row], column: [column, column + 1],
    }, { id: sheetId });
    workbookRef.current?.setCellFormatByRange("bg", "#eaf8f8", {
      row: [row, row], column: [column, column + 1],
    }, { id: sheetId });
    updatingMetricsRef.current = false;
    return values.length;
  };

  const insertMetric = async () => {
    const selection = workbookRef.current?.getSelection()?.[0];
    const activeSheet = workbookRef.current?.getSheet();
    if (!selection || !activeSheet?.id) return setMessage("Сначала выберите ячейку");
    if (selectedMetric?.requiresInvestor && !investorId) return setMessage("Для этого показателя выберите инвестора");
    if (insertMode === "series" && (!from || !to)) return setMessage("Для отчёта укажите даты начала и окончания");
    setBusy(true);
    try {
      const row = selection.row[0];
      const column = selection.column[0];
      let binding: MetricBinding;
      if (insertMode === "series") {
        const series = await calcService.metricSeries({
          ...metricQuery(), from, to, groupBy,
        });
        const rowCount = writeSeries(series, activeSheet.id, row, column);
        binding = {
          ...metricQuery(), from, to, groupBy, mode: "series", rowCount,
          sheetId: activeSheet.id, row, column, label: series.name,
        };
      } else {
        const metric = await calcService.metric(metricQuery());
        updatingMetricsRef.current = true;
        workbookRef.current?.setCellValue(row, column, metric.value, { id: activeSheet.id });
        updatingMetricsRef.current = false;
        binding = {
          ...metricQuery(), mode: "value", sheetId: activeSheet.id,
          row, column, label: metric.name, rowCount: 1,
        };
      }
      setBindings((old) => [...old.filter((x) => !(x.sheetId === binding.sheetId && x.row === row && x.column === column)), binding]);
      setSheets(workbookRef.current?.getAllSheets() ?? sheets);
      setMessage(insertMode === "series" ? `${binding.label}: отчёт сформирован` : `${binding.label} добавлен в выбранную ячейку`);
    } catch (error) { setMessage(requestErrorMessage(error, "Не удалось получить показатель")); }
    finally { setBusy(false); }
  };

  const refreshMetrics = async (
    items: MetricBinding[] = bindings,
    automatic = false,
    editable = canEdit,
  ) => {
    if (!items.length) return;
    const workbook = workbookRef.current;
    if (!workbook) return;
    const availableBindings = bindingsForSheets(items, workbook.getAllSheets());
    if (availableBindings.length !== items.length) setBindings(availableBindings);
    if (!availableBindings.length) {
      setMessage("В таблице нет привязок к доступным листам");
      return;
    }
    setBusy(true);
    try {
      const updatedBindings = [...availableBindings];
      for (let index = 0; index < availableBindings.length; index += 1) {
        const binding = availableBindings[index];
        const { sheetId, row, column, mode, groupBy: bindingGroup } = binding;
        const bindingFrom = binding.source === "template" ? from || binding.from : binding.from;
        const bindingTo = binding.source === "template" ? to || binding.to : binding.to;
        const query: CalcMetricQuery = {
          code: binding.code,
          ...(bindingFrom && { from: bindingFrom }),
          ...(bindingTo && { to: bindingTo }),
          ...(binding.poolId && { poolId: binding.poolId }),
          ...(binding.investorId && { investorId: binding.investorId }),
        };
        if (mode === "series") {
          if (!query.from || !query.to) throw new Error("Для отчёта укажите даты «С» и «По»");
          const series = await calcService.metricSeries({
            ...query, from: query.from, to: query.to, groupBy: bindingGroup ?? "month",
          });
          const rowCount = writeSeries(series, sheetId, row, column);
          updatedBindings[index] = { ...binding, ...query, rowCount };
        } else {
          const metric = await calcService.metric(query);
          updatingMetricsRef.current = true;
          workbookRef.current?.setCellValue(row, column, metric.value, { id: sheetId });
          updatingMetricsRef.current = false;
          updatedBindings[index] = { ...binding, ...query };
        }
      }
      setBindings(updatedBindings);
      setSheets(workbookRef.current?.getAllSheets() ?? sheets);
      setMessage(automatic
        ? `${editable ? "Таблица открыта" : "Открыт общий документ — только просмотр"}. Показатели обновлены: ${availableBindings.length}`
        : `Обновлено показателей: ${availableBindings.length}`);
    } catch (error) {
      setMessage(requestErrorMessage(error, automatic
        ? "Таблица открыта, но показатели WayPay обновить не удалось"
        : "Не все показатели удалось обновить"));
    }
    finally {
      updatingMetricsRef.current = false;
      setBusy(false);
    }
  };

  const exportXlsx = () => {
    const book = XLSX.utils.book_new();
    (workbookRef.current?.getAllSheets() ?? sheets).forEach((sheet) =>
      XLSX.utils.book_append_sheet(book, sheetToXlsx(sheet), sheet.name.slice(0, 31))
    );
    XLSX.writeFile(book, `${name || "WayPay"}.xlsx`);
  };

  const importXlsx = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage("Импортируем Excel…");
    try {
      const next = await xlsxToSheets(await file.arrayBuffer());
      const importedCells = next.reduce((total, sheet) => total +
        (sheet.data ?? []).reduce((sheetTotal, row) => sheetTotal +
          (row ?? []).filter(Boolean).length, 0), 0);
      if (!importedCells) {
        setMessage("В Excel-файле не найдено заполненных ячеек");
        return;
      }
      const detection = detectTemplateVariables(next, metrics, metricOptions, {
        ...(from && { from }),
        ...(to && { to }),
        groupBy,
      });
      const ready = replaceWorkbook(next);
      setBindings(detection.bindings);
      const details = [
        `Excel импортирован: ${next.length} листов, ${importedCells} заполненных ячеек`,
        detection.bindings.length ? `переменных WayPay: ${detection.bindings.length}` : "",
        detection.unknown.length ? `неизвестных переменных: ${detection.unknown.length}` : "",
        detection.issues[0] ?? "",
      ].filter(Boolean).join(" · ");
      setMessage(details);
      await ready;
      if (detection.bindings.length && !detection.unknown.length && !detection.issues.length) {
        await refreshMetrics(detection.bindings, true, true);
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : "неизвестная ошибка";
      setMessage(`Не удалось импортировать Excel: ${details}`);
    } finally {
      setBusy(false);
    }
  };

  const addAccessRule = () => {
    const employeeId = Number(selectedEmployeeId);
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return setMessage("Выберите сотрудника");
    setAccessRules((old) => [
      ...old.filter((rule) => rule.employeeId !== employeeId),
      { employeeId, employeeName: employee.fullName, level: selectedAccessLevel, sheetIds: sheets.map((sheet) => sheet.id).filter(Boolean) as string[] },
    ]);
    setSelectedEmployeeId("");
  };

  const bindCalculationField = () => {
    const selection = workbookRef.current?.getSelection()?.[0];
    const activeSheet = workbookRef.current?.getSheet();
    if (!selection || !activeSheet?.id) return setMessage("Выберите диапазон в таблице");
    const rowStart = finiteIndex(selection.row?.[0]);
    const columnStart = finiteIndex(selection.column?.[0]);
    const binding: CellRangeBinding = {
      sheetId: activeSheet.id,
      rowStart,
      rowEnd: finiteIndex(selection.row?.[1], rowStart),
      columnStart,
      columnEnd: finiteIndex(selection.column?.[1], columnStart),
    };
    setCalculationFields((old) => ({ ...old, [calculationField]: binding }));
    setMessage("Диапазон привязан к переменной");
  };

  const saveInvestorCalculation = () => {
    if (!calculationName.trim() && !calculationFields.fullName) return setMessage("Укажите название карточки или привяжите ФИО");
    if (!calculationFields.investment && !calculationFields.profit) return setMessage("Привяжите инвестиции или прибыль");
    setInvestorCalculations((old) => [...old, {
      id: createSheetId(),
      name: calculationName.trim() || "Расчётный инвестор",
      ...(calculationPoolId && { poolId: Number(calculationPoolId) }),
      fields: calculationFields,
    }]);
    setCalculationName("");
    setCalculationPoolId("");
    setCalculationFields({});
    const selectedPool = metricOptions.pools.find((pool) => pool.id === Number(calculationPoolId));
    setMessage(selectedPool
      ? `Карточка создана и привязана к пулу «${selectedPool.name}». Нажмите «Сохранить»`
      : "Карточка создана без привязки к пулу. Нажмите «Сохранить»");
  };

  const changeCalculationPool = (calculationId: string, value: string) => {
    const nextPoolId = value ? Number(value) : undefined;
    setInvestorCalculations((old) => old.map((calculation) => calculation.id === calculationId
      ? { ...calculation, poolId: nextPoolId }
      : calculation));
    const pool = metricOptions.pools.find((item) => item.id === nextPoolId);
    setMessage(pool
      ? `Расчёт привязан к пулу «${pool.name}». Нажмите «Сохранить»`
      : "Привязка расчёта к пулу удалена. Нажмите «Сохранить»");
  };

  if (loadingInitialSheets) {
    return <Page $fullscreen={false}>
      <Notice role="status">Загружаем сохранённые таблицы…</Notice>
    </Page>;
  }

  return <Page $fullscreen={isFullscreen}>
    {!isFullscreen && <Header>
      <div><Title>Конструктор</Title><Subtitle>Таблицы, формулы и актуальные показатели WayPay</Subtitle></div>
      <Actions>
        <Button onClick={createNew} disabled={busy}>Новая</Button>
        <Button onClick={() => fileRef.current?.click()} disabled={busy}>Импорт XLSX</Button>
        <Button onClick={exportXlsx} disabled={openingSheet}>Экспорт XLSX</Button>
        <Button onClick={() => setIsFullscreen((value) => !value)}>{isFullscreen ? "Выйти из полного экрана" : "На весь экран"}</Button>
        <DangerButton onClick={deleteSheet} disabled={busy || !currentId || !canManageAccess}>Удалить</DangerButton>
        <PrimaryButton onClick={save} disabled={busy || !canEdit}>{busy ? "Подождите…" : "Сохранить"}</PrimaryButton>
        <input ref={fileRef} hidden type="file" accept=".xlsx,.xls" onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          void importXlsx(file);
        }} />
      </Actions>
    </Header>}
    {isFullscreen && <FullscreenExitButton onClick={() => setIsFullscreen(false)}>Выйти из полного экрана</FullscreenExitButton>}
    {!isFullscreen && message && <Notice role="status">{message}</Notice>}
    {!isFullscreen && <DocumentBar>
      <Input value={name} onChange={(e) => setName(e.target.value)} disabled={openingSheet || !canManageAccess} aria-label="Название таблицы" />
      <label><input type="checkbox" checked={isShared} disabled={openingSheet || !canManageAccess} onChange={(e) => setIsShared(e.target.checked)} /> Доступна компании</label>
      <SavedSheetSelect>
        <CustomSelect
          value={currentId?.toString() ?? ""}
          placeholder={savedSheets.length ? "Открыть сохранённую…"
            : savedSheetsStatus === "loading" ? "Загружаем список…"
              : savedSheetsStatus === "error" ? "Список недоступен" : "Нет сохранённых таблиц"}
          disabled={busy || savedSheetsStatus === "loading" || !savedSheets.length}
          dropdownInPortal
          onChange={(e) => e.target.value && void openSheet(Number(e.target.value))}
          options={savedSheets.map((item) => ({
            value: item.id.toString(),
            label: `${item.name}${item.canEdit ? "" : " · общий"}`,
          }))}
        />
      </SavedSheetSelect>
      {savedSheetsStatus === "error" && <>
        <Hint role="status">Не удалось загрузить список таблиц</Hint>
        <Button onClick={() => void reloadList()} disabled={busy}>Повторить</Button>
      </>}
    </DocumentBar>}
    <Workspace $fullscreen={isFullscreen} inert={openingSheet || working}>
      <GridCard $fullscreen={isFullscreen}><Workbook
        key={workbookVersion}
        ref={workbookRef}
        data={workbookSheets}
        onChange={handleWorkbookChange}
        lang="ru"
        allowEdit={canEdit}
        hooks={{
          beforeUpdateCell: (row, column, value) => {
            if (updatingMetricsRef.current) return true;
            if (accessLevel === "formulas") {
              const current = workbookRef.current?.getCellsByRange({ row: [row, row], column: [column, column] })?.[0]?.[0];
              if (!value?.f && !current?.f) {
                setMessage("Для вас разрешено изменять только формулы");
                return false;
              }
            }
            const sheetId = workbookRef.current?.getSheet()?.id;
            const managed = bindings.some((x) => {
              if (x.sheetId !== sheetId) return false;
              if (x.mode === "series") {
                return row >= x.row && row < x.row + (x.rowCount ?? 1) &&
                  column >= x.column && column <= x.column + 1;
              }
              return x.row === row && x.column === column;
            });
            if (managed) setMessage("Ячейка связана с показателем WayPay. Удалите привязку, чтобы изменить её вручную");
            return !managed;
          },
        }}
      /></GridCard>
      {!isFullscreen && <Panel>
        <PanelTitle>Показатели WayPay</PanelTitle>
        <Hint>Выберите ячейку и показатель. Значение придёт с сервера и сможет обновляться.</Hint>
        <TemplateHint>
          В Excel укажите <code>{`{${templateCode}}`}</code> для одного значения или <code>{`{${templateCode}_series}`}</code> для отчёта.
          Внутри скобок можно добавить фильтры <code>{";pool=Название;investor=Имя"}</code>.
          После импорта переменные заполнятся автоматически, период берётся из полей «С» и «По».
        </TemplateHint>
        <Label>Показатель</Label>
        <CustomSelect
          value={metricCode}
          dropdownInPortal
          onChange={(e) => setMetricCode(e.target.value)}
          options={metrics.map((item) => ({ value: item.code, label: `${item.name}, ${item.unit}` }))}
        />
        <Label>Результат</Label>
        <CustomSelect<"value" | "series">
          value={insertMode}
          dropdownInPortal
          onChange={(e) => setInsertMode(e.target.value)}
          options={[
            { value: "value", label: "Одно значение" },
            { value: "series", label: "Отчёт по периодам" },
          ]}
        />
        {insertMode === "series" && <>
          <Label>Группировка</Label>
          <CustomSelect<"day" | "month">
            value={groupBy}
            dropdownInPortal
            onChange={(e) => setGroupBy(e.target.value)}
            options={[
              { value: "month", label: "По месяцам" },
              { value: "day", label: "По дням" },
            ]}
          />
        </>}
        <TwoColumns>
          <div><Label>С</Label><CustomCalendar prefix="" value={from} onChange={setFrom} /></div>
          <div><Label>По</Label><CustomCalendar prefix="" value={to} onChange={setTo} /></div>
        </TwoColumns>
        <Label>Пул (необязательно)</Label>
        <CustomSelect
          value={poolId}
          placeholder="Вся компания"
          dropdownInPortal
          onChange={(e) => { setPoolId(e.target.value); setInvestorId(""); }}
          options={[
            { value: "", label: "Вся компания" },
            ...metricOptions.pools.map((item) => ({ value: item.id.toString(), label: item.name })),
          ]}
        />
        <Label>Инвестор {selectedMetric?.requiresInvestor ? "*" : "(необязательно)"}</Label>
        <CustomSelect
          value={investorId}
          placeholder="Все инвесторы"
          dropdownInPortal
          onChange={(e) => setInvestorId(e.target.value)}
          options={[
            { value: "", label: "Все инвесторы" },
            ...metricOptions.investors.map((item) => ({ value: item.id.toString(), label: item.name })),
          ]}
        />
        <PrimaryButton onClick={insertMetric} disabled={busy || !canEdit}>{insertMode === "series" ? "Сформировать отчёт" : "Вставить в ячейку"}</PrimaryButton>
        <Button onClick={() => void refreshMetrics()} disabled={busy || !bindings.length}>Обновить все ({bindings.length})</Button>
        {canManageAccess && <AccessSection>
          <PanelTitle>Доступ сотрудников</PanelTitle>
          <Hint>Можно разрешить просмотр, полное редактирование или только изменение формул. Для каждого сотрудника выбираются доступные листы.</Hint>
          <CustomSelect value={selectedEmployeeId} placeholder="Сотрудник" dropdownInPortal onChange={(e) => setSelectedEmployeeId(e.target.value)} options={employees.map((employee) => ({ value: employee.id.toString(), label: employee.fullName }))} />
          <CustomSelect value={selectedAccessLevel} dropdownInPortal onChange={(e) => setSelectedAccessLevel(e.target.value as "edit" | "formulas" | "view")} options={[
            { value: "edit", label: "Может редактировать" },
            { value: "formulas", label: "Может менять формулы" },
            { value: "view", label: "Только просмотр" },
          ]} />
          <Button onClick={addAccessRule}>Добавить доступ</Button>
          <AccessList>{accessRules.map((rule) => <AccessRule key={rule.employeeId}>
            <strong>{rule.employeeName ?? `Сотрудник №${rule.employeeId}`}</strong>
            <small>{rule.level === "edit" ? "Редактирование" : rule.level === "formulas" ? "Только формулы" : "Просмотр"}</small>
            <SheetChecks>{sheets.map((sheet) => sheet.id && <label key={sheet.id}><input type="checkbox" checked={rule.sheetIds.includes(sheet.id)} onChange={(event) => setAccessRules((old) => old.map((item) => item.employeeId === rule.employeeId ? { ...item, sheetIds: event.target.checked ? [...item.sheetIds, sheet.id!] : item.sheetIds.filter((id) => id !== sheet.id) } : item))} />{sheet.name}</label>)}</SheetChecks>
            <button onClick={() => setAccessRules((old) => old.filter((item) => item.employeeId !== rule.employeeId))}>Убрать</button>
          </AccessRule>)}</AccessList>
        </AccessSection>}
        {canEdit && <AccessSection>
          <PanelTitle>Расчётный инвестор</PanelTitle>
          <Hint>Выделите диапазон в Excel и укажите, какие данные в нём находятся.</Hint>
          <Input value={calculationName} onChange={(event) => setCalculationName(event.target.value)} placeholder="Название карточки или ФИО" />
          <CustomSelect value={calculationPoolId} placeholder="Без привязки к пулу" dropdownInPortal onChange={(event) => setCalculationPoolId(event.target.value)} options={[
            { value: "", label: "Без привязки к пулу" },
            ...metricOptions.pools.map((item) => ({ value: item.id.toString(), label: item.name })),
          ]} />
          <CustomSelect value={calculationField} dropdownInPortal onChange={(event) => setCalculationField(event.target.value as InvestorCalculationField)} options={[
            { value: "fullName", label: "ФИО" },
            { value: "period", label: "Месяц или дата" },
            { value: "investment", label: "Инвестиции" },
            { value: "profit", label: "Прибыль" },
            { value: "payout", label: "Выплаты" },
            { value: "balance", label: "Баланс кассы" },
          ]} />
          <Button onClick={bindCalculationField}>Привязать выделенный диапазон</Button>
          <MappedFields>{Object.entries(calculationFields).map(([field, range]) => range && <span key={field}>{field} · R{range.rowStart + 1}:R{range.rowEnd + 1} C{range.columnStart + 1}:C{range.columnEnd + 1}</span>)}</MappedFields>
          <PrimaryButton onClick={saveInvestorCalculation}>Создать карточку и кассу</PrimaryButton>
          <AccessList>{investorCalculations.map((calculation) => <AccessRule key={calculation.id}>
            <strong>{calculation.name}</strong>
            <small>{Object.keys(calculation.fields).length} переменных · {calculation.poolId
              ? `пул «${metricOptions.pools.find((pool) => pool.id === calculation.poolId)?.name ?? `№${calculation.poolId}`}»`
              : "пул не выбран"}</small>
            <Label>Пул для отчёта</Label>
            <CustomSelect
              value={calculation.poolId?.toString() ?? ""}
              placeholder="Без привязки к пулу"
              dropdownInPortal
              onChange={(event) => changeCalculationPool(calculation.id, event.target.value)}
              options={[
                { value: "", label: "Без привязки к пулу" },
                ...metricOptions.pools.map((pool) => ({ value: pool.id.toString(), label: pool.name })),
              ]}
            />
            <button onClick={() => setInvestorCalculations((old) => old.filter((item) => item.id !== calculation.id))}>Удалить расчёт</button>
          </AccessRule>)}</AccessList>
        </AccessSection>}
        {accessLevel !== "owner" && <Hint>Ваш режим: {accessLevel === "edit" ? "редактирование" : accessLevel === "formulas" ? "изменение формул" : "только просмотр"}</Hint>}
        <BindingList>{bindings.map((binding, index) => <Binding key={`${binding.sheetId}-${binding.row}-${binding.column}`}><span>{binding.label}<small>{binding.mode === "series" ? `Отчёт · ${binding.groupBy === "day" ? "по дням" : "по месяцам"}` : "Значение"} · R{binding.row + 1}C{binding.column + 1}</small></span>{canEdit && <button onClick={() => setBindings((old) => old.filter((_, i) => i !== index))}>×</button>}</Binding>)}</BindingList>
      </Panel>}
    </Workspace>
    {!isFullscreen && !!calculatedInvestors.length && <InvestorReportSection>
      <ReportHeader>
        <div><PanelTitle>Расчётные инвесторы</PanelTitle><Hint>Карточки автоматически пересчитываются из связанных диапазонов Excel.</Hint></div>
        <SummaryValue>Общая касса {formatMoney(calculatedInvestors.reduce((sum, investor) => sum + investor.balance, 0))}</SummaryValue>
      </ReportHeader>
      <InvestorCards>{calculatedInvestors.map((investor) => <InvestorCard key={`${investor.calculationId}-${investor.fullName}`}>
        <InvestorCardTitle>{investor.fullName}</InvestorCardTitle>
        <MetricGrid>
          <Metric><small>Инвестиции</small><strong>{formatMoney(investor.investment)}</strong></Metric>
          <Metric><small>Прибыль</small><strong>{formatMoney(investor.profit)}</strong></Metric>
          <Metric><small>Выплаты</small><strong>{formatMoney(investor.payout)}</strong></Metric>
          <Metric><small>Касса</small><strong>{formatMoney(investor.balance)}</strong></Metric>
        </MetricGrid>
        <HistoryTable><thead><tr><th>Период</th><th>Инвестиции</th><th>Прибыль</th><th>Выплаты</th><th>Баланс</th></tr></thead><tbody>{investor.entries.map((entry, index) => <tr key={`${entry.period}-${index}`}><td>{entry.period}</td><td>{formatMoney(entry.investment)}</td><td>{formatMoney(entry.profit)}</td><td>{formatMoney(entry.payout)}</td><td>{entry.balance == null ? "—" : formatMoney(entry.balance)}</td></tr>)}</tbody></HistoryTable>
      </InvestorCard>)}</InvestorCards>
    </InvestorReportSection>}
  </Page>;
}

const formatMoney = (value: number) => `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value)} ₽`;

const Page = styled.div<{ $fullscreen: boolean }>`
  padding:24px; min-height:100%; box-sizing:border-box; color:#182033; background:#f8fafc;
  ${({ $fullscreen }) => $fullscreen && "position:fixed; inset:0; z-index:1200; overflow:hidden; padding:0 0 20px; background:#fff;"}
`;
const Header = styled.div`display:flex; justify-content:space-between; gap:20px; align-items:center; margin-bottom:16px; flex-wrap:wrap;`;
const Title = styled.h1`font-size:28px; margin:0 0 4px; text-align:left;`;
const Subtitle = styled.div`color:#8b95a7;`;
const Actions = styled.div`display:flex; gap:8px; flex-wrap:wrap;`;
const Button = styled.button`border:1px solid #d8dee7; border-radius:8px; background:#fff; padding:10px 14px; cursor:pointer; color:#354052; &:disabled{opacity:.5;cursor:default;}`;
const PrimaryButton = styled(Button)`background:#078b94; border-color:#078b94; color:#fff;`;
const DangerButton = styled(Button)`color:#e5484d; border-color:#f2c7c9;`;
const Notice = styled.div`background:#eaf8f8; color:#116970; border-radius:8px; padding:10px 14px; margin-bottom:12px;`;
const DocumentBar = styled.div`display:flex; align-items:center; gap:16px; background:#fff; border:1px solid #e3e7ed; border-radius:12px; padding:12px; margin-bottom:16px; flex-wrap:wrap;`;
const SavedSheetSelect = styled.div`width:220px;`;
const Input = styled.input`min-width:0; border:1px solid #d8dee7; border-radius:8px; padding:10px 12px; box-sizing:border-box; background:#fff;`;
const Workspace = styled.div<{ $fullscreen: boolean }>`display:grid; grid-template-columns:minmax(0,1fr) 310px; gap:16px; @media(max-width:1100px){grid-template-columns:1fr;} ${({ $fullscreen }) => $fullscreen && "grid-template-columns:1fr;gap:0;width:100vw;height:calc(100vh - 20px);min-height:0;"}`;
const GridCard = styled.div<{ $fullscreen: boolean }>`height:${({ $fullscreen }) => $fullscreen ? "100%" : "calc(100vh - 230px)"}; min-height:${({ $fullscreen }) => $fullscreen ? "0" : "520px"}; border:${({ $fullscreen }) => $fullscreen ? "0" : "1px solid #e3e7ed"}; border-radius:${({ $fullscreen }) => $fullscreen ? "0" : "12px"}; overflow:hidden; background:#fff;`;
const FullscreenExitButton = styled.button`position:fixed;right:18px;bottom:28px;z-index:1300;border:1px solid #cfd7df;border-radius:8px;background:rgba(255,255,255,.94);padding:9px 13px;color:#354052;box-shadow:0 4px 14px rgba(15,23,42,.14);cursor:pointer;`;
const Panel = styled.aside`background:#fff; border:1px solid #e3e7ed; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:10px; align-self:start;`;
const PanelTitle = styled.h2`font-size:18px; margin:0;`;
const Hint = styled.p`font-size:13px; line-height:1.45; color:#8b95a7; margin:0 0 4px;`;
const TemplateHint = styled.div`
  font-size:12px; line-height:1.45; color:#5f697b; background:#f5f7f9;
  border-radius:8px; padding:9px 10px; overflow-wrap:anywhere;
  code{color:#078b94;font-family:monospace}
`;
const Label = styled.label`font-size:13px; color:#5f697b; margin-bottom:-4px;`;
const TwoColumns = styled.div`display:grid; grid-template-columns:1fr; gap:10px; >div{display:flex; flex-direction:column; gap:6px;}`;
const BindingList = styled.div`display:flex; flex-direction:column; gap:6px; margin-top:4px; max-height:180px; overflow:auto;`;
const Binding = styled.div`display:flex; align-items:center; justify-content:space-between; background:#f5f7f9; border-radius:7px; padding:7px 9px; font-size:13px; small{display:block;color:#8b95a7;margin-top:2px} button{border:0;background:transparent;font-size:20px;cursor:pointer;color:#8b95a7}`;
const AccessSection = styled.section`display:flex; flex-direction:column; gap:8px; border-top:1px solid #e3e7ed; padding-top:14px; margin-top:6px;`;
const AccessList = styled.div`display:flex; flex-direction:column; gap:8px; max-height:240px; overflow:auto;`;
const AccessRule = styled.div`display:flex; flex-direction:column; gap:5px; padding:9px; border-radius:8px; background:#f5f7f9; font-size:13px; small{color:#8b95a7} >button{align-self:flex-start;border:0;background:transparent;color:#d64545;cursor:pointer;padding:0}`;
const SheetChecks = styled.div`display:flex; flex-wrap:wrap; gap:5px 10px; label{display:flex;align-items:center;gap:4px;font-size:12px}`;
const MappedFields = styled.div`display:flex;flex-direction:column;gap:4px;font-size:11px;color:#667085;span{padding:5px 7px;border-radius:6px;background:#f5f7f9}`;
const InvestorReportSection = styled.section`margin-top:18px;padding:18px;border:1px solid #e3e7ed;border-radius:12px;background:#fff;`;
const ReportHeader = styled.div`display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;`;
const SummaryValue = styled.strong`font-size:18px;color:#078b94;`;
const InvestorCards = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:14px;@media(max-width:650px){grid-template-columns:1fr}`;
const InvestorCard = styled.article`min-width:0;padding:16px;border:1px solid #e3e7ed;border-radius:10px;background:#fbfcfd;`;
const InvestorCardTitle = styled.h3`margin:0 0 12px;font-size:17px;`;
const MetricGrid = styled.div`display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px;@media(max-width:650px){grid-template-columns:repeat(2,1fr)}`;
const Metric = styled.div`padding:9px;border-radius:8px;background:#fff;border:1px solid #edf0f3;small{display:block;color:#8b95a7;margin-bottom:3px}strong{font-size:14px}`;
const HistoryTable = styled.table`width:100%;border-collapse:collapse;font-size:12px;th,td{padding:7px 8px;border-bottom:1px solid #e8ecf0;text-align:right}th:first-child,td:first-child{text-align:left}th{color:#667085;font-weight:600}`;
