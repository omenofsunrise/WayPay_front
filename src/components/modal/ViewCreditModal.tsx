import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import TitleField from "../ui/Layouts/TitleLayout";
import CustomTitle from "../ui/Text/CustomTitle";
import ModalInfoTitle from "../ui/Text/ModalInfoTitle";
import AddButtonImage from "../../assets/ui/buttons/AddButton.svg";
import CustomTable from "../ui/tables/CustomTable";
import useNotes from "../../api/hooks/useNote";
import { formatDate } from "../../utils/dateFormatter";
import useCredit from "../../api/hooks/useCredit";
import type { Credit, CreditListResponse } from "../../api/types/credit";
import Tabs from "../ui/fields/Tabs";
import { formatMoney } from "../../utils/formatPrice";
import type {
  Payment,
  PaymentByCreditParams,
  PaymentTab,
} from "../../api/types/payment";
import usePayment from "../../api/hooks/usePayment";
import { NOTEABLE_TYPES } from "../../api/types/note";
import type { Note } from "../../api/types/note";
import useSoldProducts from "../../api/hooks/useSoldProduct";
import type { SoldProduct } from "../../api/types/soldProduct";
import useSchedule from "../../api/hooks/useSchedule";
import type {
  ScheduleItem,
  ScheduleParams,
  ScheduleDetails,
} from "../../api/types/schedule";
import CreateNoteModal from "./CreateNoteModal";
import PhotoViewerModal from "./PhotoViewerModal";
import useChat from "../../api/hooks/useChat";
import useCompany from "../../api/hooks/useCompany";
import PaymentConfirmationGenerator from "../../utils/doxcUtils/paymentConfirmationGenerator";
import paymentService from "../../api/services/paymentService";
import noteService from "../../api/services/noteService";
import NewPaymentModal from "./NewPaymentModal";
import EditScheduleDateModal from "./EditScheduleDateModal";
import { sendWhatsAppMessage } from "../../utils/sendWhatsAppMessage";
import { formatPhoneHref } from "../../utils/phoneUtils";
import PhoneLink from "../ui/links/PhoneLink";
import WhatsAppChat from "../WhatsAppChat";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import clientService from "../../api/services/clientService";
import guarantorService from "../../api/services/guarantorService";
import ContactsEditor from "../ui/ContactsEditor";

interface ViewCreditModalProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenCredit?: (id: number) => void;
}

type CreditTab = "client" | "payments" | "products" | "guarantor" | "notes";

const ACTIVE_TAB_STORAGE_KEY = "view_credit_modal_active_tab";

type CreditStatusKey = "active" | "overdue" | "closed";

const getCreditStatus = (
  credit: Credit | null,
  overdueDays = 0
): { key: CreditStatusKey; label: string } => {
  if (!credit) return { key: "active", label: "Активный" };
  if (!credit.isActive || credit.rest === 0)
    return { key: "closed", label: "Закрытый" };
  if ((credit.debtDays && credit.debtDays > 0) || overdueDays > 0)
    return { key: "overdue", label: "Просроченный" };
  return { key: "active", label: "Активный" };
};

const getObjectValue = <T,>(
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
): T | undefined => {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return value as T;
    }
  }
  return undefined;
};

const getNumberValue = (
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
): number | undefined => {
  const value = getObjectValue<number | string>(source, ...keys);
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && !Number.isNaN(parsed)
    ? parsed
    : undefined;
};

const normalizeCreditDetails = (credit: Credit): Credit => {
  const raw = credit as unknown as Record<string, unknown>;
  const guarantor = getObjectValue<Record<string, unknown>>(
    raw,
    "guarantor",
    "Guarantor"
  );

  return {
    ...credit,
    guarantorFullname:
      getObjectValue<string>(
        raw,
        "guarantorFullname",
        "guarantorFullName",
        "GuarantorFullname",
        "GuarantorFullName",
        "guarantorName",
        "GuarantorName"
      ) ??
      getObjectValue<string>(
        guarantor,
        "fullName",
        "FullName",
        "name",
        "Name"
      ) ??
      credit.guarantorFullname,
    guarantorPhone:
      getObjectValue<string>(raw, "guarantorPhone", "GuarantorPhone") ??
      getObjectValue<string>(guarantor, "phone", "Phone") ??
      credit.guarantorPhone,
    guarantorBirthdate:
      getObjectValue<string | Date>(
        raw,
        "guarantorBirthdate",
        "GuarantorBirthdate",
        "guarantorBirthDate",
        "GuarantorBirthDate"
      ) ??
      getObjectValue<string | Date>(guarantor, "birthdate", "Birthdate") ??
      credit.guarantorBirthdate,
    guarantorAddress:
      getObjectValue<string>(raw, "guarantorAddress", "GuarantorAddress") ??
      getObjectValue<string>(guarantor, "address", "Address") ??
      credit.guarantorAddress,
    guarantorClientId:
      getNumberValue(raw, "guarantorClientId", "GuarantorClientId") ??
      credit.guarantorClientId,
    debtDays:
      getNumberValue(
        raw,
        "debtDays",
        "DebtDays",
        "overdueDays",
        "OverdueDays"
      ) ?? credit.debtDays,
    debt:
      getNumberValue(raw, "debt", "Debt", "overdueDebt", "OverdueDebt") ??
      credit.debt,
  };
};

// Эндпоинт /Credit/{id} (одиночный) часто не содержит вычисляемых полей —
// просрочки (debt, debtDays) и данных поручителя, — которые есть в списке /Credit
// (именно их видно в таблицах «Договора» и «Контроль договоров»). Подмешиваем их.
const mergeListComputedFields = (
  credit: Credit,
  listCredit: Credit | null
): Credit => {
  if (!listCredit) return credit;
  const preferNumber = (primary?: number, fallback?: number) =>
    primary != null && primary !== 0 ? primary : fallback ?? primary;
  return {
    ...credit,
    guarantorFullname: credit.guarantorFullname || listCredit.guarantorFullname,
    guarantorPhone: credit.guarantorPhone || listCredit.guarantorPhone,
    guarantorAddress: credit.guarantorAddress || listCredit.guarantorAddress,
    guarantorClientId: credit.guarantorClientId ?? listCredit.guarantorClientId,
    guarantorId: credit.guarantorId ?? listCredit.guarantorId,
    debt: preferNumber(credit.debt, listCredit.debt),
    debtDays: preferNumber(credit.debtDays, listCredit.debtDays),
    currentMonthDebt: preferNumber(
      credit.currentMonthDebt,
      listCredit.currentMonthDebt
    ),
  };
};

// /Credit/create-request/{id} — это данные, введённые при оформлении договора.
// Самый надёжный источник поручителя: либо клиент-поручитель
// (guarantorClientId + guarantorFullname), либо свободный поручитель (объект guarantor).
const applyGuarantorFromRequest = (
  credit: Credit,
  request: Record<string, unknown> | null
): Credit => {
  if (!request) return credit;
  const guarantor = getObjectValue<Record<string, unknown>>(
    request,
    "guarantor",
    "Guarantor"
  );
  return {
    ...credit,
    guarantorClientId:
      credit.guarantorClientId ??
      getNumberValue(request, "guarantorClientId", "GuarantorClientId"),
    guarantorFullname:
      credit.guarantorFullname ||
      getObjectValue<string>(
        request,
        "guarantorFullname",
        "guarantorFullName",
        "GuarantorFullname",
        "GuarantorFullName"
      ) ||
      getObjectValue<string>(guarantor, "fullName", "FullName", "name", "Name"),
    guarantorPhone:
      credit.guarantorPhone ||
      getObjectValue<string>(guarantor, "phone", "Phone"),
    guarantorBirthdate:
      credit.guarantorBirthdate ||
      getObjectValue<string | Date>(guarantor, "birthdate", "Birthdate"),
    guarantorAddress:
      credit.guarantorAddress ||
      getObjectValue<string>(guarantor, "address", "Address"),
  };
};

const isSchedulePaid = (schedule: ScheduleDetails): boolean =>
  schedule.payed === true ||
  schedule.isPaid === true ||
  schedule.status === "Payed";

const TabLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <TabLabelWrapper>
    <TabIcon>{icon}</TabIcon>
    <span>{label}</span>
  </TabLabelWrapper>
);

// Интерфейс для заметки с загруженным файлом
interface NoteWithFile extends Note {
  fileBase64?: string;
  fileName?: string;
  isLoading?: boolean;
}

