import { useState, useCallback, useEffect, useMemo } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import CustomInput from '../../ui/fields/CustomInput';
import CustomTable, { type RowStyle } from '../../ui/tables/CustomTable';
import useInvestor from '../../../api/hooks/useInvestor';
import useInvestorPool from '../../../api/hooks/useInvestorPool';
import Pagination from '../../ui/fields/CustomPagination';
import styled from 'styled-components';
import { formatMoney } from '../../../utils/formatPrice';
import { formatDate } from '../../../utils/dateFormatter';
import { formatPhoneHref } from '../../../utils/phoneUtils';
import PhoneLink from '../../ui/links/PhoneLink';
import { isOwnCashInvestorName } from '../../../utils/investorUtils';
import type { InvestorParams } from '../../../api/types/investor';
import { useAuth } from '../../../сontext/AuthContext';

interface InvestorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entity: { 
    id: number; 
    nickname?: string; 
    name?: string;
    fullName?: string; 
    phoneNumber?: string;
    investorPie?: number;
    pie?: number;
    investmentAmount?: number;
    balance?: number;
    type: 'investor' | 'pool';
  }) => void;
  width?: string;
  includePools?: boolean;
  poolId?: number; // Добавлено: ID пула для фильтрации инвесторов
}

const InvestorSelectModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  width = "1000px",
  includePools = false,
  poolId // Добавлено
}: InvestorSelectModalProps) => {
  const { authInfo } = useAuth();
  const isPoolV2 = authInfo?.employee?.poolV2 ?? false;
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [selectedEntity, setSelectedEntity] = useState<{
    id: number;
    nickname?: string;
    name?: string;
    fullName?: string;
    phoneNumber?: string;
    investorPie?: number;
    pie?: number;
    investmentAmount?: number;
    balance?: number;
    isCompany: boolean;
    isCompanyPool?: boolean;
    activeUntil?: string;
    type: 'investor' | 'pool';
  } | null>(null);
  
  const pageSize = 4;
  const shouldHideCash = Boolean(poolId);
  
  const columnToApiSortMap = useMemo<Record<number, string>>(
    () => ({
      0: 'id',
      3: includePools ? 'pie' : 'investor_pie',
      5: 'balance'
    }),
    [includePools]
  );
  
  const { 
    isLoading: isLoadingInvestors, 
    error: investorsError, 
    data: investorsData, 
    getInvestors
  } = useInvestor();
  
  const { 
    isLoading: isLoadingPools, 
    error: poolsError, 
    data: poolsData, 
    getInvestorPools
  } = useInvestorPool();
  
  const isLoading = isLoadingInvestors || (includePools && isLoadingPools);
  const error = investorsError || (includePools && poolsError);
  const loadEntities = useCallback(async () => {
    const params: InvestorParams & { search?: string } = {
      page: currentPage,
      pageSize,
      search: nameFilter || undefined
    };

    // Добавлено: если указан poolId, передаем его в параметры
    if (poolId) {
      params.poolId = poolId;
    }

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    if (includePools) {
      await Promise.all([
        getInvestors(params),
        getInvestorPools(params)
      ]);
    } else {
      await getInvestors(params);
    }
  }, [columnToApiSortMap, currentPage, nameFilter, sortConfig, getInvestors, getInvestorPools, includePools, poolId]);
  
  useEffect(() => {
    if (isOpen) {
      loadEntities();
      setSelectedEntity(null);
    }
  }, [isOpen, currentPage, nameFilter, sortConfig, loadEntities]);

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

  const handleRowClick = (_rowData: unknown[], rowIndex: number) => {
    const isPool = includePools && rowIndex >= (investorsData?.items?.length || 0);
    
    if (isPool) {
      const poolIndex = rowIndex - (investorsData?.items?.length || 0);
      const pool = poolsData?.items[poolIndex];
      if (pool) {
        setSelectedEntity({
          id: pool.id,
          nickname: pool.name,
          name: pool.name,
          fullName: pool.name,
          pie: pool.pie,
          balance: pool.balance || 0,
          activeUntil: pool.activeUntil,
          isCompanyPool: pool.isCompanyPool,
          type: 'pool'
        });
      }
    } else {
      const investor = investorsData?.items[rowIndex];
      if (investor) {
        setSelectedEntity({
          id: investor.id,
          nickname: investor.nickname,
          fullName: investor.fullName,
          phoneNumber: investor.phoneNumber,
          investorPie: investor.investorPie,
          investmentAmount: investor.investmentAmount,
          balance: investor.balance,
          activeUntil: investor.activeUntil,
          isCompany: investor.isCompany,
          type: 'investor'
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEntity) {
      console.log(selectedEntity);
      onSubmit(selectedEntity);
      onClose();
    }
  };

  const investorsTableData = investorsData?.items?.map(investor => {
    const row = [
      investor.id.toString(),
      (investor.nickname && investor.nickname.trim() !== '') ? investor.nickname : investor.fullName,
      investor.phoneNumber ? <PhoneLink href={formatPhoneHref(investor.phoneNumber)}>{investor.phoneNumber}</PhoneLink> : '',
      investor.investorPie.toString() + "%",
      investor.isBlocked?.toString() || 'false',
      formatMoney(investor.balance.toString()),
      investor.isCompany || investor.isCompanyPool || isOwnCashInvestorName(investor.nickname)
        ? '-'
        : formatDate(investor.activeUntil ?? new Date()),
    ];

    return shouldHideCash ? row.filter((_, index) => index !== 5) : row;
  }) || [];

  const poolsTableData = includePools 
    ? poolsData?.items?.map(pool => {
        const row = [
          pool.id.toString(),
          pool.name,
          '—',
          "",
          '—',
          formatMoney(pool.balance.toString()),
          pool.isCompanyPool || isOwnCashInvestorName(pool.name)
            ? '-'
            : formatDate(pool.activeUntil ?? new Date())
        ];

        return shouldHideCash ? row.filter((_, index) => index !== 5) : row;
      }) || []
    : [];

  const tableData = [...investorsTableData, ...poolsTableData];
  const tableColumns = [
    { name: "ID", isSortable: true, align: "left" as const, isHidden: true },
    { name: includePools ? "Никнейм/Название" : "Никнейм", align: "left" as const },
    { name: "Телефон", align: "left" as const, isHidden: true },
    { name: "Доля", align: "left" as const, isSortable: true, isHidden: true },
    { name: "заблокирован", isHidden: true },
    ...(!shouldHideCash
      ? [{ name: "Касса", isSortable: true, align: "right" as const }]
      : []),
    { name: "Дата окончания инвестора/пула", align: "left" as const },
  ];

  const rowStyles = tableData.reduce((styles, rowData, index) => {
    const isBlockedIndex = 4;
    const isBlocked = rowData[isBlockedIndex] === 'true';
    const rowId = parseInt(rowData[0]);
    const isSelected = selectedEntity && rowId === selectedEntity.id;
    
    if (isSelected) {
      styles[index] = {
        backgroundColor: '#007D88',
        color: 'white',
        fontWeight: 'normal'
      };
    } else if (
      isPoolV2 &&
      index < (investorsData?.items?.length || 0) &&
      investorsData?.items?.[index]?.isRemoved
    ) {
      styles[index] = {
        backgroundColor: '#E5E7EB',
        color: '#374151',
        fontWeight: 'normal'
      };
    } else if (isBlocked) {
      styles[index] = {
        backgroundColor: '#FFEBEE',
        color: 'black',
        fontWeight: 'normal',
        hoverBackgroundColor: 'black'
      };
    } 
    else {
      styles[index] = {
        backgroundColor: 'white',
        color: 'black',
        fontWeight: 'normal'
      };
    }
    
    return styles;
  }, {} as Record<number, RowStyle>);

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Выбор инвестора/пула"
      onClose={onClose}
      onCancel={onClose}
      onSave={handleSubmit}
      isSaveDisabled={!selectedEntity}
      saveButtonText="Выбрать"
      width={width}
    >
      <ModalContent>
        <FilterContainer>
          <CustomInput 
            style={{ maxWidth: "none" }}
            inputType="fullname"
            placeholder="Поиск по никнейму или названию пула"
            value={nameFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          />
        </FilterContainer>
        
        {isLoading && <LoadingMessage>Загрузка...</LoadingMessage>}
        {error && <ErrorMessage>Ошибка загрузки: {error}</ErrorMessage>}
        
        {!isLoading && !error && (
          <>
            <TableContainer>
              <CustomTable 
                columns={tableColumns}
                data={tableData}
                onRowClick={handleRowClick}
                onSort={handleSort}
                sortConfig={sortConfig}
                rowStyles={rowStyles}
                selectedRow={selectedEntity ? tableData.findIndex(row => row[0] === selectedEntity.id.toString()) : -1}
              />
            </TableContainer>
            
            <PaginationContainer>
              <Pagination
                total={(investorsData?.totalCount || 0) + (includePools ? (poolsData?.totalCount || 0) : 0)}
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
  margin-bottom: 20px;
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

export default InvestorSelectModal;
