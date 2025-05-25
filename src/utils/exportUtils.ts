import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Рассчитываем оптимальную ширину для каждого столбца
  const columnWidths = Object.keys(data[0] || {}).map(key => {
    // Находим максимальную длину содержимого в столбце
    const maxLength = Math.max(
      key.length, // Длина заголовка
      ...data.map(item => 
        String(item[key] || '').length // Длина каждого значения
      )
    );
    // Возвращаем ширину (можно добавить небольшой отступ)
    return { wch: maxLength + 2 };
  });
  
  // Применяем настройки ширины столбцов
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  XLSX.writeFile(workbook, `${fileName}.xlsx`, {
    bookType: 'xlsx',
    type: 'file'
  });
};