const ViewCreditModal: React.FC<ViewCreditModalProps> = ({
  id,
  isOpen,
  onClose,
  onOpenCredit,
}) => {
  const {
    notes: initialNotes,
    isLoading: isNotesLoading,
    error: notesError,
    getCreditNotes,
    createNote,
    deleteNote,
    getFileByNote,
  } = useNotes();

  const {
    getCredits,
    getCreditById,
    getCreditListByClient,
    getCreateCreditRequest,
    toggleTerminated,
  } = useCredit();
  const [creditData, setCreditData] = useState<Credit | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const copyNameTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyNameTimerRef.current)
        window.clearTimeout(copyNameTimerRef.current);
    },
    []
  );

  const handleCopyName = useCallback(
    async (name: string | null | undefined, key: string) => {
      if (!name) return;
      try {
        // navigator.clipboard доступен только в secure context (https / localhost).
        // При открытии по http/IP он undefined — используем запасной способ.
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(name);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = name;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          textarea.style.pointerEvents = "none";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(textarea);
          if (!ok) throw new Error('execCommand("copy") вернул false');
        }
        setCopiedName(key);
        if (copyNameTimerRef.current)
          window.clearTimeout(copyNameTimerRef.current);
        copyNameTimerRef.current = window.setTimeout(
          () => setCopiedName(null),
          1500
        );
      } catch (err) {
        console.error("Не удалось скопировать ФИО:", err);
      }
    },
    []
  );
  const [activeTab, setActiveTab] = useState<CreditTab>(() => {
    const saved = localStorage.getItem(
      ACTIVE_TAB_STORAGE_KEY
    ) as CreditTab | null;
    return saved &&
      ["client", "payments", "products", "guarantor", "notes"].includes(saved)
      ? saved
      : "client";
  });
  const [clientCredits, setClientCredits] = useState<
    CreditListResponse[] | null
  >(null);
  const [guarantorCredits, setGuarantorCredits] = useState<
    CreditListResponse[] | null
  >(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  const handleTabChange = useCallback((tab: CreditTab) => {
    setActiveTab(tab);
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  }, []);

  const getGuarantorClientId = (credit: Credit | null): number | undefined => {
    if (!credit) return undefined;
    const raw =
      credit.guarantorClientId ??
      credit.guarantorId ??
      (credit as unknown as { GuarantorClientId?: number }).GuarantorClientId;
    return typeof raw === "number" && raw > 0 ? raw : undefined;
  };

  /**
   * Поля, которые заполняют при заведении человека, но в договор они не едут.
   * Клиент даёт их целиком, самостоятельный поручитель — частично.
   */
  type PersonExtra = {
    doc?: string;
    docIssueDate?: Date | null | string;
    registrationAddress?: string;
    actualAddress?: string;
    secondPhone?: string;
  };

  /**
   * Адрес, уже выведенный выше в карточке. В типе Credit такого поля нет —
   * читаем тем же безопасным аксессором, что и остальные поля этого файла,
   * чтобы не плодить обращения к необъявленным свойствам.
   */
  const clientAddressShown = getObjectValue<string>(
    creditData as unknown as Record<string, unknown>,
    "address",
    "Address",
    "clientAddress",
    "ClientAddress"
  );

  const [clientDetails, setClientDetails] = useState<PersonExtra | null>(null);
  const [guarantorDetails, setGuarantorDetails] = useState<PersonExtra | null>(
    null
  );

  /**
   * Строки карточки, которых нет в договоре: паспорт, адреса, второй телефон.
   * Показываются только заполненные. Адрес, уже выведенный выше, не дублируем —
   * в договоре обычно лежит адрес регистрации.
   */
  const renderPersonExtraRows = (
    person: PersonExtra | null,
    addressAlreadyShown?: string
  ) => {
    if (!person) return null;

    const shown = addressAlreadyShown?.trim().toLowerCase();
    const isNew = (value?: string) => {
      const text = value?.trim();
      return text && text.toLowerCase() !== shown ? text : null;
    };

    const passport = [
      person.doc?.trim(),
      person.docIssueDate
        ? `от ${new Date(`${person.docIssueDate}`).toLocaleDateString("ru-RU")}`
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    const registration = isNew(person.registrationAddress);
    const actual = isNew(person.actualAddress);
    const secondPhone = person.secondPhone?.trim();

    return (
      <>
        {passport && (
          <InfoRow>
            <InfoIcon>
              <BadgeOutlinedIcon fontSize="small" />
            </InfoIcon>
            <InfoText>Паспорт {passport}</InfoText>
          </InfoRow>
        )}
        {registration && (
          <InfoRow>
            <InfoIcon>
              <HomeOutlinedIcon fontSize="small" />
            </InfoIcon>
            <InfoText>Регистрация: {registration}</InfoText>
          </InfoRow>
        )}
        {actual && (
          <InfoRow>
            <InfoIcon>
              <PlaceOutlinedIcon fontSize="small" />
            </InfoIcon>
            <InfoText>Фактический: {actual}</InfoText>
          </InfoRow>
        )}
        {secondPhone && (
          <InfoRow>
            <InfoIcon>
              <PhoneAndroidOutlinedIcon fontSize="small" />
            </InfoIcon>
            <InfoText>
              <PhoneLink href={formatPhoneHref(secondPhone)}>
                {secondPhone}
              </PhoneLink>
            </InfoText>
          </InfoRow>
        )}
      </>
    );
  };

  /** Разводит поручителя-клиента и самостоятельного поручителя по их таблицам. */
  const loadGuarantorExtra = async (
    credit: Credit
  ): Promise<PersonExtra | null> => {
    const asClientId = credit.guarantorClientId;
    if (credit.guarantorType === "Client" && asClientId) {
      return clientService.getClientById(asClientId).catch(() => null);
    }

    const ownId = credit.guarantorId;
    if (!ownId) return null;

    const guarantor = await guarantorService
      .getGuarantorById(ownId)
      .catch(() => null);
    if (!guarantor) return null;

    // У самостоятельного поручителя адрес один — показываем его как адрес
    // регистрации, отдельного фактического у него просто нет.
    return {
      doc: guarantor.doc,
      registrationAddress: guarantor.address,
    };
  };

  const loadRelatedCredits = useCallback(async () => {
    if (!creditData) return;
    setIsLoadingRelated(true);
    try {
      // Полные карточки нужны ради данных, которых нет в договоре: паспорт,
      // адрес регистрации, фактический адрес, второй телефон. Ошибку глотаем —
      // без этих полей окно просто покажет то, что было раньше.
      setClientDetails(
        creditData.clientId
          ? await clientService
              .getClientById(creditData.clientId)
              .catch(() => null)
          : null
      );

      // Поручитель бывает двух видов, и таблицы у них разные. Брать клиента
      // по guarantorId нельзя: это идентификатор чужой таблицы, и по нему
      // пришёл бы посторонний человек с чужим паспортом.
      setGuarantorDetails(await loadGuarantorExtra(creditData));

      if (creditData.clientId) {
        const clientRes = await getCreditListByClient(
          creditData.clientId
        ).catch(() => null);
        setClientCredits(
          clientRes?.items?.filter((c) => c.id !== creditData.id) ?? []
        );
      } else {
        setClientCredits([]);
      }

      const guarantorClientId = getGuarantorClientId(creditData);
      if (guarantorClientId) {
        const guarantorRes = await getCreditListByClient(
          guarantorClientId
        ).catch(() => null);
        setGuarantorCredits(
          guarantorRes?.items?.filter((c) => c.id !== creditData.id) ?? []
        );
      } else {
        setGuarantorCredits([]);
      }
    } finally {
      setIsLoadingRelated(false);
    }
  }, [creditData, getCreditListByClient]);

  useEffect(() => {
    if (
      (activeTab === "client" || activeTab === "guarantor") &&
      creditData &&
      clientCredits === null &&
      guarantorCredits === null
    ) {
      loadRelatedCredits();
    }
  }, [
    activeTab,
    creditData,
    clientCredits,
    guarantorCredits,
    loadRelatedCredits,
  ]);

  useEffect(() => {
    setClientCredits(null);
    setGuarantorCredits(null);
    // Карточки людей тоже обнуляем: без этого при переходе к другому договору
    // на новой карточке успевает мелькнуть паспорт и адрес предыдущего клиента.
    setClientDetails(null);
    setGuarantorDetails(null);
  }, [id, isOpen]);
  const [notes, setNotes] = useState<NoteWithFile[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  // Заметки по конкретным платежам/строкам графика (noteableType: 'payment')
  const [paymentsWithNotes, setPaymentsWithNotes] = useState<Set<number>>(
    new Set()
  );
  const [schedulesWithNotes, setSchedulesWithNotes] = useState<Set<number>>(
    new Set()
  );
  const [selectedNoteTarget, setSelectedNoteTarget] = useState<{
    id: number;
    label: string;
    kind: "payment" | "schedule";
  } | null>(null);
  const [selectedPaymentNotes, setSelectedPaymentNotes] = useState<Note[]>([]);
  const [isPaymentNoteModalOpen, setIsPaymentNoteModalOpen] = useState(false);
  const [paymentNoteDraft, setPaymentNoteDraft] = useState("");
  const [isSavingPaymentNote, setIsSavingPaymentNote] = useState(false);
  const [isLoadingPaymentNotes, setIsLoadingPaymentNotes] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const { createPrivateChat } = useChat();

  // Обновляем состояние заметок при загрузке из API
  useEffect(() => {
    if (initialNotes) {
      // Преобразуем заметки и добавляем флаг загрузки файлов
      const notesWithFiles: NoteWithFile[] = initialNotes.map((note) => ({
        ...note,
        isLoading: false,
      }));
      setNotes(notesWithFiles);

      // Сразу загружаем файлы для всех заметок, которые имеют fileId
      loadFilesForNotes(notesWithFiles);
    }
  }, [initialNotes]);

  // Загрузка файлов для заметок
  const loadFilesForNotes = async (notesToLoad: NoteWithFile[]) => {
    for (const note of notesToLoad) {
      await loadNoteFile(note.id);
    }
  };

  // Загрузка файла для конкретной заметки
  const loadNoteFile = async (noteId: number) => {
    try {
      // Устанавливаем флаг загрузки
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, isLoading: true } : note
        )
      );

      const fileData = await getFileByNote(noteId);

      if (fileData) {
        // Обновляем заметку с загруженным файлом
        setNotes((prevNotes) =>
          prevNotes.map((note) => {
            if (note.id === noteId) {
              // Определяем тип файла по имени или используем дефолтный
              let fileName = note.fileName || `file_${noteId}`;
              let fileBase64 = fileData;

              // Если это изображение, добавляем data URL prefix
              if (isImageFile(fileName)) {
                const extension = fileName.split(".").pop()?.toLowerCase();
                const mimeType = getMimeTypeFromExtension(extension);
                fileBase64 = `data:${mimeType};base64,${fileData}`;
              }

              return {
                ...note,
                fileBase64,
                fileName,
                isLoading: false,
              };
            }
            return note;
          })
        );
      }
    } catch (error) {
      console.error(`Error loading file for note ${noteId}:`, error);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, isLoading: false } : note
        )
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Полностью блокируем скролл на странице
      document.body.style.overflow = "hidden";
    } else {
      // Восстанавливаем скролл
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Определение MIME типа по расширению файла
  const getMimeTypeFromExtension = (extension?: string): string => {
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      pdf: "application/pdf",
      txt: "text/plain",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    return (
      mimeTypes[extension?.toLowerCase() || ""] || "application/octet-stream"
    );
  };

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    rowIndex: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    rowIndex: -1,
  });

  const handleRowContextMenu = (
    rowData: any[],
    rowIndex: number,
    event: React.MouseEvent
  ) => {
    event.preventDefault();

    if (!scheduleData?.items?.[rowIndex]) return;

    const schedule = scheduleData.items[rowIndex];
    const paymentDate = schedule.paymentDate
      ? new Date(schedule.paymentDate)
      : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      rowIndex,
    });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.visible]);

  const handleCloseContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      rowIndex: -1,
    });
  };

  const handleContextMenuAction = (rowIndex: number) => {
    if (!scheduleData?.items?.[rowIndex]) return;

    const schedule = scheduleData.items[rowIndex];
    setSelectedScheduleForPayment(schedule);
    setIsPaymentModalOpen(true);
    handleCloseContextMenu();
  };

  const {
    data: paymentsData,
    getPaymentsByCreditId,
    createPayment,
  } = usePayment();

  const { data: soldProductsData, getSoldProducts } = useSoldProducts();

  const {
    scheduleData,
    getByCreditId: getSchedules,
    markAsNotified,
    updateDates: updateScheduleDates,
  } = useSchedule();

  const [selectedScheduleRows, setSelectedScheduleRows] = useState<number[]>(
    []
  );
  const [editDateModal, setEditDateModal] = useState<{
    isOpen: boolean;
    ids: number[];
    initialDate?: string;
  }>({ isOpen: false, ids: [] });

  const openEditDateModal = (rowIndex: number) => {
    if (!scheduleData?.items?.length) return;

    const targetIndices =
      selectedScheduleRows.includes(rowIndex) && selectedScheduleRows.length > 0
        ? selectedScheduleRows
        : [rowIndex];

    const ids = targetIndices
      .map((idx) => scheduleData.items[idx]?.id)
      .filter((id): id is number => typeof id === "number");

    if (ids.length === 0) return;

    const firstSchedule = scheduleData.items[targetIndices[0]];
    const initialDate =
      ids.length === 1 && firstSchedule?.paymentDate
        ? new Date(firstSchedule.paymentDate).toISOString()
        : undefined;

    setEditDateModal({ isOpen: true, ids, initialDate });
  };

  const handleConfirmEditDate = async (date: string) => {
    const success = await updateScheduleDates(editDateModal.ids, date);
    if (success) {
      setEditDateModal({ isOpen: false, ids: [] });
      setSelectedScheduleRows([]);
      await loadSchedules();
    }
  };

  const getPaymentTab = useCallback(
    async (paymentId: number): Promise<PaymentTab | null> => {
      try {
        const result = await paymentService.getPaymentTab(paymentId);
        return result;
      } catch (err) {
        console.error("Ошибка при получении данных для документа:", err);
        return null;
      }
    },
    []
  );

  const handleOpenPaymentFromSchedule = (rowData: any[], rowIndex: number) => {
    if (!scheduleData?.items?.[rowIndex]) return;

    const schedule = scheduleData.items[rowIndex];
    setSelectedScheduleForPayment(schedule);
    setIsPaymentModalOpen(true);
  };

  const scheduleTableActions = [
    {
      label: "Добавить платёж",
      action: handleOpenPaymentFromSchedule,
      color: "#008b8b",
    },
    {
      label:
        selectedScheduleRows.length > 1
          ? `Изменить дату (${selectedScheduleRows.length})`
          : "Изменить дату",
      action: (_rowData: any[], rowIndex: number) =>
        openEditDateModal(rowIndex),
      color: "#007D88",
    },
  ];

  const { getAccountDetails } = useCompany();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] =
    useState<ScheduleItem | null>(null);
  const paymentConfirmationGenerator = new PaymentConfirmationGenerator(
    getPaymentTab
  );

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSavePayment = async (paymentData: {
    paymentDate: string;
    principalAmount: number;
    paymentMethod: "cash" | "card";
    bankCardId?: number;
  }) => {
    try {
      if (!creditData) return;

      const paymentRequest = {
        creditId: creditData.id,
        paymentAmount: paymentData.principalAmount,
        datePayment: paymentData.paymentDate,
        type: paymentData.paymentMethod,
        bankCardId: paymentData.bankCardId,
      };

      const result = await createPayment(paymentRequest);

      // Перезагружаем данные после успешного платежа
      await loadPayments();
      await loadSchedules();

      setIsPaymentModalOpen(false);
      setSelectedScheduleForPayment(null);

      return result;
    } catch (error) {
      console.error("Ошибка при сохранении платежа:", error);
      throw error;
    }
  };

  const handlePrintReceipt = async (paymentId: number) => {
    try {
      await paymentConfirmationGenerator.generatePaymentConfirmation(paymentId);
      console.log("Чек успешно сгенерирован");
    } catch (error) {
      console.error("Ошибка при печати чека:", error);
      alert("Платёж создан, но произошла ошибка при печати чека");
    }
  };

  const loadPayments = useCallback(async () => {
    if (id) {
      const params: PaymentByCreditParams = {
        creditId: id,
        page: 1,
        pageSize: 100,
      };
      await getPaymentsByCreditId(params);
    }
  }, [getPaymentsByCreditId, id]);

  const loadSoldProducts = useCallback(async () => {
    if (id) {
      await getSoldProducts(id);
    }
  }, [getSoldProducts, id]);

  const loadSchedules = useCallback(async () => {
    if (id) {
      const params: ScheduleParams = {
        includePayed: true,
        page: 1,
        pageSize: 100,
      };
      await getSchedules(id, params);
    }
  }, [getSchedules, id]);

  const overdueSummary = useMemo(() => {
    const schedules = scheduleData?.items ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedules.reduce(
      (acc, schedule) => {
        const paymentDate = schedule.paymentDate
          ? new Date(schedule.paymentDate)
          : null;
        if (paymentDate) paymentDate.setHours(0, 0, 0, 0);

        const isPaid =
          schedule.payed === true ||
          schedule.isPaid === true ||
          schedule.status === "Payed";
        const isOverdue =
          !isPaid &&
          schedule.paymentAmount > 0 &&
          (schedule.status === "Overdue" ||
            (!!paymentDate && paymentDate < today));

        if (!isOverdue) return acc;

        const days = paymentDate
          ? Math.max(
              acc.days,
              Math.ceil((today.getTime() - paymentDate.getTime()) / 86400000)
            )
          : acc.days;

        return {
          days,
          amount: acc.amount + schedule.paymentAmount,
        };
      },
      { days: 0, amount: 0 }
    );
  }, [scheduleData?.items]);
  const displayedOverdueDays =
    creditData?.debtDays && creditData.debtDays > 0
      ? creditData.debtDays
      : overdueSummary.days;
  const displayedOverdueAmount =
    creditData?.debt && creditData.debt > 0
      ? creditData.debt
      : overdueSummary.amount;

  useEffect(() => {
    loadSoldProducts();
  }, [loadSoldProducts]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (isOpen && id) {
      const fetchData = async () => {
        try {
          setCreditData(null);

          // Одиночный /Credit/{id} не отдаёт вычисляемые поля (просрочка, поручитель),
          // поэтому параллельно берём запись из списка /Credit — там они есть и совпадают
          // с тем, что показано в таблицах «Договора» и «Контроль договоров».
          const [creditById, creditListResult] = await Promise.all([
            getCreditById(Number(id)).catch(() => null),
            getCredits({
              creditId: id.toString(),
              pageSize: 1,
              includeAllStates: true,
            }).catch(() => null),
          ]);

          const creditFromList = creditListResult?.items?.[0] ?? null;
          const baseCredit = creditById ?? creditFromList;
          if (!baseCredit) {
            setCreditData(null);
            return;
          }

          let merged = normalizeCreditDetails(
            mergeListComputedFields(baseCredit, creditFromList)
          );

          // Если поручитель так и не нашёлся (или нет его контактов) — добираем из
          // create-request, где хранятся данные, введённые при оформлении договора.
          const hasGuarantorName = !!merged.guarantorFullname;
          const hasGuarantorContacts =
            !!merged.guarantorPhone ||
            !!merged.guarantorBirthdate ||
            !!merged.guarantorAddress;
          if (!hasGuarantorName || !hasGuarantorContacts) {
            const request = await getCreateCreditRequest(Number(id)).catch(
              () => null
            );
            merged = applyGuarantorFromRequest(
              merged,
              request as unknown as Record<string, unknown> | null
            );
          }

          setCreditData(merged);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
      getCreditNotes(Number(id));
    }
  }, [
    isOpen,
    id,
    getCredits,
    getCreditById,
    getCreditNotes,
    getCreateCreditRequest,
  ]);

  // Обновляем массив изображений при изменении заметок
  useEffect(() => {
    const images = notes
      .filter((note) => note.fileBase64 && isImageFile(note.fileName))
      .map((note) => note.fileBase64!);
    setNoteImages(images);
  }, [notes]);

  const isImageFile = (fileName: string | undefined): boolean => {
    if (!fileName) return false;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const downloadFile = (note: NoteWithFile) => {
    if (note.fileBase64 && note.fileName) {
      // Если это data URL, извлекаем чистый base64
      let base64Data = note.fileBase64;
      if (base64Data.startsWith("data:")) {
        const base64Index = base64Data.indexOf("base64,");
        if (base64Index !== -1) {
          base64Data = base64Data.substring(base64Index + 7);
        }
      }

      const link = document.createElement("a");
      link.href = `data:application/octet-stream;base64,${base64Data}`;
      link.download = note.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleForceLoadFile = (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    loadNoteFile(noteId);
  };

  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("8")) {
      return "7" + digits.slice(1);
    }
    return digits;
  };

  const sendMessage = async (
    scheduleId: number,
    phone: string,
    amount: string,
    date: string
  ) => {
    try {
      if (sendWhatsAppMessage) {
        await loadSchedules();
      } else {
        console.error("Не удалось отметить уведомление");
      }
    } catch (error) {
      console.error("Ошибка при отправке WhatsApp:", error);
    }
  };

  const notesColumns = [
    { name: "Сотрудник" },
    { name: "Дата" },
    { name: "Заметка", align: "left" as const },
    { name: "Напоминание", align: "left" as const },
    { name: "" },
  ];

  const handleDeleteNote = async (noteId: number) => {
    await deleteNote(noteId);
    getCreditNotes(Number(id));
  };

  const handlePhotoClick = (noteIndex: number) => {
    const note = notes[noteIndex];
    if (!note.fileBase64 || !isImageFile(note.fileName)) return;

    let imageIndex = 0;
    let currentCount = 0;

    for (let i = 0; i < notes.length; i++) {
      const currentNote = notes[i];
      if (currentNote.fileBase64 && isImageFile(currentNote.fileName)) {
        if (i === noteIndex) {
          imageIndex = currentCount;
          break;
        }
        currentCount++;
      }
    }

    setCurrentPhotoIndex(imageIndex);
    setIsPhotoViewerOpen(true);
  };

  const formatNotesData = () => {
    return notes.map((note, index) => [
      note.employeeName,
      formatDate(note.createdAt),
      <NoteContent key={`note-${note.id}`}>
        {note.content}
        {note.fileId && !note.fileBase64 && note.isLoading && (
          <FileContainer>
            <LoadingFile>
              <LoadingSpinner />
              <span>Загрузка файла...</span>
            </LoadingFile>
          </FileContainer>
        )}
        {note.fileId && !note.fileBase64 && !note.isLoading && (
          <FileContainer>
            <RetryFile onClick={(e) => handleForceLoadFile(note.id, e)}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 4V10H7"
                  stroke="#50555C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 20V14H17"
                  stroke="#50555C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1113 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87914 17.7146 4.01717 16.4332 3.51 15"
                  stroke="#50555C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Нажмите, чтобы загрузить файл</span>
            </RetryFile>
          </FileContainer>
        )}
        {note.fileBase64 && (
          <FileContainer>
            {isImageFile(note.fileName) ? (
              <NoteImage
                src={note.fileBase64}
                alt="Прикрепленное изображение"
                onClick={() => handlePhotoClick(index)}
                onError={() =>
                  console.error(`Failed to load image for note ${note.id}`)
                }
              />
            ) : (
              <FileIcon onClick={() => downloadFile(note)}>
                <svg
                  width="33"
                  height="33"
                  viewBox="0 0 33 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="33" height="33" rx="10" fill="#C0DBE0" />
                  <path
                    d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5"
                    stroke="#007D88"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {note.fileName && <FileName>{note.fileName}</FileName>}
              </FileIcon>
            )}
          </FileContainer>
        )}
      </NoteContent>,
      formatDate(note.remindDate),
      <DeleteIcon
        key={`delete-${note.id}`}
        onClick={() => handleDeleteNote(note.id)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 7H20"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M10 11V16"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M14 11V16"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M9 7V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </DeleteIcon>,
    ]);
  };

  const handleAddNoteClick = () => {
    setIsNoteModalOpen(true);
  };

  const handleCreateNote = async (noteData: {
    content: string;
    file?: File;
    remindDate?: Date;
  }) => {
    if (noteData.content.trim() && id) {
      await createNote({
        noteableType: NOTEABLE_TYPES.CREDIT,
        noteableId: Number(id),
        content: noteData.content,
        file: noteData.file,
        remindDate: noteData.remindDate,
      });
      setNewNoteContent("");
      setIsNoteModalOpen(false);
      getCreditNotes(Number(id));
    }
  };

  const handleCancelNote = () => {
    setNewNoteContent("");
    setIsNoteModalOpen(false);
  };

  // Подгружаем, у каких платежей есть заметки, чтобы показать индикатор в таблице.
  useEffect(() => {
    const items = paymentsData?.items;
    if (!items || items.length === 0) {
      setPaymentsWithNotes(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          items.map(async (p) => {
            try {
              const notes = await noteService.getNotes(
                NOTEABLE_TYPES.PAYMENT,
                p.id,
                false
              );
              return notes && notes.length > 0 ? p.id : null;
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          setPaymentsWithNotes(
            new Set(results.filter((x): x is number => x !== null))
          );
        }
      } catch {
        // молча игнорируем — индикаторы просто не отобразятся
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentsData?.items]);

  // Подгружаем, у каких строк графика есть заметки.
  useEffect(() => {
    const items = scheduleData?.items;
    if (!items || items.length === 0) {
      setSchedulesWithNotes(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          items.map(async (s) => {
            try {
              const notes = await noteService.getNotes(
                NOTEABLE_TYPES.PAYMENT,
                s.id,
                false
              );
              return notes && notes.length > 0 ? s.id : null;
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          setSchedulesWithNotes(
            new Set(results.filter((x): x is number => x !== null))
          );
        }
      } catch {
        // молча игнорируем
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleData?.items]);

  const openNoteModal = async (target: {
    id: number;
    label: string;
    kind: "payment" | "schedule";
  }) => {
    setSelectedNoteTarget(target);
    setSelectedPaymentNotes([]);
    setPaymentNoteDraft("");
    setIsPaymentNoteModalOpen(true);
    setIsLoadingPaymentNotes(true);
    try {
      const notes = await noteService.getNotes(
        NOTEABLE_TYPES.PAYMENT,
        target.id,
        false
      );
      setSelectedPaymentNotes(notes || []);
    } catch {
      setSelectedPaymentNotes([]);
    } finally {
      setIsLoadingPaymentNotes(false);
    }
  };

  const closePaymentNoteModal = () => {
    setIsPaymentNoteModalOpen(false);
    setSelectedNoteTarget(null);
    setSelectedPaymentNotes([]);
    setPaymentNoteDraft("");
  };

  const handleSavePaymentNote = async () => {
    if (!selectedNoteTarget || !paymentNoteDraft.trim()) return;
    setIsSavingPaymentNote(true);
    try {
      await noteService.createNote({
        noteableType: NOTEABLE_TYPES.PAYMENT,
        noteableId: selectedNoteTarget.id,
        content: paymentNoteDraft.trim(),
      });
      const notes = await noteService.getNotes(
        NOTEABLE_TYPES.PAYMENT,
        selectedNoteTarget.id,
        false
      );
      setSelectedPaymentNotes(notes || []);
      if (selectedNoteTarget.kind === "schedule") {
        setSchedulesWithNotes((prev) =>
          new Set(prev).add(selectedNoteTarget.id)
        );
      } else {
        setPaymentsWithNotes((prev) =>
          new Set(prev).add(selectedNoteTarget.id)
        );
      }
      setPaymentNoteDraft("");
    } catch (e) {
      console.error("Ошибка при сохранении заметки:", e);
    } finally {
      setIsSavingPaymentNote(false);
    }
  };

  const handleClosePhotoViewer = () => {
    setIsPhotoViewerOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const formatPaymentsData = (payments: Payment[] | undefined) => {
    if (!payments) return [];

    return payments.map((payment) => {
      const hasNote = paymentsWithNotes.has(payment.id);
      return [
        payment.paymentDate ? formatDate(payment.paymentDate) : "",
        formatMoney(payment.paymentAmount?.toString() || "0"),
        payment.type === "cash"
          ? "Наличными"
          : `Картой ${payment.bankCardDetails ?? ""}`,
        payment.employeeFullName || "",
        payment.accepted ? "Да" : "Нет",
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openNoteModal({
                id: payment.id,
                label: payment.paymentDate
                  ? formatDate(payment.paymentDate)
                  : "",
                kind: "payment",
              });
            }}
            title={hasNote ? "Открыть заметку" : "Добавить заметку"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
            }}
          >
            <StickyNote2OutlinedIcon
              style={{
                fontSize: 18,
                color: hasNote ? "#007D88" : "#cbd5e0",
              }}
            />
          </button>
        </div>,
      ];
    });
  };

  const formatSchedulesData = (schedules: ScheduleDetails[] | undefined) => {
    if (!schedules) return [];

    return schedules.map((schedule) => [
      schedule.id.toString(),
      formatDate(schedule.paymentDate || ""),
      formatMoney(schedule.paymentAmount.toString() || ""),
      schedule.comment?.toString(),
      // Объединенная колонка: статус + иконка уведомления
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {isSchedulePaid(schedule) ? (
          <>
            <span style={{ color: "#1B5E20", fontWeight: "500" }}>
              Оплачено
            </span>
          </>
        ) : (
          <>
            <span style={{ color: "#666" }}>
              {schedule.notified ? "Уведомлён" : "Не уведомлён"}
            </span>
            {!schedule.notified ? (
              <button
                onClick={() =>
                  sendWhatsAppMessage(
                    schedule.id,
                    schedule.clientPhone,
                    formatMoney(schedule.paymentAmount.toString()),
                    formatDate(schedule.paymentDate)
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                }}
              >
                <WhatsAppIcon style={{ color: "#25D366" }} />
              </button>
            ) : (
              <button
                onClick={() =>
                  sendWhatsAppMessage(
                    schedule.id,
                    schedule.clientPhone,
                    formatMoney(schedule.paymentAmount.toString()),
                    formatDate(schedule.paymentDate)
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                }}
              >
                <CheckIcon style={{ color: "#1B5E20", fontSize: "18px" }} />
              </button>
            )}
          </>
        )}
      </div>,
      // Колонка-индикатор заметки
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openNoteModal({
              id: schedule.id,
              label: formatDate(schedule.paymentDate || ""),
              kind: "schedule",
            });
          }}
          title={
            schedulesWithNotes.has(schedule.id)
              ? "Открыть заметку"
              : "Добавить заметку"
          }
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
          }}
        >
          <StickyNote2OutlinedIcon
            style={{
              fontSize: 18,
              color: schedulesWithNotes.has(schedule.id)
                ? "#007D88"
                : "#cbd5e0",
            }}
          />
        </button>
      </div>,
    ]);
  };

  const getScheduleRowStyle = (schedule: ScheduleDetails, index: number) => {
    const today = new Date();
    const paymentDate = schedule.paymentDate
      ? new Date(schedule.paymentDate)
      : null;

    if (schedule.paymentAmount === 0 || isSchedulePaid(schedule)) {
      return {
        backgroundColor: "#E8F5E8",
        color: "#1B5E20",
        fontWeight: "normal" as const,
      };
    }

    if (
      (schedule.status === "Overdue" || (paymentDate && paymentDate < today)) &&
      schedule.paymentAmount > 0
    ) {
      return {
        backgroundColor: "#FFEBEE",
        color: "#B71C1C",
        fontWeight: "normal" as const,
      };
    }

    return {
      backgroundColor: "#FFFFFF",
      color: "#000000",
      fontWeight: "normal" as const,
    };
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const chat = await createPrivateChat(creditData?.clientId || 0, "client");

      if (chat?.id) {
        window.open(`/chat/${chat.id}`, "_blank");
      }
    } catch (error) {
      console.error("Ошибка при создании чата:", error);
    }
  };

  const formatSoldProductsData = (soldProducts: SoldProduct[] | undefined) => {
    if (!soldProducts) return [];

    return soldProducts.map((soldProduct) => {
      let surchargeValue = 0;
      let surchargeDisplay = "";

      if (soldProduct.surcharge) {
        surchargeValue = (soldProduct.price * soldProduct.surcharge) / 100;
        surchargeDisplay = `${soldProduct.surcharge}%`;
      } else if (soldProduct.surchargeAmount) {
        surchargeValue = soldProduct.surchargeAmount;
        surchargeDisplay = formatMoney(soldProduct.surchargeAmount.toString());
      }

      const finalPrice = soldProduct.price + surchargeValue;

      return [
        soldProduct.name || "",
        formatMoney(soldProduct.price.toString() || ""),
        surchargeDisplay,
        formatMoney(finalPrice.toString()),
      ];
    });
  };

  const clientWhatsAppPhone =
    creditData?.secondPhone ||
    creditData?.clientSecondPhone ||
    creditData?.clientPhone ||
    "";

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalWrapper>
            <TwoColumnLayout>
              <LeftColumn>
                <HeaderRow>
                  <HeaderTitle>
                    <CustomTitle style={{ marginTop: 0, marginBottom: 0 }}>
                      Договор №{id}
                    </CustomTitle>
                    <HeaderActions>
                      {creditData &&
                        (() => {
                          const status = getCreditStatus(
                            creditData,
                            displayedOverdueDays
                          );
                          return (
                            <StatusBadge $status={status.key}>
                              {status.label}
                            </StatusBadge>
                          );
                        })()}
                      {creditData?.terminated && (
                        <StatusBadge
                          $status="closed"
                          style={{
                            background: "#F3E8FF",
                            borderColor: "#D8B4FE",
                            color: "#6B21A8",
                          }}
                        >
                          Расторгнут
                        </StatusBadge>
                      )}
                      {creditData && (
                        <TerminateButton
                          type="button"
                          $variant={
                            creditData.terminated ? "restore" : "terminate"
                          }
                          onClick={async () => {
                            const confirmMsg = creditData.terminated
                              ? "Договор будет возвращён в актуальные. Сумма снова спишется с кассы пула или инвестора. Продолжить?"
                              : "Договор будет переведён в «Расторгнутые». Сумма, использованная при выдаче, автоматически вернётся в кассу пула или инвестора. Продолжить?";
                            if (!window.confirm(confirmMsg)) return;
                            const ok = await toggleTerminated(creditData.id);
                            if (ok) {
                              setCreditData((prev) =>
                                prev
                                  ? { ...prev, terminated: !prev.terminated }
                                  : prev
                              );
                            }
                          }}
                        >
                          {creditData.terminated
                            ? "Восстановить"
                            : "Расторгнуть"}
                        </TerminateButton>
                      )}
                    </HeaderActions>
                  </HeaderTitle>
                  {creditData?.name && (
                    <HeaderSubtitle>{creditData.name}</HeaderSubtitle>
                  )}
                </HeaderRow>

                {creditData && (
                  <SummaryHeader>
                    <SummaryCard>
                      <SummaryIcon>
                        <CalendarMonthOutlinedIcon fontSize="small" />
                      </SummaryIcon>
                      <SummaryItemBody>
                        <SummaryLabel>Дата</SummaryLabel>
                        <SummaryValue>
                          {formatDate(creditData.creditDate)}
                        </SummaryValue>
                      </SummaryItemBody>
                    </SummaryCard>

                    {creditData.creditTypeName && (
                      <SummaryCard>
                        <SummaryIcon>
                          <LabelOutlinedIcon fontSize="small" />
                        </SummaryIcon>
                        <SummaryItemBody>
                          <SummaryLabel>Категория</SummaryLabel>
                          <SummaryValue>
                            {creditData.creditTypeName}
                          </SummaryValue>
                        </SummaryItemBody>
                      </SummaryCard>
                    )}

                    {creditData.termMonths != null && (
                      <SummaryCard>
                        <SummaryIcon>
                          <AccessTimeOutlinedIcon fontSize="small" />
                        </SummaryIcon>
                        <SummaryItemBody>
                          <SummaryLabel>Срок</SummaryLabel>
                          <SummaryValue>
                            {creditData.termMonths} мес.
                          </SummaryValue>
                        </SummaryItemBody>
                      </SummaryCard>
                    )}

                    {creditData.totalAmount != null && (
                      <SummaryCard>
                        <SummaryIcon>
                          <AttachMoneyOutlinedIcon fontSize="small" />
                        </SummaryIcon>
                        <SummaryItemBody>
                          <SummaryLabel>Сумма</SummaryLabel>
                          <SummaryValue>
                            {formatMoney(creditData.totalAmount.toString())}
                          </SummaryValue>
                        </SummaryItemBody>
                      </SummaryCard>
                    )}

                    {creditData.rest != null && (
                      <SummaryCard>
                        <SummaryIcon $accent="info">
                          <AttachMoneyOutlinedIcon fontSize="small" />
                        </SummaryIcon>
                        <SummaryItemBody>
                          <SummaryLabel>Остаток</SummaryLabel>
                          <SummaryValue>
                            {formatMoney(creditData.rest.toString())}
                          </SummaryValue>
                        </SummaryItemBody>
                      </SummaryCard>
                    )}

                    {(displayedOverdueDays > 0 ||
                      displayedOverdueAmount > 0) && (
                      <SummaryCard $variant="danger">
                        <SummaryIcon $accent="danger">
                          <WarningAmberOutlinedIcon fontSize="small" />
                        </SummaryIcon>
                        <SummaryItemBody>
                          <SummaryLabel>Просрочка</SummaryLabel>
                          <SummaryValue style={{ color: "#B71C1C" }}>
                            {displayedOverdueDays} дн.
                            {displayedOverdueAmount > 0 &&
                              ` · ${formatMoney(
                                displayedOverdueAmount.toString()
                              )}`}
                          </SummaryValue>
                        </SummaryItemBody>
                      </SummaryCard>
                    )}

                    {creditData.debtComment && (
                      <SummaryCard>
                        <SummaryIcon>
                          <DescriptionOutlinedIcon fontSize="small" />
                        </SummaryIcon>
                        <SummaryItemBody>
                          <SummaryLabel>В долг выдал</SummaryLabel>
                          <SummaryValue>{creditData.debtComment}</SummaryValue>
                        </SummaryItemBody>
                      </SummaryCard>
                    )}
                  </SummaryHeader>
                )}

                <Tabs<CreditTab>
                  activeTab={activeTab}
                  onChange={handleTabChange}
                  tabs={[
                    {
                      id: "client",
                      label: (
                        <TabLabel
                          icon={<PersonOutlineIcon fontSize="small" />}
                          label="Клиент"
                        />
                      ),
                      content: (
                        <TabPanel>
                          <PersonCard>
                            <Avatar />
                            <PersonInfo>
                              <PersonName
                                $clickable={!!creditData?.clientFullName}
                                onClick={() =>
                                  handleCopyName(
                                    creditData?.clientFullName,
                                    "client"
                                  )
                                }
                                title={
                                  creditData?.clientFullName
                                    ? "Нажмите, чтобы скопировать ФИО"
                                    : undefined
                                }
                                role={
                                  creditData?.clientFullName
                                    ? "button"
                                    : undefined
                                }
                              >
                                {creditData?.clientFullName || "—"}
                                {copiedName === "client" && (
                                  <CopiedHint>Скопировано</CopiedHint>
                                )}
                              </PersonName>
                              <InfoRows>
                                <InfoRow>
                                  <InfoIcon>
                                    <CallOutlinedIcon fontSize="small" />
                                  </InfoIcon>
                                  <InfoText>
                                    {creditData?.clientPhone ? (
                                      <PhoneLink
                                        href={formatPhoneHref(
                                          creditData.clientPhone
                                        )}
                                      >
                                        {creditData.clientPhone}
                                      </PhoneLink>
                                    ) : (
                                      "—"
                                    )}
                                  </InfoText>
                                </InfoRow>
                                {creditData?.address && (
                                  <InfoRow>
                                    <InfoIcon>
                                      <HomeOutlinedIcon fontSize="small" />
                                    </InfoIcon>
                                    <InfoText>{creditData.address}</InfoText>
                                  </InfoRow>
                                )}
                                {creditData?.clientBirthdate && (
                                  <InfoRow>
                                    <InfoIcon>
                                      <CakeOutlinedIcon fontSize="small" />
                                    </InfoIcon>
                                    <InfoText>
                                      {new Date(
                                        `${creditData.clientBirthdate}`
                                      ).toLocaleDateString("ru-RU")}
                                    </InfoText>
                                  </InfoRow>
                                )}
                                {renderPersonExtraRows(
                                  clientDetails,
                                  clientAddressShown
                                )}
                              </InfoRows>
                            </PersonInfo>
                          </PersonCard>

                          {creditData?.clientId ? (
                            <>
                              <SectionHeader style={{ marginTop: "24px" }}>
                                <SectionIcon>
                                  <ContactsOutlinedIcon fontSize="small" />
                                </SectionIcon>
                                <SectionTitle>Контакты</SectionTitle>
                              </SectionHeader>
                              <ContactsEditor
                                clientId={creditData.clientId}
                                contacts={creditData.clientContacts || []}
                              />
                            </>
                          ) : null}

                          <SectionHeader style={{ marginTop: "24px" }}>
                            <SectionIcon>
                              <DescriptionOutlinedIcon fontSize="small" />
                            </SectionIcon>
                            <SectionTitle>Договоры клиента</SectionTitle>
                          </SectionHeader>
                          {isLoadingRelated ? (
                            <LoadingText>Загрузка...</LoadingText>
                          ) : clientCredits && clientCredits.length > 0 ? (
                            <RelatedCreditsList>
                              {clientCredits.map((c) => (
                                <RelatedCreditCard
                                  key={`c-${c.id}`}
                                  $status={c.status}
                                  $clickable={!!onOpenCredit}
                                  onClick={() => onOpenCredit?.(c.id)}
                                >
                                  <RelatedCardLeft>
                                    <RelatedCardIcon>
                                      <DescriptionOutlinedIcon fontSize="small" />
                                    </RelatedCardIcon>
                                    <div>
                                      <RelatedCreditTitle>
                                        Договор №{c.id}
                                      </RelatedCreditTitle>
                                      <RelatedCreditDate>
                                        <CalendarMonthOutlinedIcon
                                          style={{ fontSize: 14 }}
                                        />
                                        {formatDate(c.creditDate)}
                                      </RelatedCreditDate>
                                    </div>
                                  </RelatedCardLeft>
                                  <RelatedCreditStatus $status={c.status}>
                                    {c.status}
                                  </RelatedCreditStatus>
                                </RelatedCreditCard>
                              ))}
                            </RelatedCreditsList>
                          ) : (
                            <EmptyState>
                              <SearchOffOutlinedIcon
                                style={{ fontSize: 40, color: "#cbd5e0" }}
                              />
                              <EmptyStateText>
                                Других договоров у клиента нет
                              </EmptyStateText>
                            </EmptyState>
                          )}
                        </TabPanel>
                      ),
                    },
                    {
                      id: "payments",
                      label: (
                        <TabLabel
                          icon={<PaymentsOutlinedIcon fontSize="small" />}
                          label="Платежи"
                        />
                      ),
                      content: (
                        <TabPanel>
                          {creditData && creditData.firstPayment !== 0 && (
                            <Value style={{ margin: "0 0 15px" }}>
                              {`Первоначальный взнос, руб:${" ".repeat(
                                10
                              )}${formatMoney(
                                creditData.firstPayment.toString()
                              )}`}
                            </Value>
                          )}

                          {paymentsData?.items &&
                          paymentsData.items.length > 0 ? (
                            <>
                              <ModalInfoTitle>Платежи</ModalInfoTitle>
                              <CustomTable
                                columns={[
                                  { name: "Дата", align: "left" },
                                  { name: "Сумма", align: "right" },
                                  { name: "Тип платежа" },
                                  { name: "Платёж принял" },
                                  { name: "Подтверждён" },
                                  { name: "Заметка", align: "center" },
                                ]}
                                data={formatPaymentsData(paymentsData?.items)}
                              />
                            </>
                          ) : (
                            <EmptyState>
                              <PaymentsOutlinedIcon
                                style={{ fontSize: 40, color: "#cbd5e0" }}
                              />
                              <EmptyStateText>
                                Фактических платежей пока нет
                              </EmptyStateText>
                            </EmptyState>
                          )}

                          <ModalInfoTitle
                            style={{ marginTop: "32px", marginBottom: "12px" }}
                          >
                            График платежей
                          </ModalInfoTitle>
                          <CustomTable
                            columns={[
                              { name: "ID", isHidden: true },
                              { name: "Дата", align: "left" },
                              { name: "Сумма", align: "right" },
                              { name: "Примечание" },
                              { name: "Статус", align: "center" },
                              { name: "Заметка", align: "center" },
                            ]}
                            data={formatSchedulesData(scheduleData?.items)}
                            rowStyles={
                              scheduleData?.items?.reduce(
                                (acc, schedule, index) => {
                                  acc[index] = getScheduleRowStyle(
                                    schedule,
                                    index
                                  );
                                  return acc;
                                },
                                {} as { [key: number]: any }
                              ) || {}
                            }
                            contextMenuActions={scheduleTableActions}
                            onRowDoubleClick={handleOpenPaymentFromSchedule}
                            multiSelect
                            selectedRow={selectedScheduleRows}
                            onMultiSelectChange={setSelectedScheduleRows}
                          />
                        </TabPanel>
                      ),
                    },
                    {
                      id: "products",
                      label: (
                        <TabLabel
                          icon={<Inventory2OutlinedIcon fontSize="small" />}
                          label="Товар"
                        />
                      ),
                      content: (
                        <TabPanel>
                          {soldProductsData && soldProductsData.length > 0 ? (
                            <CustomTable
                              columns={[
                                { name: "Название" },
                                { name: "Стоимость", align: "right" },
                                { name: "Надбавка", align: "right" },
                                { name: "Цена", align: "right" },
                              ]}
                              data={formatSoldProductsData(soldProductsData)}
                            />
                          ) : (
                            <EmptyState>
                              <Inventory2OutlinedIcon
                                style={{ fontSize: 40, color: "#cbd5e0" }}
                              />
                              <EmptyStateText>Товаров нет</EmptyStateText>
                            </EmptyState>
                          )}
                        </TabPanel>
                      ),
                    },
                    {
                      id: "guarantor",
                      label: (
                        <TabLabel
                          icon={<ShieldOutlinedIcon fontSize="small" />}
                          label="Поручитель"
                        />
                      ),
                      content: (
                        <TabPanel>
                          {creditData?.guarantorFullname ? (
                            <>
                              <PersonCard>
                                <Avatar $variant="guarantor" />
                                <PersonInfo>
                                  <PersonName
                                    $clickable={!!creditData.guarantorFullname}
                                    onClick={() =>
                                      handleCopyName(
                                        creditData.guarantorFullname,
                                        "guarantor"
                                      )
                                    }
                                    title="Нажмите, чтобы скопировать ФИО"
                                    role="button"
                                  >
                                    {creditData.guarantorFullname}
                                    {copiedName === "guarantor" && (
                                      <CopiedHint>Скопировано</CopiedHint>
                                    )}
                                  </PersonName>
                                  <InfoRows>
                                    {creditData.guarantorPhone && (
                                      <InfoRow>
                                        <InfoIcon>
                                          <CallOutlinedIcon fontSize="small" />
                                        </InfoIcon>
                                        <InfoText>
                                          <PhoneLink
                                            href={formatPhoneHref(
                                              creditData.guarantorPhone
                                            )}
                                          >
                                            {creditData.guarantorPhone}
                                          </PhoneLink>
                                        </InfoText>
                                      </InfoRow>
                                    )}
                                    {creditData.guarantorBirthdate && (
                                      <InfoRow>
                                        <InfoIcon>
                                          <CakeOutlinedIcon fontSize="small" />
                                        </InfoIcon>
                                        <InfoText>
                                          {new Date(
                                            `${creditData.guarantorBirthdate}`
                                          ).toLocaleDateString("ru-RU")}
                                        </InfoText>
                                      </InfoRow>
                                    )}
                                    {creditData.guarantorAddress && (
                                      <InfoRow>
                                        <InfoIcon>
                                          <HomeOutlinedIcon fontSize="small" />
                                        </InfoIcon>
                                        <InfoText>
                                          {creditData.guarantorAddress}
                                        </InfoText>
                                      </InfoRow>
                                    )}
                                    {renderPersonExtraRows(
                                      guarantorDetails,
                                      creditData.guarantorAddress
                                    )}
                                  </InfoRows>
                                </PersonInfo>
                              </PersonCard>

                              <SectionHeader style={{ marginTop: "24px" }}>
                                <SectionIcon>
                                  <DescriptionOutlinedIcon fontSize="small" />
                                </SectionIcon>
                                <SectionTitle>Договоры поручителя</SectionTitle>
                              </SectionHeader>
                              {!getGuarantorClientId(creditData) ? (
                                <EmptyState>
                                  <SearchOffOutlinedIcon
                                    style={{ fontSize: 40, color: "#cbd5e0" }}
                                  />
                                  <EmptyStateText>
                                    Поручитель не является клиентом — связанных
                                    договоров нет
                                  </EmptyStateText>
                                </EmptyState>
                              ) : isLoadingRelated ? (
                                <LoadingText>Загрузка...</LoadingText>
                              ) : guarantorCredits &&
                                guarantorCredits.length > 0 ? (
                                <RelatedCreditsList>
                                  {guarantorCredits.map((c) => (
                                    <RelatedCreditCard
                                      key={`g-${c.id}`}
                                      $status={c.status}
                                    >
                                      <RelatedCardLeft>
                                        <RelatedCardIcon>
                                          <DescriptionOutlinedIcon fontSize="small" />
                                        </RelatedCardIcon>
                                        <div>
                                          <RelatedCreditTitle>
                                            Договор №{c.id}
                                          </RelatedCreditTitle>
                                          <RelatedCreditDate>
                                            <CalendarMonthOutlinedIcon
                                              style={{ fontSize: 14 }}
                                            />
                                            {formatDate(c.creditDate)}
                                          </RelatedCreditDate>
                                        </div>
                                      </RelatedCardLeft>
                                      <RelatedCreditStatus $status={c.status}>
                                        {c.status}
                                      </RelatedCreditStatus>
                                    </RelatedCreditCard>
                                  ))}
                                </RelatedCreditsList>
                              ) : (
                                <EmptyState>
                                  <SearchOffOutlinedIcon
                                    style={{ fontSize: 40, color: "#cbd5e0" }}
                                  />
                                  <EmptyStateText>
                                    Других договоров у поручителя нет
                                  </EmptyStateText>
                                </EmptyState>
                              )}
                            </>
                          ) : (
                            <EmptyState>
                              <SearchOffOutlinedIcon
                                style={{ fontSize: 48, color: "#cbd5e0" }}
                              />
                              <EmptyStateText>
                                Поручитель не указан
                              </EmptyStateText>
                            </EmptyState>
                          )}
                        </TabPanel>
                      ),
                    },
                    {
                      id: "notes",
                      label: (
                        <TabLabel
                          icon={<StickyNote2OutlinedIcon fontSize="small" />}
                          label="Заметки"
                        />
                      ),
                      content: (
                        <TabPanel>
                          <HorizontalContainer
                            style={{
                              alignItems: "center",
                              marginBottom: "15px",
                            }}
                          >
                            <ModalInfoTitle>Заметки</ModalInfoTitle>
                            <AddButton
                              src={AddButtonImage}
                              alt="Add Button"
                              onClick={handleAddNoteClick}
                            />
                          </HorizontalContainer>
                          <TableContainer style={{ width: "100%" }}>
                            {isNotesLoading ? (
                              <LoadingText>Загрузка заметок...</LoadingText>
                            ) : notesError ? (
                              <ErrorText>{notesError}</ErrorText>
                            ) : notes.length === 0 ? (
                              <EmptyState>
                                <StickyNote2OutlinedIcon
                                  style={{ fontSize: 40, color: "#cbd5e0" }}
                                />
                                <EmptyStateText>Заметок нет</EmptyStateText>
                              </EmptyState>
                            ) : (
                              <Table
                                columns={notesColumns}
                                data={formatNotesData()}
                              />
                            )}
                          </TableContainer>
                        </TabPanel>
                      ),
                    },
                  ]}
                />
              </LeftColumn>

              <RightColumn>
                {creditData && (
                  <WhatsAppChat
                    phoneNumber={clientWhatsAppPhone}
                    clientName={creditData?.clientFullName}
                  />
                )}
              </RightColumn>
            </TwoColumnLayout>
          </ModalWrapper>
        </ModalContent>
      </ModalOverlay>

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedScheduleForPayment(null);
        }}
        onSubmit={handleSavePayment}
        creditId={creditData?.id || 0}
        clientName={creditData?.clientFullName || ""}
        investorName={creditData?.investorNickname || ""}
        clientPhone={creditData?.clientPhone || ""}
        currentDebt={creditData?.rest || 0}
        currentMonthDebt={
          selectedScheduleForPayment?.paymentAmount ||
          creditData?.currentMonthDebt ||
          0
        }
        onPrintReceipt={handlePrintReceipt}
        clientId={creditData?.clientId}
      />

      <EditScheduleDateModal
        isOpen={editDateModal.isOpen}
        ids={editDateModal.ids}
        initialDate={editDateModal.initialDate}
        onClose={() => setEditDateModal({ isOpen: false, ids: [] })}
        onConfirm={handleConfirmEditDate}
      />

      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={handleCancelNote}
        onCreate={handleCreateNote}
        noteContent={newNoteContent}
        onNoteContentChange={setNewNoteContent}
      />

      <PaymentNoteOverlay
        isOpen={isPaymentNoteModalOpen}
        onClick={closePaymentNoteModal}
      >
        <PaymentNoteCard onClick={(e) => e.stopPropagation()}>
          <PaymentNoteHeader>
            <span>
              Заметка по платежу
              {selectedNoteTarget?.label
                ? ` от ${selectedNoteTarget.label}`
                : ""}
            </span>
            <PaymentNoteClose onClick={closePaymentNoteModal}>
              ×
            </PaymentNoteClose>
          </PaymentNoteHeader>

          <PaymentNoteBody>
            {isLoadingPaymentNotes ? (
              <PaymentNoteEmpty>Загрузка…</PaymentNoteEmpty>
            ) : selectedPaymentNotes.length === 0 ? (
              <PaymentNoteEmpty>Заметок по платежу пока нет</PaymentNoteEmpty>
            ) : (
              selectedPaymentNotes.map((note) => (
                <PaymentNoteItem key={note.id}>{note.content}</PaymentNoteItem>
              ))
            )}
          </PaymentNoteBody>

          <PaymentNoteTextarea
            placeholder="Добавить заметку к платежу…"
            value={paymentNoteDraft}
            onChange={(e) => setPaymentNoteDraft(e.target.value)}
          />
          <PaymentNoteActions>
            <PaymentNoteCancel onClick={closePaymentNoteModal}>
              Закрыть
            </PaymentNoteCancel>
            <PaymentNoteSave
              onClick={handleSavePaymentNote}
              disabled={!paymentNoteDraft.trim() || isSavingPaymentNote}
            >
              {isSavingPaymentNote ? "Сохранение…" : "Сохранить"}
            </PaymentNoteSave>
          </PaymentNoteActions>
        </PaymentNoteCard>
      </PaymentNoteOverlay>

      {contextMenu.visible && (
        <ContextMenu
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1001,
          }}
        >
          <ContextMenuItem
            onClick={() => handleContextMenuAction(contextMenu.rowIndex)}
            style={{ color: "#008b8b" }}
          >
            Добавить платёж
          </ContextMenuItem>
        </ContextMenu>
      )}

      {isPhotoViewerOpen && noteImages.length > 0 && (
        <PhotoViewerModal
          images={noteImages}
          initialIndex={currentPhotoIndex}
          onClose={handleClosePhotoViewer}
        />
      )}
    </>
  );
};

