import * as XLSX from 'xlsx';

interface ExportConfig {
  fileName?: string;
  sheetName?: string;
  columnWidths?: number[];
}

export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  config: ExportConfig = {}
) => {
  const {
    fileName = 'export',
    sheetName = 'Sheet1',
    columnWidths = [],
  } = config;

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  if (columnWidths.length > 0) {
    worksheet['!cols'] = columnWidths.map(width => ({ width }));
  }

  XLSX.writeFile(workbook, `${fileName}.xlsx`, {
    compression: true,
  });
};