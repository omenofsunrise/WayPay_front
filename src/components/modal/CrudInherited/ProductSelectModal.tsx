import { useState, useCallback, useEffect } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomTable from '../../ui/tables/CustomTable';
import DarkCyanButton from '../../ui/Buttons/DarkCyanButton';
import useProducts from '../../../api/hooks/useProducts';
import Pagination from '../../ui/fields/CustomPagination';
import styled from 'styled-components';

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: { id: number; name: string }) => void;
  width?: string;
  title?: string;
}

const ProductSelectModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  width = "832px",
  title,
}: ProductSelectModalProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
  } | null>(null);
  
  const pageSize = 5;
  
  const columnToApiSortMap: Record<number, string> = {
    0: 'id',
    1: 'name'
  };
  
  const { 
    isLoading, 
    error, 
    data: productsData, 
    getProducts
  } = useProducts();
  
  const loadProducts = useCallback(async () => {
    const params: any = {
      page: currentPage,
      pageSize,
      name: nameFilter || undefined
    };

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getProducts(params);
  }, [currentPage, nameFilter, sortConfig, getProducts]);
  
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      setSelectedProduct(null);
    }
  }, [isOpen, currentPage, nameFilter, sortConfig, loadProducts]);

  const handleFilterChange = (value: string) => {
    setNameFilter(value);
    setCurrentPage(1);
  };

  const handleSort = (columnIndex: number) => {
    if (!columnToApiSortMap[columnIndex]) return;
    
    setSortConfig(prev => {
      if (prev.key === columnIndex) {
        return {
          key: columnIndex,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key: columnIndex,
        direction: 'asc'
      };
    });
  };

  const handleRowClick = (rowData: any[], rowIndex: number) => {
    const product = productsData?.items[rowIndex];
    if (product) {
      setSelectedProduct({
        id: product.id,
        name: product.name
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      onSubmit(selectedProduct);
      onClose();
    }
  };

  const tableData = productsData?.items?.map(product => [
    product.id.toString(),
    product.name,
  ]) || [];

  if (!isOpen) return null;

  return (
    <BaseModal
      title={title || "Выбор товара"}
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={!selectedProduct}
      saveButtonText="Выбрать"
      width={width}
    >
      <ModalContent>
        <FilterContainer>
          <CustomInput 
            style={{ maxWidth: "none" }}
            inputType="text"
            placeholder="Поиск по названию"
            value={nameFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          />
        </FilterContainer>
        
        {isLoading && <LoadingMessage>Загрузка товаров...</LoadingMessage>}
        {error && <ErrorMessage>Ошибка загрузки: {error}</ErrorMessage>}
        
        {!isLoading && !error && (
          <>
            <TableContainer>
              <CustomTable 
                columns={[
                  { name: "ID", isSortable: true, align: "left" },
                  { name: "Название", isSortable: true, align: "left" },
                ]} 
                data={tableData}
                onRowClick={handleRowClick}
                onSort={handleSort}
                sortConfig={sortConfig}
                selectedRow={selectedProduct ? tableData.findIndex(row => row[0] === selectedProduct.id.toString()) : -1}
              />
            </TableContainer>
            
            <PaginationContainer>
              <Pagination
                total={productsData?.totalCount || 0}
                current={currentPage}
                onChange={setCurrentPage}
                itemsPerPage={pageSize}
              />
            </PaginationContainer>
          </>
        )}
      </ModalContent>
    </BaseModal>
  );
};

const ModalContent = styled.div`
  padding: 20px;
`;

const FilterContainer = styled.div`
  margin-bottom: 16px;
`;

const TableContainer = styled.div`
  margin-bottom: 16px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #ff0000;
`;

export default ProductSelectModal;