const TwoColumnLayout = styled.div`
  display: flex;
  gap: 24px;
  height: 100%;
  min-width: 0;

  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
  }
`;

const LeftColumn = styled.div`
  flex: 1.5;
  min-width: 0;
  overflow-y: auto;
  padding-right: 12px;

  @media (max-width: 768px) {
    padding-right: 0;
    overflow-y: visible;
  }

  /* Стилизация скроллбара для левой колонки */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
`;

const RightColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Фиксируем высоту чата */
  & > div {
    height: 100%;
    width: 100%;
    max-width: 100%;
  }

  @media (max-width: 768px) {
    min-height: 300px;
    overflow: visible;
    & > div {
      height: 300px;
    }
  }
`;

const ContextMenu = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 150px;
`;

const ContextMenuItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: black;
`;

const ModalWrapper = styled.div`
  margin: 10px;
`;

const PaymentNoteOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1100;
  color: black;
`;

const PaymentNoteCard = styled.div`
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
  width: 460px;
  max-width: 92vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const PaymentNoteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
`;

const PaymentNoteClose = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;

  &:hover {
    color: #111827;
  }
`;

const PaymentNoteBody = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  min-height: 40px;
`;

const PaymentNoteItem = styled.div`
  background: #f3f4f6;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
`;

