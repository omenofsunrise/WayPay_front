import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import type { Cell, CellWithRowAndCol, Sheet } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import calcService from "../../api/services/calcService";
import CustomCalendar from "../../components/ui/fields/CustomCalendar";
import CustomSelect from "../../components/ui/fields/CustomSelect";
import type {
  CalcMetricDefinition,
  CalcMetricOptions,
  CalcMetricQuery,
  CalcMetricSeries,
  CalcSheetSummary,
} from "../../api/types/calc";

type MetricBinding = CalcMetricQuery & {
  sheetId: string;
  row: number;
  column: number;
  label: string;
  mode?: "value" | "series";
  groupBy?: "day" | "month";
  rowCount?: number;
};

type CalcDocument = { version: 1; sheets: Sheet[]; bindings: MetricBinding[] };

const MAX_DOCUMENT_BYTES = 10_000_000;

const requestErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null || !("response" in error)) return fallback;
  const response = (error as { response?: { data?: unknown } }).response;
  return typeof response?.data === "string" ? response.data : fallback;
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

const parseDocument = (content: string): CalcDocument => {
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) return { version: 1, sheets: parsed, bindings: [] };
  return {
    version: 1,
    sheets: parsed.sheets?.length ? parsed.sheets : emptySheets(),
    bindings: Array.isArray(parsed.bindings) ? parsed.bindings : [],
  };
};

const prepareSheetsForWorkbook = (sourceSheets: Sheet[]): Sheet[] => sourceSheets.map((sheet) => {
  if (!sheet.data) return sheet;
  const celldata: CellWithRowAndCol[] = [];
  sheet.data.forEach((row, r) => row?.forEach((cell, c) => {
    if (cell) celldata.push({ r, c, v: cell });
  }));
  return { ...sheet, data: undefined, celldata };
});

