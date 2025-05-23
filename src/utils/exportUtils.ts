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

  // Создание рабочей книги
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Добавление листа в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Настройки форматирования (если указаны)
  if (columnWidths.length > 0) {
    worksheet['!cols'] = columnWidths.map(width => ({ width }));
  }

  // Генерация файла и скачивание
  XLSX.writeFile(workbook, `${fileName}.xlsx`, {
    compression: true,
  });
};