const PaymentNoteEmpty = styled.div`
  color: #9ca3af;
  font-size: 14px;
  padding: 8px 0;
`;

const PaymentNoteTextarea = styled.textarea`
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 72px;
  resize: vertical;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #007d88;
  }
`;

const PaymentNoteActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

const PaymentNoteCancel = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const PaymentNoteSave = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #007d88;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #005f66;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const HorizontalContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90vw;
  height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    width: calc(100vw - 16px);
    height: 95vh;
    padding: 12px;
    border-radius: 8px;
  }
`;

const AddButton = styled.img`
  cursor: pointer;
  margin-left: auto;

  &:hover {
    opacity: 0.8;
  }
`;

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-y: auto;
  width: 100%;
  /* Убираем max-height или делаем его адаптивным */
  height: auto;
  min-height: 200px;
  max-height: 400px; /* или убрать вообще */
`;

const LoadingText = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
`;

const ErrorText = styled.div`
  padding: 20px;
  text-align: center;
  color: #ff0000;
`;

const DeleteIcon = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    opacity: 0.7;
  }
`;

const Table = styled(CustomTable)`
  height: 100%;
`;

const Label = styled.h6`
  color: rgba(80, 85, 92, 1);
  font-weight: 400;
  font-size: 16px;
  margin: 10px 0 2px;
  text-align: left;
`;

