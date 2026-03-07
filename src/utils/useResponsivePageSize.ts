import { useState, useEffect, useRef } from 'react';

interface UseResponsivePageSizeProps {
  defaultPageSize?: number;
  minPageSize?: number;
  maxPageSize?: number;
  rowHeight?: number;
  headerHeight?: number;
  paginationHeight?: number;
  additionalOffset?: number;
}

export const useResponsivePageSize = ({
  defaultPageSize = 10,
  minPageSize = 5,
  maxPageSize = 50,
  rowHeight = 48,
  headerHeight = 120,
  paginationHeight = 60,
  additionalOffset = 40,
}: UseResponsivePageSizeProps = {}) => {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculatePageSize = () => {
      if (!containerRef.current) return;

      const windowHeight = window.innerHeight;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      
      const availableHeight = windowHeight - containerTop - paginationHeight - additionalOffset;
      
      const tableHeight = availableHeight - headerHeight;
      
      let calculatedSize = Math.floor(tableHeight / rowHeight);
      
      calculatedSize = Math.max(minPageSize, Math.min(maxPageSize, calculatedSize));
      
      setPageSize(calculatedSize);
    };

    calculatePageSize();

    window.addEventListener('resize', calculatePageSize);
    
    return () => {
      window.removeEventListener('resize', calculatePageSize);
    };
  }, [rowHeight, headerHeight, paginationHeight, additionalOffset, minPageSize, maxPageSize]);

  return { pageSize, containerRef };
};