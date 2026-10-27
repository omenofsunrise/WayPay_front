import { useState, useCallback, useEffect } from "react";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../components/ui/fields/CustomInput";
import PageLayout from "../components/ui/Layouts/PageLayout";
import ClientModal from "../components/modal/CrudInherited/ClientModal";
import useClients from "../api/hooks/useClient";
import type { ClientForm } from "../api/types/client";
import PhoneModalInput from "../components/ui/fields/PhoneModalInput";
import styled from "styled-components";
import { Phone, Plus, Search, X } from "lucide-react";
import ClientCard from "../components/ui/cards/ClientCard";
import ClientDossier from "../components/ui/Dossiers/ClientDossier";
import { useAuth } from "../сontext/AuthContext";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import Pagination from "../components/ui/fields/CustomPagination";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import FloatingContextMenu, {
  DANGER_COLOR,
  PRIMARY_COLOR,
  SUCCESS_COLOR,
} from "../components/modal/FloatingContextMenu";

const PAGE_SIZE = 20;

export const ClientCount = styled.span`
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  text-align: left;
  margin-right: auto;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  margin-bottom: 24px;
  max-width: 500px;
  line-height: 1.5;
`;

const ClientsPageLayout = styled(PageLayout)`
  height: calc(100vh - var(--header-height, 56px));
  overflow: hidden;
`;

const ClientListScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(209, 213, 219, 1);
    border-radius: 4px;
  }
`;

const ResetButton = styled.button`
  background: none;
  border: none;
  color: black;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  margin-left: 16px;
  height: 40px;
  padding: 0;
  min-width: 130px;
  white-space: nowrap;

  &:hover {
    color: #374151;
  }
`;

const PageHeader = styled.header`
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 0 14px;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }
`;

const HeadingBlock = styled.div`
  min-width: 0;
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageTitle = styled.h1`
  margin: 0;
  color: #101827;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
`;

const HeaderCountBadge = styled.span`
  display: inline-grid;
  min-width: 34px;
  height: 30px;
  padding: 0 10px;
  box-sizing: border-box;
  place-items: center;
  color: #4b596b;
  font-size: 14px;
  font-weight: 650;
  background: #e8eef4;
  border-radius: 999px;
`;

const PageSubtitle = styled.p`
  margin: 6px 0 0;
  color: #778497;
  font-size: 14px;
  line-height: 1.4;
`;

const AddClientButton = styled.button`
  display: inline-flex;
  min-height: 46px;
  padding: 0 22px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  background: #078891;
  border: 0;
  border-radius: 9px;
  box-shadow: 0 4px 12px rgba(0, 125, 136, 0.18);
  cursor: pointer;

  &:hover { background: #007d88; }
  &:focus-visible { outline: 2px solid rgba(0, 125, 136, 0.42); outline-offset: 2px; }

  @media (max-width: 640px) { width: 100%; }
`;