const Value = styled.h6`
  color: black;
  font-weight: 500;
  font-size: 16px;
  margin: 0 0;
  text-align: left;
`;

const NoteContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
`;

const FileContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NoteImage = styled.img`
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #e2e8f0;

  &:hover {
    opacity: 0.8;
  }
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f8f9fa;
  border: 1px solid #e2e8f0;

  &:hover {
    background-color: #e9ecef;
  }
`;

const LoadingFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #f8f9fa;
  border: 1px solid #e2e8f0;
  color: #666;
  font-size: 14px;
`;

const RetryFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  color: #2e7d32;
  font-size: 14px;

  &:hover {
    background-color: #c8e6c9;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007d88;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const FileName = styled.span`
  font-size: 14px;
  color: #007d88;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-wrap: wrap;
`;

const HeaderSubtitle = styled.div`
  font-size: 14px;
  color: rgba(80, 85, 92, 1);
`;

const TerminateButton = styled.button<{ $variant: "terminate" | "restore" }>`
  background: ${(p) => (p.$variant === "restore" ? "#007D88" : "#fff")};
  color: ${(p) => (p.$variant === "restore" ? "#fff" : "#B91C1C")};
  border: 1px solid ${(p) => (p.$variant === "restore" ? "#007D88" : "#FCA5A5")};
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$variant === "restore" ? "#006670" : "#FEF2F2")};
    border-color: ${(p) => (p.$variant === "restore" ? "#006670" : "#F87171")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const statusPalette: Record<
  CreditStatusKey,
  { bg: string; border: string; color: string }
> = {
  active: { bg: "#E0F2F1", border: "#80CBC4", color: "#00695C" },
  overdue: { bg: "#FFEBEE", border: "#EF9A9A", color: "#B71C1C" },
  closed: { bg: "#ECEFF1", border: "#CFD8DC", color: "#455A64" },
};

const StatusBadge = styled.span<{ $status: CreditStatusKey }>`
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ $status }) => statusPalette[$status].bg};
  color: ${({ $status }) => statusPalette[$status].color};
  border: 1px solid ${({ $status }) => statusPalette[$status].border};
  white-space: nowrap;
  letter-spacing: 0.2px;
`;

const SummaryHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  padding: 0;
  margin-bottom: 20px;
`;

type SummaryVariant = "default" | "danger";
type SummaryAccent = "default" | "info" | "danger";

const summaryCardPalette: Record<
  SummaryVariant,
  { bg: string; border: string }
> = {
  default: { bg: "#FFFFFF", border: "#E2E8F0" },
  danger: { bg: "#FFF5F5", border: "#FECACA" },
};

const summaryIconPalette: Record<SummaryAccent, { bg: string; color: string }> =
  {
    default: { bg: "rgba(0, 125, 136, 0.1)", color: "#007D88" },
    info: { bg: "rgba(59, 130, 246, 0.1)", color: "#2563EB" },
    danger: { bg: "rgba(239, 68, 68, 0.1)", color: "#B71C1C" },
  };

const SummaryCard = styled.div<{ $variant?: SummaryVariant }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: ${({ $variant = "default" }) =>
    summaryCardPalette[$variant].bg};
  border: 1px solid
    ${({ $variant = "default" }) => summaryCardPalette[$variant].border};
  border-radius: 10px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
`;

const SummaryIcon = styled.div<{ $accent?: SummaryAccent }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  background-color: ${({ $accent = "default" }) =>
    summaryIconPalette[$accent].bg};
  color: ${({ $accent = "default" }) => summaryIconPalette[$accent].color};
`;

const SummaryItemBody = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const SummaryLabel = styled.span`
  font-size: 11px;
  color: rgba(80, 85, 92, 1);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 2px;
`;

const SummaryValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
`;

const TabLabelWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const TabIcon = styled.span`
  display: inline-flex;
  align-items: center;
  color: currentColor;
`;

const PersonCard = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  align-items: flex-start;
`;

const Avatar = styled.div<{ $variant?: "client" | "guarantor" }>`
  width: 4px;
  align-self: stretch;
  flex-shrink: 0;
  border-radius: 2px;
  background-color: ${({ $variant = "client" }) =>
    $variant === "guarantor" ? "#F5A623" : "#007D88"};
`;

const PersonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

const PersonName = styled.div<{ $clickable?: boolean }>`
  font-size: 18px;
  font-weight: 600;
  color: #000;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  ${(p) =>
    p.$clickable &&
    `
    cursor: pointer;
    transition: color 0.15s;
    &:hover { color: #007D88; }
  `}
