import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import type { Cell, Sheet } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import * as XLSX from "xlsx";
import calcService from "../../api/services/calcService";
import type {
  CalcMetricDefinition,
  CalcMetricQuery,
  CalcSheetSummary,
} from "../../api/types/calc";

type MetricBinding = CalcMetricQuery & {
  sheetId: string;
  row: number;
  column: number;
  label: string;
};

type CalcDocument = { version: 1; sheets: Sheet[]; bindings: MetricBinding[] };

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

const cellDisplay = (cell: Cell | null | undefined) => cell?.f ? `=${cell.f}` : cell?.v ?? "";

const sheetToXlsx = (sheet: Sheet) => {
  const ws = XLSX.utils.aoa_to_sheet((sheet.data ?? []).map((row) =>
    (row ?? []).map((cell) => cellDisplay(cell))
  ));
  return ws;
};

const xlsxToSheets = (buffer: ArrayBuffer): Sheet[] => {
  const book = XLSX.read(buffer, { type: "array", cellFormula: true });
  return book.SheetNames.map((name, index) => {
    const ws = book.Sheets[name];
    const range = ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]!) : { s: { r: 0, c: 0 }, e: { r: 99, c: 25 } };
    const data: (Cell | null)[][] = [];
    for (let row = range.s.r; row <= range.e.r; row += 1) {
      data[row] = [];
      for (let column = range.s.c; column <= range.e.c; column += 1) {
        const source = ws[XLSX.utils.encode_cell({ r: row, c: column })];
        data[row][column] = source ? { v: source.v, m: String(source.w ?? source.v ?? ""), f: source.f } : null;
      }
    }
    return { id: createSheetId(), name, order: index, status: index === 0 ? 1 : 0, data };
  });
};