const SearchPanel = styled.section`
  display: grid;
  grid-template-columns: minmax(230px, 1.15fr) minmax(230px, 1.15fr) 112px auto minmax(180px, 1fr);
  flex-shrink: 0;
  gap: 14px;
  align-items: center;
  margin: 0 0 18px;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #e8edf2;
  border-radius: 13px;
  box-shadow: 0 5px 18px rgba(25, 46, 74, 0.05);

  @media (max-width: 1150px) {
    grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) 112px auto;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const SearchField = styled.div<{ $hasClearButton?: boolean }>`
  position: relative;
  min-width: 0;

  > svg {
    position: absolute;
    top: 50%;
    left: 14px;
    z-index: 1;
    color: #65748a;
    transform: translateY(-50%);
    pointer-events: none;
  }

  > div {
    display: block;
    width: 100%;
    margin: 0;
  }

  input {
    width: 100%;
    max-width: none;
    min-height: 44px;
    padding: 8px ${({ $hasClearButton }) => ($hasClearButton ? "42px" : "14px")} 8px 44px;
    color: #172133;
    font-size: 14px;
    background: #fff;
    border: 1px solid #ced8e2;
    border-radius: 8px;
  }

  input::placeholder { color: #8a96a8; }
`;

const ClearSearchButton = styled.button`
  position: absolute;
  top: 50%;
  right: 10px;
  z-index: 2;
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  color: #718096;
  background: transparent;
  border: 0;
  border-radius: 50%;
  transform: translateY(-50%);
  cursor: pointer;

  &:hover { color: #263548; background: #f0f4f7; }
`;

const SearchButton = styled.button`
  min-height: 44px;
  padding: 0 22px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  background: #078891;
  border: 0;
  border-radius: 8px;
  cursor: pointer;

  &:hover:not(:disabled) { background: #007d88; }
  &:disabled { cursor: not-allowed; opacity: 0.55; }
  &:focus-visible { outline: 2px solid rgba(0, 125, 136, 0.42); outline-offset: 2px; }
`;

const PanelResetButton = styled.button`
  min-height: 44px;
  padding: 0 8px;
  color: #087d86;
  font-size: 14px;
  font-weight: 550;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
  background: transparent;
  border: 0;
  cursor: pointer;

  &:hover { color: #055f67; }
`;

const ResultSummary = styled.div<{ $visible: boolean }>`
  min-height: 36px;
  padding-left: 22px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #68768a;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  border-left: 1px solid #e4e9ef;
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};

  @media (max-width: 1150px) {
    grid-column: 1 / -1;
    min-height: auto;
    padding: 12px 0 0;
    justify-content: flex-start;
    border-top: 1px solid #e4e9ef;
    border-left: 0;
  }

  @media (max-width: 520px) { justify-content: center; }
`;

interface Client {
  id: number;
  fullName: string;
  phone: string;
  secondPhone?: string;
  doc: string;
  birthdate: Date | null;
  docIssueDate: Date | null;
  docIssueYear: number;
  registrationAddress: string | null;
  actualAddress?: string | null;
  creditIds?: string[];
  creditRestTerms?: string[];
  hasPassportPhoto?: boolean;
  blacklist?: boolean;
  employeeId?: number;
}

const getClientWord = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "клиентов";
  if (lastDigit === 1) return "клиент";
  if (lastDigit >= 2 && lastDigit <= 4) return "клиента";
  return "клиентов";
};

const ClientPage = () => {
  const [nameFilter, setNameFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: number | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedClientDossier, setSelectedClientDossier] =
    useState<Client | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [longPressClient, setLongPressClient] = useState<Client | null>(null);
  const [blacklistUpdatingIds, setBlacklistUpdatingIds] = useState<Set<number>>(new Set());
  const { hasRole } = useAuth();

  // Добавляем состояние для общего количества клиентов
  const [totalClientsCount, setTotalClientsCount] = useState<number>(0);

  const columnToApiSortMap: Record<number, string> = {
    0: "id",
    1: "fullName",
    3: "birthdate",
  };

  const {
    isLoading,
    error,
    data: clientsData,
    getClients,
    createClient,
    updateClient,
    deleteClient,
    checkClientCredits,
    setClientBlacklist,
  } = useClients();

  // Загружаем общее количество клиентов при инициализации
  useEffect(() => {
    const loadTotalClientsCount = async () => {
      try {
        // Делаем запрос с минимальными параметрами только для получения количества
        const params = {
          page: 1,
          pageSize: 0, // Минимальный размер страницы, так как нам нужен только totalCount
          FullName: undefined,
          Phone: undefined,
        };

        const response = await getClients(params);
        setTotalClientsCount(response.totalCount || 0);
      } catch (err) {
        console.error("Ошибка при загрузке общего количества клиентов:", err);
        setTotalClientsCount(0);
      }
    };

    loadTotalClientsCount();
  }, []); // Пустой массив зависимостей - выполнится только при монтировании

  const handleCardMouseDown = useCallback((client: Client) => {
    const timer = setTimeout(() => {
      setLongPressClient(client);
    }, 500);
    setLongPressTimer(timer);
  }, []);

  const handleCardMouseUp = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleCardTouchStart = useCallback((client: Client) => {
    const timer = setTimeout(() => {
      setLongPressClient(client);
    }, 500);
    setLongPressTimer(timer);
  }, []);

  const handleCardTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Добавьте этот useEffect для обработки long press
  useEffect(() => {
    if (longPressClient) {
      // Позиционируем меню рядом с элементом
      const element = document.getElementById(
        `client-card-${longPressClient.id}`
      );
      if (element) {
        const rect = element.getBoundingClientRect();
        setContextMenu({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          client: longPressClient,
        });
      }
      setLongPressClient(null);
    }
  }, [longPressClient]);

  const resetFilters = useCallback(() => {
    setNameFilter("");
    setPhoneFilter("");
    setSearchTriggered(false);
    setCurrentPage(1);
    setHasSearched(false);
    setSortConfig({ key: null, direction: "asc" });
  }, []);

  const handleCardClick = (client: Client) => {
    setSelectedClientDossier(client);
  };

  const loadClients = useCallback(async () => {
    // обрезаем пробелы по краям, чтобы поиск находил при вводе с хвостовыми пробелами
    const trimmedName = nameFilter.trim();
    const trimmedPhone = phoneFilter.trim();

    const shouldSearch =
      searchTriggered &&
      (trimmedName.length >= 2 ||
        (trimmedPhone.replace(/\D/g, "").length >= 11 &&
          trimmedPhone.replace(/\D/g, "").length <= 15));

    if (!shouldSearch && searchTriggered) {
      return;
    }

    const params: any = {
      page: currentPage,
      pageSize: PAGE_SIZE,
      FullName: trimmedName || undefined,
      Phone: trimmedPhone || undefined,
    };

    if (sortConfig.key !== null) {
      params.sortBy = columnToApiSortMap[sortConfig.key];
      params.sortDirection = sortConfig.direction;
    }

    await getClients(params);
    setHasSearched(true);
  }, [nameFilter, phoneFilter, sortConfig, getClients, searchTriggered, currentPage]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    client: Client | null;
  } | null>(null);

  const handleBlacklistChange = useCallback(async (client: Client, blacklist: boolean) => {
    const action = blacklist ? "добавить в чёрный список" : "убрать из чёрного списка";
    if (!window.confirm(`Вы уверены, что хотите ${action} клиента ${client.fullName}?`)) {
      return;
    }

    setBlacklistUpdatingIds(prev => new Set(prev).add(client.id));
    try {
      await setClientBlacklist(client.id, blacklist);
      setSelectedClientDossier(prev => prev?.id === client.id
        ? { ...prev, blacklist }
        : prev);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось изменить чёрный список");
    } finally {
      setBlacklistUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(client.id);
        return next;
      });
    }
  }, [setClientBlacklist]);

  const handleCardRightClick = useCallback(
    (e: React.MouseEvent, client: Client) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        client,
      });
    },
    []
  );

  const handleContextMenuAction = useCallback(
    (action: "edit" | "delete" | "blacklist") => {
      if (!contextMenu?.client) return;

      if (action === "edit") {
        handleEditClient(contextMenu.client);
      } else if (action === "delete") {
        handleDeleteClient(contextMenu.client);
      } else if (action === "blacklist") {
        void handleBlacklistChange(contextMenu.client, contextMenu.client.blacklist !== true);
      }

      setContextMenu(null);
    },
    [contextMenu, handleBlacklistChange]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePhoneFilterChange = (value: string) => {
    setPhoneFilter(value);
    setSearchTriggered(false);

    if (!value && !nameFilter) {
      resetFilters();
    }
  };

  useEffect(() => {
    if (searchTriggered) {
      loadClients();
    }
  }, [searchTriggered, loadClients]);

  const handleFilterChange = (value: string) => {
    setNameFilter(value);
    setSearchTriggered(false);

    if (!value && !phoneFilter) {
      resetFilters();
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTriggered(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCreateClient = () => {
    setModalMode("create");
    setSelectedClient({
      id: 0,
      fullName: "",
      phone: "",
      secondPhone: "",
      doc: "",
      birthdate: null,
      docIssueDate: null,
      docIssueYear: 0,
      registrationAddress: "",
      actualAddress: "",
    });
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setModalMode("edit");
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!hasRole("суперадмин") && client.employeeId)
      if (await checkClientCredits(client.id)) {
        alert("Нельзя удалить клиента, привязанного к договору");
        return;
      }

    if (window.confirm("Вы уверены, что хотите удалить этого клиента?")) {
      try {
        await deleteClient(client.id);
        loadClients();
        // Обновляем общее количество после удаления
        setTotalClientsCount((prev) => prev - 1);
      } catch (err) {
        console.error("Ошибка при удалении клиента:", err);
      }
    }
  };

  const handleOpenDossier = useCallback((client: Client) => {
    setSelectedClientDossier(client);
  }, []);

  const handleSubmitClient = async (
    clientData: Omit<ClientForm, "doc" | "docIssueDate"> | ClientForm
  ): Promise<boolean> => {
    try {
      const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split(".").map(Number);
        return new Date(year, month - 1, day);
      };

      const apiData = {
        fullName: clientData.fullName,
        phone: clientData.phone,
        secondPhone: clientData.secondPhone || undefined,
        birthdate: parseDate(clientData.birthdate),
        doc: (clientData as ClientForm).doc || undefined,
        docIssueDate:
          parseDate((clientData as ClientForm).docIssueDate || "") || undefined,
        docIssueYear: (clientData as ClientForm).docIssueDate || 0,
        registrationAddress: clientData.registrationAddress,
        actualAddress: clientData.actualAddress,
      };

      if (modalMode === "create") {
        await createClient(apiData);
        // Обновляем общее количество после создания
        setTotalClientsCount((prev) => prev + 1);
      } else if (modalMode === "edit" && selectedClient?.id) {
        await updateClient(selectedClient.id, apiData);
      }

      loadClients();
      setIsModalOpen(false);
      return true;
    } catch (error: any) {
      // Отказ пробрасываем дальше: форма покажет причину и останется открытой
      // с набранным. Раньше он гасился здесь, окно закрывалось, и человек
      // считал, что клиент создан.
      throw error instanceof Error
        ? error
        : new Error("Не удалось сохранить клиента");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div>Загрузка...</div>;
    }

    if (error) {
      return <div>{error}</div>;
    }

    if (!hasSearched) {
      return (
        <EmptyStateContainer>
          <EmptyStateIcon>👥</EmptyStateIcon>
          <EmptyStateTitle>Начните поиск клиентов</EmptyStateTitle>
          <EmptyStateText>
            Введите ФИО клиента (минимум 5 символов) или полный номер телефона
            для поиска в базе данных.
          </EmptyStateText>
        </EmptyStateContainer>
      );
    }

    if (clientsData && clientsData.items.length === 0) {
      return (
        <EmptyStateContainer>
          <EmptyStateIcon>🔍</EmptyStateIcon>
          <EmptyStateTitle>Клиент не найден</EmptyStateTitle>
          <EmptyStateText>
            По вашему запросу "{nameFilter || phoneFilter}" ничего не найдено.
            Попробуйте изменить критерии поиска или добавьте нового клиента.
          </EmptyStateText>
          <DarkCyanButton onClick={handleCreateClient}>
            + Добавить нового клиента
          </DarkCyanButton>
          <ResetButton onClick={resetFilters} style={{ marginTop: "16px" }}>
            Сбросить фильтры
          </ResetButton>
        </EmptyStateContainer>
      );
    }

    return (
      <div>
        {clientsData?.items.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            onRightClick={handleCardRightClick}
            onOpenDossier={handleOpenDossier}
            onBlacklistChange={handleBlacklistChange}
            canRemoveFromBlacklist={hasRole("суперадмин")}
            isBlacklistUpdating={blacklistUpdatingIds.has(client.id)}
            onMouseDown={() => handleCardMouseDown(client)}
            onMouseUp={handleCardMouseUp}
            onMouseLeave={handleCardMouseUp}
            onTouchStart={() => handleCardTouchStart(client)}
            onTouchEnd={handleCardTouchEnd}
            onTouchCancel={handleCardTouchEnd}
          />
        ))}

        {(clientsData?.totalItemsCount || 0) > PAGE_SIZE && (
          <PaginationLayout>
            <CountInfoTitle total={clientsData?.totalItemsCount || 0} />
            <Pagination
              total={clientsData?.totalItemsCount || 0}
              current={currentPage}
              onChange={setCurrentPage}
              itemsPerPage={PAGE_SIZE}
            />
          </PaginationLayout>
        )}
      </div>
    );
  };

  return (
    <ClientsPageLayout onClick={closeContextMenu}>
      {selectedClientDossier ? (
        <ClientListScrollArea>
          <ClientDossier
            client={selectedClientDossier}
            comments={[]}
            installments={[]}
            onBack={() => setSelectedClientDossier(null)}
            onAddComment={(comment) => console.log("Add comment:", comment)}
            onUploadPassport={(file) => console.log("Upload passport:", file)}
          />
        </ClientListScrollArea>
      ) : (
        <>
          <PageHeader>
            <HeadingBlock>
              <HeadingRow>
                <PageTitle>Клиенты</PageTitle>
                <HeaderCountBadge>{totalClientsCount}</HeaderCountBadge>
              </HeadingRow>
              <PageSubtitle>Управление клиентами и договорами</PageSubtitle>
            </HeadingBlock>
            <AddClientButton onClick={handleCreateClient} type="button">
              <Plus size={20} />
              Добавить клиента
            </AddClientButton>
          </PageHeader>

          <SearchPanel>
            <SearchField $hasClearButton={Boolean(nameFilter)}>
              <Search size={19} />
              <CustomInput
                inputType="fullname"
                placeholder="ФИО клиента"
                value={nameFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              {nameFilter && (
                <ClearSearchButton
                  aria-label="Очистить ФИО"
                  onClick={() => handleFilterChange("")}
                  type="button"
                >
                  <X size={17} />
                </ClearSearchButton>
              )}
            </SearchField>
            <SearchField>
              <Phone size={18} />
              <PhoneModalInput
                placeholder="Телефон (полный номер)"
                value={phoneFilter}
                onChange={(e) => handlePhoneFilterChange(e.target.value)}
                onKeyPress={handleKeyPress}
                name="phone"
              />
            </SearchField>
            <SearchButton
              onClick={handleSearch}
              disabled={
                !(
                  nameFilter.trim().length >= 5 ||
                  phoneFilter.trim().replace(/\D/g, "").length >= 11
                )
              }
              type="button"
            >
              Найти
            </SearchButton>
            <PanelResetButton onClick={resetFilters} type="button">
              Сбросить
            </PanelResetButton>
            <ResultSummary $visible={hasSearched}>
              Найдено: {clientsData?.totalItemsCount || 0}{" "}
              {getClientWord(clientsData?.totalItemsCount || 0)}
            </ResultSummary>
          </SearchPanel>

          <ClientListScrollArea>{renderContent()}</ClientListScrollArea>

          <ClientModal
            mode={modalMode}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmitClient}
            initialData={
              selectedClient || {
                id: 0,
                fullName: "",
                phone: "",
                secondPhone: "",
                doc: "",
                birthdate: null,
                docIssueDate: null,
                docIssueYear: 0,
                registrationAddress: "",
                actualAddress: "",
              }
            }
          />

          {contextMenu && (
            <FloatingContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={closeContextMenu}
              items={[
                {
                  label: "Редактировать клиента",
                  color: PRIMARY_COLOR,
                  action: () => handleContextMenuAction("edit"),
                },
                ...(!contextMenu.client?.blacklist || hasRole("суперадмин")
                  ? [
                      {
                        label: contextMenu.client?.blacklist
                          ? "Убрать из чёрного списка"
                          : "Добавить в чёрный список",
                        color: contextMenu.client?.blacklist ? SUCCESS_COLOR : DANGER_COLOR,
                        action: () => handleContextMenuAction("blacklist"),
                      },
                    ]
                  : []),
                {
                  label: "Удалить клиента",
                  color: DANGER_COLOR,
                  dividerBefore: true,
                  action: () => handleContextMenuAction("delete"),
                },
              ]}
            />
          )}
        </>
      )}
    </ClientsPageLayout>
  );
};

export default ClientPage;