`;

const CopiedHint = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #0f766e;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
`;

const InfoRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #000;
`;

const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(80, 85, 92, 1);
  flex-shrink: 0;
`;

const InfoText = styled.span`
  color: #000;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 20px;
  color: rgba(107, 114, 128, 1);
`;

const EmptyStateText = styled.div`
  font-size: 14px;
  color: rgba(107, 114, 128, 1);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const SectionIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #007d88;
`;

const SectionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #000;
`;

const RelatedCreditsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
`;

const getRelatedStatusColors = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "закрытый")
    return { bg: "#ECEFF1", border: "#CFD8DC", color: "#455A64" };
  if (s === "просроченный")
    return { bg: "#FFEBEE", border: "#EF9A9A", color: "#B71C1C" };
  return { bg: "#E0F2F1", border: "#80CBC4", color: "#00695C" };
};

const RelatedCreditCard = styled.div<{ $status: string; $clickable?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
    border-color: ${({ $status }) => getRelatedStatusColors($status).border};
  }
`;

const RelatedCardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const RelatedCardIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: rgba(0, 125, 136, 0.1);
  color: #007d88;
  flex-shrink: 0;
`;

const RelatedCreditTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #000;
`;

const RelatedCreditDate = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(80, 85, 92, 1);
  margin-top: 2px;
`;