const sheetToXlsx = (sheet: Sheet) => {
  const ws: XLSX.WorkSheet = {};
  let maxRow = 0;
  let maxColumn = 0;
  (sheet.data ?? []).forEach((row, r) => (row ?? []).forEach((cell, c) => {
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
  }));
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
  const fileRef = useRef<HTMLInputElement>(null);
  const updatingMetricsRef = useRef(false);
  const [sheets, setSheets] = useState<Sheet[]>(emptySheets);
  const [workbookVersion, setWorkbookVersion] = useState(0);
  const [bindings, setBindings] = useState<MetricBinding[]>([]);
  const [savedSheets, setSavedSheets] = useState<CalcSheetSummary[]>([]);
  const [metrics, setMetrics] = useState<CalcMetricDefinition[]>([]);
  const [metricOptions, setMetricOptions] = useState<CalcMetricOptions>({ pools: [], investors: [] });
  const [currentId, setCurrentId] = useState<number>();
  const [canEdit, setCanEdit] = useState(true);
  const [name, setName] = useState("Новая таблица");
  const [isShared, setIsShared] = useState(false);
  const [metricCode, setMetricCode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [poolId, setPoolId] = useState("");
  const [investorId, setInvestorId] = useState("");
  const [insertMode, setInsertMode] = useState<"value" | "series">("value");
  const [groupBy, setGroupBy] = useState<"day" | "month">("month");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedMetric = useMemo(() => metrics.find((x) => x.code === metricCode), [metrics, metricCode]);
  const workbookSheets = useMemo(() => prepareSheetsForWorkbook(sheets), [sheets]);

  const reloadList = async () => setSavedSheets(await calcService.list());

  useEffect(() => {
    Promise.all([reloadList(), calcService.options().then(setMetricOptions), calcService.catalog().then((items) => {
      setMetrics(items);
      setMetricCode(items[0]?.code ?? "");
    })]).catch(() => setMessage("Не удалось загрузить данные конструктора"));
  }, []);

  const serialize = () => JSON.stringify({ version: 1, sheets, bindings } satisfies CalcDocument);

  const save = async () => {
    if (!canEdit) return;
    const content = serialize();
    if (new Blob([content]).size > MAX_DOCUMENT_BYTES) {
      setMessage("Таблица слишком большая для сохранения. Максимальный размер — 10 МБ");
      return;
    }
    setBusy(true);
    try {
      const request = { name, content, isShared };
      const result = currentId ? await calcService.update(currentId, request) : await calcService.create(request);
      setCurrentId(result.id);
      setMessage("Таблица сохранена");
      await reloadList();
    } catch (error) {
      setMessage(requestErrorMessage(error, "Не удалось сохранить таблицу"));
    } finally { setBusy(false); }
  };

  const openSheet = async (id: number) => {
    setBusy(true);
    try {
      const result = await calcService.get(id);
      const document = parseDocument(result.content);
      setCurrentId(result.id);
      setName(result.name);
      setIsShared(result.isShared);
      setCanEdit(result.canEdit);
      setBindings(document.bindings);
      setSheets(document.sheets);
      setWorkbookVersion((version) => version + 1);
      setMessage(document.bindings.length
        ? "Таблица открыта. Обновляем показатели WayPay…"
        : result.canEdit ? "Таблица открыта" : "Открыт общий документ — только просмотр");
      if (document.bindings.length) {
        window.setTimeout(() => window.requestAnimationFrame(() => {
          void refreshMetrics(document.bindings, true, result.canEdit);
        }), 0);
      }
    } catch { setMessage("Не удалось открыть таблицу"); }
    finally { setBusy(false); }
  };

  const createNew = () => {
    const next = emptySheets();
    setCurrentId(undefined);
    setName("Новая таблица");
    setIsShared(false);
    setCanEdit(true);
    setBindings([]);
    setSheets(next);
    setWorkbookVersion((version) => version + 1);
  };

  const deleteSheet = async () => {
    if (!currentId || !canEdit || !window.confirm(`Удалить таблицу «${name}»?`)) return;
    setBusy(true);
    try {
      await calcService.remove(currentId);
      createNew();
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
    setBusy(true);
    try {
      const updatedBindings = [...items];
      for (let index = 0; index < items.length; index += 1) {
        const binding = items[index];
        const { sheetId, row, column, mode, groupBy: bindingGroup } = binding;
        const query: CalcMetricQuery = {
          code: binding.code,
          ...(binding.from && { from: binding.from }),
          ...(binding.to && { to: binding.to }),
          ...(binding.poolId && { poolId: binding.poolId }),
          ...(binding.investorId && { investorId: binding.investorId }),
        };
        if (mode === "series" && query.from && query.to) {
          const series = await calcService.metricSeries({
            ...query, from: query.from, to: query.to, groupBy: bindingGroup ?? "month",
          });
          const rowCount = writeSeries(series, sheetId, row, column);
          updatedBindings[index] = { ...binding, rowCount };
        } else {
          const metric = await calcService.metric(query);
          updatingMetricsRef.current = true;
          workbookRef.current?.setCellValue(row, column, metric.value, { id: sheetId });
          updatingMetricsRef.current = false;
        }
      }
      setBindings(updatedBindings);
      setSheets(workbookRef.current?.getAllSheets() ?? sheets);
      setMessage(automatic
        ? `${editable ? "Таблица открыта" : "Открыт общий документ — только просмотр"}. Показатели обновлены: ${items.length}`
        : `Обновлено показателей: ${items.length}`);
    } catch (error) {
      setMessage(requestErrorMessage(error, automatic
        ? "Таблица открыта, но показатели WayPay обновить не удалось"
        : "Не все показатели удалось обновить"));
    }
    finally { setBusy(false); }
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
      setSheets(next);
      setBindings([]);
      setWorkbookVersion((version) => version + 1);
      setMessage(`Excel импортирован: ${next.length} листов, ${importedCells} заполненных ячеек`);
    } catch (error) {
      const details = error instanceof Error ? error.message : "неизвестная ошибка";
      setMessage(`Не удалось импортировать Excel: ${details}`);
    } finally {
      setBusy(false);
    }
  };

  return <Page>
    <Header>
      <div><Title>Конструктор</Title><Subtitle>Таблицы, формулы и актуальные показатели WayPay</Subtitle></div>
      <Actions>
        <Button onClick={createNew}>Новая</Button>
        <Button onClick={() => fileRef.current?.click()}>Импорт XLSX</Button>
        <Button onClick={exportXlsx}>Экспорт XLSX</Button>
        <DangerButton onClick={deleteSheet} disabled={busy || !currentId || !canEdit}>Удалить</DangerButton>
        <PrimaryButton onClick={save} disabled={busy || !canEdit}>{busy ? "Подождите…" : "Сохранить"}</PrimaryButton>
        <input ref={fileRef} hidden type="file" accept=".xlsx,.xls" onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          void importXlsx(file);
        }} />
      </Actions>
    </Header>
    {message && <Notice>{message}</Notice>}
    <DocumentBar>
      <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} aria-label="Название таблицы" />
      <label><input type="checkbox" checked={isShared} disabled={!canEdit} onChange={(e) => setIsShared(e.target.checked)} /> Доступна компании</label>
      <SavedSheetSelect>
        <CustomSelect
          value={currentId?.toString() ?? ""}
          placeholder="Открыть сохранённую…"
          dropdownInPortal
          onChange={(e) => e.target.value && void openSheet(Number(e.target.value))}
          options={savedSheets.map((item) => ({
            value: item.id.toString(),
            label: `${item.name}${item.canEdit ? "" : " · общий"}`,
          }))}
        />
      </SavedSheetSelect>
    </DocumentBar>
    <Workspace>
      <GridCard><Workbook
        key={workbookVersion}
        ref={workbookRef}
        data={workbookSheets}
        onChange={setSheets}
        lang="ru"
        allowEdit={canEdit}
        hooks={{
          beforeUpdateCell: (row, column) => {
            if (updatingMetricsRef.current) return true;
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
      <Panel>
        <PanelTitle>Показатели WayPay</PanelTitle>
        <Hint>Выберите ячейку и показатель. Значение придёт с сервера и сможет обновляться.</Hint>
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
        <BindingList>{bindings.map((binding, index) => <Binding key={`${binding.sheetId}-${binding.row}-${binding.column}`}><span>{binding.label}<small>{binding.mode === "series" ? `Отчёт · ${binding.groupBy === "day" ? "по дням" : "по месяцам"}` : "Значение"} · R{binding.row + 1}C{binding.column + 1}</small></span>{canEdit && <button onClick={() => setBindings((old) => old.filter((_, i) => i !== index))}>×</button>}</Binding>)}</BindingList>
      </Panel>
    </Workspace>
  </Page>;
}

const Page = styled.div`padding: 24px; min-height: 100%; box-sizing: border-box; color: #182033;`;
const Header = styled.div`display:flex; justify-content:space-between; gap:20px; align-items:center; margin-bottom:16px; flex-wrap:wrap;`;
const Title = styled.h1`font-size:28px; margin:0 0 4px;`;
const Subtitle = styled.div`color:#8b95a7;`;
const Actions = styled.div`display:flex; gap:8px; flex-wrap:wrap;`;
const Button = styled.button`border:1px solid #d8dee7; border-radius:8px; background:#fff; padding:10px 14px; cursor:pointer; color:#354052; &:disabled{opacity:.5;cursor:default;}`;
const PrimaryButton = styled(Button)`background:#078b94; border-color:#078b94; color:#fff;`;
const DangerButton = styled(Button)`color:#e5484d; border-color:#f2c7c9;`;
const Notice = styled.div`background:#eaf8f8; color:#116970; border-radius:8px; padding:10px 14px; margin-bottom:12px;`;
const DocumentBar = styled.div`display:flex; align-items:center; gap:16px; background:#fff; border:1px solid #e3e7ed; border-radius:12px; padding:12px; margin-bottom:16px; flex-wrap:wrap;`;
const SavedSheetSelect = styled.div`width:220px;`;
const Input = styled.input`min-width:0; border:1px solid #d8dee7; border-radius:8px; padding:10px 12px; box-sizing:border-box; background:#fff;`;
const Workspace = styled.div`display:grid; grid-template-columns:minmax(0,1fr) 310px; gap:16px; @media(max-width:1100px){grid-template-columns:1fr;}`;
const GridCard = styled.div`height:calc(100vh - 230px); min-height:520px; border:1px solid #e3e7ed; border-radius:12px; overflow:hidden; background:#fff;`;
const Panel = styled.aside`background:#fff; border:1px solid #e3e7ed; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:10px; align-self:start;`;
const PanelTitle = styled.h2`font-size:18px; margin:0;`;
const Hint = styled.p`font-size:13px; line-height:1.45; color:#8b95a7; margin:0 0 4px;`;
const Label = styled.label`font-size:13px; color:#5f697b; margin-bottom:-4px;`;
const TwoColumns = styled.div`display:grid; grid-template-columns:1fr 1fr; gap:8px; >div{display:flex; flex-direction:column; gap:6px;}`;
const BindingList = styled.div`display:flex; flex-direction:column; gap:6px; margin-top:4px; max-height:180px; overflow:auto;`;
const Binding = styled.div`display:flex; align-items:center; justify-content:space-between; background:#f5f7f9; border-radius:7px; padding:7px 9px; font-size:13px; small{display:block;color:#8b95a7;margin-top:2px} button{border:0;background:transparent;font-size:20px;cursor:pointer;color:#8b95a7}`;
