import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  const columnWidths = Object.keys(data[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(item => 
        String(item[key] || '').length
      )
    );
    return { wch: maxLength + 2 };
  });
  
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  XLSX.writeFile(workbook, `${fileName}.xlsx`, {
    bookType: 'xlsx',
    type: 'file'
  });
};