export default function CalcPage() {
  const workbookRef = useRef<WorkbookInstance>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const updatingMetricsRef = useRef(false);
  const [sheets, setSheets] = useState<Sheet[]>(emptySheets);
  const [bindings, setBindings] = useState<MetricBinding[]>([]);
  const [savedSheets, setSavedSheets] = useState<CalcSheetSummary[]>([]);
  const [metrics, setMetrics] = useState<CalcMetricDefinition[]>([]);
  const [currentId, setCurrentId] = useState<number>();
  const [canEdit, setCanEdit] = useState(true);
  const [name, setName] = useState("Новая таблица");
  const [isShared, setIsShared] = useState(false);
  const [metricCode, setMetricCode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [poolId, setPoolId] = useState("");
  const [investorId, setInvestorId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedMetric = useMemo(() => metrics.find((x) => x.code === metricCode), [metrics, metricCode]);

  const reloadList = async () => setSavedSheets(await calcService.list());

  useEffect(() => {
    Promise.all([reloadList(), calcService.catalog().then((items) => {
      setMetrics(items);
      setMetricCode(items[0]?.code ?? "");
    })]).catch(() => setMessage("Не удалось загрузить данные конструктора"));
  }, []);

  const serialize = () => JSON.stringify({ version: 1, sheets, bindings } satisfies CalcDocument);

  const save = async () => {
    if (!canEdit) return;
    setBusy(true);
    try {
      const request = { name, content: serialize(), isShared };
      const result = currentId ? await calcService.update(currentId, request) : await calcService.create(request);
      setCurrentId(result.id);
      setMessage("Таблица сохранена");
      await reloadList();
    } catch (error: any) {
      setMessage(error?.response?.data ?? "Не удалось сохранить таблицу");
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
      workbookRef.current?.updateSheet(document.sheets);
      setMessage(result.canEdit ? "Таблица открыта" : "Открыт общий документ — только просмотр");
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
    workbookRef.current?.updateSheet(next);
  };

  const metricQuery = (): CalcMetricQuery => ({
    code: metricCode,
    ...(from && { from }), ...(to && { to }),
    ...(poolId && { poolId: Number(poolId) }),
    ...(investorId && { investorId: Number(investorId) }),
  });

  const insertMetric = async () => {
    const selection = workbookRef.current?.getSelection()?.[0];
    const activeSheet = workbookRef.current?.getSheet();
    if (!selection || !activeSheet?.id) return setMessage("Сначала выберите ячейку");
    if (selectedMetric?.requiresInvestor && !investorId) return setMessage("Для этого показателя укажите ID инвестора");
    setBusy(true);
    try {
      const metric = await calcService.metric(metricQuery());
      const row = selection.row[0];
      const column = selection.column[0];
      updatingMetricsRef.current = true;
      workbookRef.current?.setCellValue(row, column, metric.value, { id: activeSheet.id });
      updatingMetricsRef.current = false;
      const binding: MetricBinding = { ...metricQuery(), sheetId: activeSheet.id, row, column, label: metric.name };
      setBindings((old) => [...old.filter((x) => !(x.sheetId === binding.sheetId && x.row === row && x.column === column)), binding]);
      setSheets(workbookRef.current?.getAllSheets() ?? sheets);
      setMessage(`${metric.name} добавлен в выбранную ячейку`);
    } catch (error: any) { setMessage(error?.response?.data ?? "Не удалось получить показатель"); }
    finally { setBusy(false); }
  };

  const refreshMetrics = async () => {
    setBusy(true);
    try {
      for (const binding of bindings) {
        const { sheetId, row, column, label: _label, ...query } = binding;
        const metric = await calcService.metric(query);
        updatingMetricsRef.current = true;
        workbookRef.current?.setCellValue(row, column, metric.value, { id: sheetId });
        updatingMetricsRef.current = false;
      }
      setSheets(workbookRef.current?.getAllSheets() ?? sheets);
      setMessage(`Обновлено показателей: ${bindings.length}`);
    } catch (error: any) { setMessage(error?.response?.data ?? "Не все показатели удалось обновить"); }
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
    const next = xlsxToSheets(await file.arrayBuffer());
    setSheets(next);
    setBindings([]);
    workbookRef.current?.updateSheet(next);
    setMessage("Excel импортирован. Привязки показателей нужно добавить заново");
  };

  return <Page>
    <Header>
      <div><Title>Конструктор</Title><Subtitle>Таблицы, формулы и актуальные показатели WayPay</Subtitle></div>
      <Actions>
        <Button onClick={createNew}>Новая</Button>
        <Button onClick={() => fileRef.current?.click()}>Импорт XLSX</Button>
        <Button onClick={exportXlsx}>Экспорт XLSX</Button>
        <PrimaryButton onClick={save} disabled={busy || !canEdit}>{busy ? "Подождите…" : "Сохранить"}</PrimaryButton>
        <input ref={fileRef} hidden type="file" accept=".xlsx,.xls" onChange={(e) => importXlsx(e.target.files?.[0])} />
      </Actions>
    </Header>
    {message && <Notice>{message}</Notice>}
    <DocumentBar>
      <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} aria-label="Название таблицы" />
      <label><input type="checkbox" checked={isShared} disabled={!canEdit} onChange={(e) => setIsShared(e.target.checked)} /> Доступна компании</label>
      <Select value={currentId ?? ""} onChange={(e) => e.target.value && openSheet(Number(e.target.value))}>
        <option value="">Открыть сохранённую…</option>
        {savedSheets.map((item) => <option key={item.id} value={item.id}>{item.name}{item.canEdit ? "" : " · общий"}</option>)}
      </Select>
    </DocumentBar>
    <Workspace>
      <GridCard><Workbook
        ref={workbookRef}
        data={sheets}
        onChange={setSheets}
        lang="ru"
        allowEdit={canEdit}
        hooks={{
          beforeUpdateCell: (row, column) => {
            if (updatingMetricsRef.current) return true;
            const sheetId = workbookRef.current?.getSheet()?.id;
            const managed = bindings.some((x) => x.sheetId === sheetId && x.row === row && x.column === column);
            if (managed) setMessage("Ячейка связана с показателем WayPay. Удалите привязку, чтобы изменить её вручную");
            return !managed;
          },
        }}
      /></GridCard>
      <Panel>
        <PanelTitle>Показатели WayPay</PanelTitle>
        <Hint>Выберите ячейку и показатель. Значение придёт с сервера и сможет обновляться.</Hint>
        <Label>Показатель</Label>
        <Select value={metricCode} onChange={(e) => setMetricCode(e.target.value)}>{metrics.map((item) => <option key={item.code} value={item.code}>{item.name}, {item.unit}</option>)}</Select>
        <TwoColumns><div><Label>С</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div><Label>По</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div></TwoColumns>
        <Label>ID пула (необязательно)</Label><Input type="number" value={poolId} onChange={(e) => setPoolId(e.target.value)} />
        <Label>ID инвестора {selectedMetric?.requiresInvestor ? "*" : "(необязательно)"}</Label><Input type="number" value={investorId} onChange={(e) => setInvestorId(e.target.value)} />
        <PrimaryButton onClick={insertMetric} disabled={busy || !canEdit}>Вставить в ячейку</PrimaryButton>
        <Button onClick={refreshMetrics} disabled={busy || !bindings.length}>Обновить все ({bindings.length})</Button>
        <BindingList>{bindings.map((binding, index) => <Binding key={`${binding.sheetId}-${binding.row}-${binding.column}`}><span>{binding.label}<small>R{binding.row + 1}C{binding.column + 1}</small></span>{canEdit && <button onClick={() => setBindings((old) => old.filter((_, i) => i !== index))}>×</button>}</Binding>)}</BindingList>
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
const Notice = styled.div`background:#eaf8f8; color:#116970; border-radius:8px; padding:10px 14px; margin-bottom:12px;`;
const DocumentBar = styled.div`display:flex; align-items:center; gap:16px; background:#fff; border:1px solid #e3e7ed; border-radius:12px; padding:12px; margin-bottom:16px; flex-wrap:wrap;`;
const Input = styled.input`min-width:0; border:1px solid #d8dee7; border-radius:8px; padding:10px 12px; box-sizing:border-box; background:#fff;`;
const Select = styled.select`min-width:0; border:1px solid #d8dee7; border-radius:8px; padding:10px 12px; background:#fff;`;
const Workspace = styled.div`display:grid; grid-template-columns:minmax(0,1fr) 310px; gap:16px; @media(max-width:1100px){grid-template-columns:1fr;}`;
const GridCard = styled.div`height:calc(100vh - 230px); min-height:520px; border:1px solid #e3e7ed; border-radius:12px; overflow:hidden; background:#fff;`;
const Panel = styled.aside`background:#fff; border:1px solid #e3e7ed; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:10px; align-self:start;`;
const PanelTitle = styled.h2`font-size:18px; margin:0;`;
const Hint = styled.p`font-size:13px; line-height:1.45; color:#8b95a7; margin:0 0 4px;`;
const Label = styled.label`font-size:13px; color:#5f697b; margin-bottom:-4px;`;
const TwoColumns = styled.div`display:grid; grid-template-columns:1fr 1fr; gap:8px; >div{display:flex; flex-direction:column; gap:6px;}`;
const BindingList = styled.div`display:flex; flex-direction:column; gap:6px; margin-top:4px; max-height:180px; overflow:auto;`;
const Binding = styled.div`display:flex; align-items:center; justify-content:space-between; background:#f5f7f9; border-radius:7px; padding:7px 9px; font-size:13px; small{display:block;color:#8b95a7;margin-top:2px} button{border:0;background:transparent;font-size:20px;cursor:pointer;color:#8b95a7}`;
