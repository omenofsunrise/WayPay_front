import { useCallback, useEffect, useState } from "react";
import type { BlackCatalogPageContentProps } from "./types";
import {
  ClearSearchButton,
  EmptyStateContainer,
  EmptyStateIcon,
  EmptyStateText,
  EmptyStateTitle,
  HeaderTitleGroup,
  StickyHeader,
  StyledCountInfo,
  UserAvatar,
  WildInputContainer,
  DemoBadge,
  TotalCountBadge,
} from "./styles";
import useBlacklist from "../../api/hooks/useBlacklist";
import type { BlacklistParams } from "../../api/types/blacklist";
import BlackCatalogCard from "./components/BlackCatalogCard";
import CustomInput from "../../components/ui/fields/CustomInput";
import CustomTitle from "../../components/ui/Text/CustomTitle";
import DemoPromoModal from "./components/DemoPromoModal";

const BlackCatalogPageContent: React.FC<BlackCatalogPageContentProps> = ({
  texts
}) => {

  const storageKey = "black_catalog_search_state";
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const readStoredState = () => {
    try {
      const storedRaw = sessionStorage.getItem(storageKey);
      if (!storedRaw) {
        return { nameFilter: '', hasSearched: false, searchTriggered: false };
      }
      const stored = JSON.parse(storedRaw) as { nameFilter?: string; hasSearched?: boolean };
      const nameFilter = typeof stored.nameFilter === 'string' ? stored.nameFilter : '';
      const canSearch = nameFilter.length >= 5;
      return {
        nameFilter,
        hasSearched: Boolean(stored.hasSearched) && canSearch,
        searchTriggered: Boolean(stored.hasSearched) && canSearch,
      };
    } catch {
      sessionStorage.removeItem(storageKey);
      return { nameFilter: '', hasSearched: false, searchTriggered: false };
    }
  };
  
  const handleDemoClick = () => {
    setIsDemoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDemoModalOpen(false);
  };

  const handleGoToSite = () => {
    window.open('https://blacklist.waypay.one', '_blank');
    setIsDemoModalOpen(false);
  };

  const initialState = readStoredState();
  const [nameFilter, setNameFilter] = useState(initialState.nameFilter);
  const [hasSearched, setHasSearched] = useState(initialState.hasSearched);

  const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const {
    isLoading,
    error,
    getBlackCatalog,
    data
  } = useBlacklist();

  // Fetch total count
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const response = await fetch('http://95.163.226.24:8080/api/black-catalog/count');
        const data = await response.json();
        setTotalCount(data.count);
      } catch (error) {
        console.error('Failed to fetch total count:', error);
      }
    };

    fetchTotalCount();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ nameFilter, hasSearched })
    );
  }, [nameFilter, hasSearched, storageKey]);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (nameFilter.length >= 5) {
        loadBlacklist();
      } else if (nameFilter.length === 0) {
        setHasSearched(false);
      } else {
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [nameFilter]);

  const resetFilters = useCallback(() => {
    setNameFilter('');
    setHasSearched(false);
  }, []);

  const loadBlacklist = useCallback(async () => {
    const params: BlacklistParams = {}
    params.pageSize = 2;
    if (nameFilter && nameFilter.length >= 5) {
      params.FullName = nameFilter;
    }

    if (!params.FullName) {
      setHasSearched(false);
      return;
    }

    await getBlackCatalog(params);
    setHasSearched(true);
  }, [nameFilter]);

  const handleFilterChange = (value: string) => {
    setNameFilter(value);
  };

  const canEditItem = (): boolean => {    
    return false; // В демо-режиме всегда false
  };

  const renderContent = () => {
    if (isLoading) {
      return <div>Загрузка...</div>;
    }

    if (error) {
      return <div>Ошибка: {error}</div>;
    }

    if (!hasSearched) {
      return (
        <EmptyStateContainer>
          <EmptyStateIcon>📋</EmptyStateIcon>
          <EmptyStateTitle>{texts.emptyStateTitle}</EmptyStateTitle>
          <EmptyStateText>{texts.emptyStateDescription}</EmptyStateText>
          <StyledCountInfo total={totalCount} />
        </EmptyStateContainer>
      );
    }

    if (data && data.items.length === 0) {
      return (
        <EmptyStateContainer>
          <EmptyStateIcon>🔍</EmptyStateIcon>
          <EmptyStateTitle>{texts.notFoundTitle}</EmptyStateTitle>
          <EmptyStateText>{texts.notFoundDescription(nameFilter)}</EmptyStateText>
        </EmptyStateContainer>
      );
    }

    return (
      <div style={{marginTop: "20px"}}>
        {data?.items.map((item) => {
          const canEdit = canEditItem();
          
          return (
            <>
              <BlackCatalogCard
                key={item.id}
                item={item}
                onDemoClick={handleDemoClick}
              />
              {isDemoModalOpen && (
                <DemoPromoModal 
                  onClose={handleCloseModal}
                  onGo={handleGoToSite}
                />
              )}
            </>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{padding: "15px", position: "relative"}}>
      <DemoBadge>
        <a 
          href="https://blacklist.waypay.one" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            textDecoration: 'none', 
            color: 'inherit',
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        >
          ПОЛУЧИТЬ ДОСТУП
        </a>
      </DemoBadge>
      
      <StickyHeader>
        <HeaderTitleGroup>
          <UserAvatar>
            <UserIcon />
          </UserAvatar>
          <CustomTitle style={{whiteSpace: 'nowrap'}}>{texts.pageTitle}</CustomTitle>
          <WildInputContainer>
            <CustomInput
              style={{width: "400px"}}
              inputType="fullname"
              placeholder="ФИО (минимум 5 символов)"
              value={nameFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            />
            {nameFilter && (
              <ClearSearchButton onClick={resetFilters} title="Очистить поиск">
                ✕
              </ClearSearchButton>
            )}
          </WildInputContainer>
          <TotalCountBadge>
            ВСЕГО: {formatNumber(totalCount)}
          </TotalCountBadge>
        </HeaderTitleGroup>
      </StickyHeader>

      {renderContent()}
    </div>
  );
};

export default BlackCatalogPageContent;
export type { BlackCatalogPageContentTexts } from "./types";