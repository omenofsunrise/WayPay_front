import { useState } from 'react';
import { exportToExcel } from '../../utils/exportUtils';

interface ExportOptions<T, C> {
  fetchData: (page: number, pageSize: number) => Promise<{ items: T[], totalCount: number }>;
  fetchAdditionalData?: (item: T) => Promise<C>;
  fileName: string;
  transformData: (item: T, additionalData?: C) => any;
  pageSize?: number;
}

const useExport = <T, C = any>() => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportData = async ({
    fetchData,
    fetchAdditionalData,
    fileName,
    transformData,
    pageSize = 100
  }: ExportOptions<T, C>) => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      let allData: any[] = [];
      let currentPage = 1;
      let hasMoreData = true;

      while (hasMoreData) {
        const { items, totalCount } = await fetchData(currentPage, pageSize);
        
        if (items.length === 0) {
          hasMoreData = false;
        } else {
          // Обрабатываем дополнительные данные, если нужно
          const itemsWithAdditionalData = await Promise.all(
            items.map(async (item) => {
              const additionalData = fetchAdditionalData 
                ? await fetchAdditionalData(item) 
                : undefined;
              return transformData(item, additionalData);
            })
          );
          
          allData = [...allData, ...itemsWithAdditionalData];
          
          const progress = Math.min(
            100, 
            Math.floor((currentPage * pageSize) / totalCount * 100)
          );
          setExportProgress(progress);
          
          currentPage++;
          hasMoreData = currentPage * pageSize < totalCount;
        }
      }

      await exportToExcel(allData, fileName);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return { exportData, isExporting, exportProgress };
};

export default useExport;