const RelatedCreditStatus = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background-color: ${({ $status }) => getRelatedStatusColors($status).bg};
  color: ${({ $status }) => getRelatedStatusColors($status).color};
  border: 1px solid ${({ $status }) => getRelatedStatusColors($status).border};
  white-space: nowrap;
  text-transform: capitalize;
`;

const CheckIcon = () => (
  <svg
    width="16"
    height="11"
    viewBox="0 0 16 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.3227 1.73849C15.5053 1.54252 15.6047 1.28333 15.6 1.01552C15.5952 0.747705 15.4867 0.492182 15.2973 0.30278C15.1079 0.113379 14.8524 0.00488629 14.5846 0.000161053C14.3168 -0.00456418 14.0576 0.0948468 13.8616 0.277449L5.63297 8.50612L2.22848 5.10163C2.03251 4.91903 1.77332 4.81961 1.50551 4.82434C1.23769 4.82907 0.982171 4.93756 0.792769 5.12696C0.603368 5.31636 0.494877 5.57188 0.490151 5.8397C0.485426 6.10751 0.584836 6.3667 0.767438 6.56266L4.90245 10.6977C5.09628 10.8913 5.35902 11 5.63297 11C5.90691 11 6.16966 10.8913 6.36349 10.6977L15.3227 1.73849Z"
      fill="#50555C"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.8437 3.11431C16.8886 2.14984 15.751 1.38511 14.4974 0.864691C13.2437 0.344271 11.899 0.078567 10.5416 0.083064C4.85413 0.083064 0.218709 4.71848 0.218709 10.406C0.218709 12.2289 0.697876 13.9997 1.59371 15.5622L0.135376 20.9164L5.60413 19.4789C7.11454 20.3018 8.81246 20.7393 10.5416 20.7393C16.2291 20.7393 20.8645 16.1039 20.8645 10.4164C20.8645 7.65598 19.7916 5.06223 17.8437 3.11431ZM10.5416 18.9893C8.99996 18.9893 7.48954 18.5726 6.16663 17.7914L5.85413 17.6039L2.60413 18.4581L3.46871 15.2914L3.26038 14.9685C2.40365 13.6008 1.94884 12.0198 1.94788 10.406C1.94788 5.67681 5.80204 1.82265 10.5312 1.82265C12.8229 1.82265 14.9791 2.71848 16.5937 4.34348C17.3933 5.13917 18.027 6.08571 18.4579 7.1282C18.8888 8.17068 19.1085 9.28836 19.1041 10.4164C19.125 15.1456 15.2708 18.9893 10.5416 18.9893ZM15.25 12.5726C14.9895 12.4476 13.7187 11.8226 13.4895 11.7289C13.25 11.6456 13.0833 11.6039 12.9062 11.8539C12.7291 12.1143 12.2395 12.6976 12.0937 12.8643C11.9479 13.0414 11.7916 13.0622 11.5312 12.9268C11.2708 12.8018 10.4375 12.5206 9.45829 11.6456C8.68746 10.9581 8.17704 10.1143 8.02079 9.8539C7.87496 9.59348 7.99996 9.45806 8.13538 9.32265C8.24996 9.20806 8.39579 9.02056 8.52079 8.87473C8.64579 8.7289 8.69788 8.61431 8.78121 8.44765C8.86454 8.27056 8.82288 8.12473 8.76038 7.99973C8.69788 7.87473 8.17704 6.6039 7.96871 6.08306C7.76038 5.58306 7.54163 5.64556 7.38538 5.63515H6.88538C6.70829 5.63515 6.43746 5.69765 6.19788 5.95806C5.96871 6.21848 5.30204 6.84348 5.30204 8.11431C5.30204 9.38515 6.22913 10.6143 6.35413 10.781C6.47913 10.9581 8.17704 13.5622 10.7604 14.6768C11.375 14.9476 11.8541 15.1039 12.2291 15.2185C12.8437 15.4164 13.4062 15.3851 13.8541 15.3226C14.3541 15.2497 15.3854 14.6976 15.5937 14.0935C15.8125 13.4893 15.8125 12.9789 15.7395 12.8643C15.6666 12.7497 15.5104 12.6976 15.25 12.5726Z"
      fill="#2CB742"
    />
  </svg>
);

export default ViewCreditModal;
