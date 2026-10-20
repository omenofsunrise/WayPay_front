import { useState, useCallback, useEffect } from "react";
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import CustomInput from "../components/ui/fields/CustomInput";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import ClientModal from "../components/modal/CrudInherited/ClientModal";
import useClients from "../api/hooks/useClient";
import type { ClientForm } from "../api/types/client";
import PhoneModalInput from "../components/ui/fields/PhoneModalInput";
import { Container } from "react-bootstrap";
import styled from "styled-components";
import ClientCard from "../components/ui/cards/ClientCard";
import ClientDossier from "../components/ui/Dossiers/ClientDossier";
import { formatPhoneHref } from "../utils/phoneUtils";
import { useAuth } from "../сontext/AuthContext";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import Pagination from "../components/ui/fields/CustomPagination";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import { TitleContainer } from "./BlackCatalog";

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

const StickyFilterField = styled(FilterField)`
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 16px 0;
  background-color: rgba(249, 250, 250, 1);
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

const ContextMenu = styled.div<{ x: number; y: number }>`
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 160px;
  padding: 4px 0;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
`;

const MenuItem = styled.div<{ danger?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${(props) => (props.danger ? "#ff4d4f" : "#333")};

  &:hover {
    background-color: #f5f5f5;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
`;

export const StyledCountInfo = styled(CountInfoTitle)`
  margin-left: auto;
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
}

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
  const { hasRole, authInfo } = useAuth();

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
    (action: "edit" | "delete") => {
      if (!contextMenu?.client) return;

      if (action === "edit") {
        handleEditClient(contextMenu.client);
      } else if (action === "delete") {
        handleDeleteClient(contextMenu.client);
      }

      setContextMenu(null);
    },
    [contextMenu]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

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
    <PageLayout onClick={closeContextMenu}>
      {selectedClientDossier ? (
        <ClientDossier
          client={selectedClientDossier}
          comments={[]}
          installments={[]}
          onBack={() => setSelectedClientDossier(null)}
          onAddComment={(comment) => console.log("Add comment:", comment)}
          onUploadPassport={(file) => console.log("Upload passport:", file)}
        />
      ) : (
        <>
          <TitleContainer style={{ position: "sticky" }}>
            <TitleContainer style={{ maxWidth: "100px" }}>
              <CustomTitle>Клиенты</CustomTitle>
              {clientsData && clientsData.items.length > 0 && (
                <ClientCount>({clientsData.totalItemsCount})</ClientCount>
              )}
            </TitleContainer>
            <StyledCountInfo total={clientsData?.totalItemsCount} />
          </TitleContainer>

          <StickyFilterField>
            <Container
              style={{
                display: "flex",
                flexDirection: "row",
                width: "50vw",
                gap: "15px",
              }}
            >
              <CustomInput
                inputType="fullname"
                placeholder="ФИО клиента (минимум 5 символов)"
                value={nameFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <PhoneModalInput
                placeholder="Телефон (полный номер)"
                value={phoneFilter}
                onChange={(e) => handlePhoneFilterChange(e.target.value)}
                onKeyPress={handleKeyPress}
                name="phone"
              />
              <ResetButton onClick={resetFilters}>Сбросить фильтры</ResetButton>
              <DarkCyanButton
                onClick={handleSearch}
                disabled={
                  !(
                    nameFilter.trim().length >= 5 ||
                    phoneFilter.trim().replace(/\D/g, "").length >= 11
                  )
                }
              >
                Поиск
              </DarkCyanButton>
            </Container>
            <DarkCyanButton
              style={{ width: "25vw", marginLeft: "auto" }}
              onClick={handleCreateClient}
            >
              + Добавить
            </DarkCyanButton>
          </StickyFilterField>

          {renderContent()}

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
            <>
              <Backdrop onClick={closeContextMenu} />
              <ContextMenu x={contextMenu.x} y={contextMenu.y}>
                <MenuItem onClick={() => handleContextMenuAction("edit")}>
                  Редактировать клиента
                </MenuItem>
                <MenuItem
                  danger
                  onClick={() => handleContextMenuAction("delete")}
                >
                  Удалить клиента
                </MenuItem>
              </ContextMenu>
            </>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default ClientPage;
