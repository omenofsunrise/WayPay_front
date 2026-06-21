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
  TotalCountBadge,
} from "./styles";
import useBlacklist from "../../api/hooks/useBlacklist";
import type { BlacklistParams } from "../../api/types/blacklist";
import BlackCatalogCard from "./components/BlackCatalogCard";
import CustomInput from "../../components/ui/fields/CustomInput";
import CustomTitle from "../../components/ui/Text/CustomTitle";

const BlackCatalogPageContent: React.FC<BlackCatalogPageContentProps> = ({
  texts,
}) => {
  const storageKey = "black_catalog_search_state";
  const [totalCount, setTotalCount] = useState<number>(0);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const readStoredState = () => {
    try {
      const storedRaw = sessionStorage.getItem(storageKey);
      if (!storedRaw) {
        return { nameFilter: "", hasSearched: false, searchTriggered: false };
      }
      const stored = JSON.parse(storedRaw) as {
        nameFilter?: string;
        hasSearched?: boolean;
      };
      const nameFilter =
        typeof stored.nameFilter === "string" ? stored.nameFilter : "";
      const canSearch = nameFilter.length >= 5;
      return {
        nameFilter,
        hasSearched: Boolean(stored.hasSearched) && canSearch,
        searchTriggered: Boolean(stored.hasSearched) && canSearch,
      };
    } catch {
      sessionStorage.removeItem(storageKey);
      return { nameFilter: "", hasSearched: false, searchTriggered: false };
    }
  };

  const initialState = readStoredState();
  const [nameFilter, setNameFilter] = useState(initialState.nameFilter);
  const [hasSearched, setHasSearched] = useState(initialState.hasSearched);

  const UserIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );

  const { isLoading, error, getBlackCatalog, getBlackCatalogCount, data } =
    useBlacklist();

  // Получаем общее количество записей через основной API (apiClient)
  useEffect(() => {
    const fetchTotalCount = async () => {
      const count = await getBlackCatalogCount();
      if (count !== null) {
        setTotalCount(count);
      }
    };

    fetchTotalCount();
  }, [getBlackCatalogCount]);

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
    setNameFilter("");
    setHasSearched(false);
  }, []);

  const loadBlacklist = useCallback(async () => {
    const params: BlacklistParams = {};
    params.pageSize = 20;
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
          <EmptyStateText>
            {texts.notFoundDescription(nameFilter)}
          </EmptyStateText>
        </EmptyStateContainer>
      );
    }

    return (
      <div style={{ marginTop: "20px" }}>
        {data?.items.map((item) => (
          <BlackCatalogCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: "15px", position: "relative" }}>
      <StickyHeader>
        <HeaderTitleGroup>
          <UserAvatar>
            <UserIcon />
          </UserAvatar>
          <CustomTitle style={{ whiteSpace: "nowrap" }}>
            {texts.pageTitle}
          </CustomTitle>
          <WildInputContainer>
            <CustomInput
              style={{ width: "400px" }}
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
          <TotalCountBadge>ВСЕГО: {formatNumber(totalCount)}</TotalCountBadge>
        </HeaderTitleGroup>
      </StickyHeader>

      {renderContent()}
    </div>
  );
};

export default BlackCatalogPageContent;
export type { BlackCatalogPageContentTexts } from "./types";
