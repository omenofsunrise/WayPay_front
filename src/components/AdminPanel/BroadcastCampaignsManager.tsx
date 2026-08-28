import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import useAdminPanel from "../../api/hooks/useAdminPanel";
import type {
  BroadcastCampaign,
  BroadcastCampaignChat,
} from "../../api/services/adminPanelService";
import BaseModal from "../modal/BASE/modalCRUBase";
import DarkCyanButton from "../ui/Buttons/DarkCyanButton";
import Checkbox from "../ui/CheckBoxes/Checkbox";
import CustomInput from "../ui/fields/CustomInput";
import CustomTextArea from "../ui/fields/CustomTextArea";
import CustomPagination from "../ui/fields/CustomPagination";
import PaginationLayout from "../ui/Layouts/PaginationLayout";
import CountInfoTitle from "../ui/Text/CountInfoTitle";
import Tabs from "../ui/fields/Tabs";
import ToggleSwitch from "../ui/Toggles/ToggleSwitch";
import useWhatsApp from "../../api/hooks/useWhatsApp";

// ─── Toast ────────────────────────────────────────────────────────────────────

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div<{ $type: "success" | "error" | "warning" }>`
  padding: 14px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 400px;
  background: ${(p) =>
    p.$type === "success"
      ? "#10b981"
      : p.$type === "error"
      ? "#ef4444"
      : "#f59e0b"};

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// ─── Confirm modal ─────────────────────────────────────────────────────────────

const ConfirmText = styled.p`
  padding: 16px 30px;
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
`;

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  isSubmitting?: boolean;
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  isSubmitting = false,
}: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <BaseModal
      title="Подтверждение"
      onClose={onClose}
      onCancel={onClose}
      onSave={(e) => {
        e.preventDefault();
        onConfirm();
      }}
      isSubmitting={isSubmitting}
      saveButtonText="Подтвердить"
      width="400px"
    >
      <ConfirmText>{message}</ConfirmText>
    </BaseModal>
  );
};

// ─── Styled components ─────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const CampaignGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  overflow-y: auto;
  align-content: start;
  padding-right: 4px;
  max-height: calc(100vh - 380px);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #007d88;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #005f66;
  }
`;

const CampaignCard = styled.div<{ status: string; isTest?: boolean }>`
  background: ${(p) => (p.isTest ? "#F8F5FF" : "white")};
  border-radius: 8px;
  padding: 16px;
  border: 1px solid ${(p) => (p.isTest ? "#C4B5FD" : "#e5e7eb")};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  border-left: 4px solid
    ${(p) => {
      if (p.isTest) return "#8B5CF6";
      switch (p.status) {
        case "Pending":
          return "#F59E0B";
        case "InProgress":
          return "#3B82F6";
        case "Completed":
          return "#10B981";
        case "Failed":
          return "#EF4444";
        case "Cancelled":
          return "#6B7280";
        default:
          return "#6B7280";
      }
    }};
`;

const TestBadge = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  background: #8b5cf6;
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CampaignHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const CampaignTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => {
    switch (p.status) {
      case "Pending":
        return "#FEF3C7";
      case "InProgress":
        return "#DBEAFE";
      case "Completed":
        return "#D1FAE5";
      case "Failed":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  }};
  color: ${(p) => {
    switch (p.status) {
      case "Pending":
        return "#92400E";
      case "InProgress":
        return "#1E40AF";
      case "Completed":
        return "#065F46";
      case "Failed":
        return "#991B1B";
      default:
        return "#374151";
    }
  }};
`;

const CampaignInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;
const InfoLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
`;
const InfoValue = styled.span`
  font-size: 14px;
  color: #111827;
  font-weight: 600;
`;
const InfoValueDanger = styled(InfoValue)`
  color: #ef4444;
`;

const CampaignContent = styled.div`
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const CampaignActions = styled.div<{ $hasButtons: boolean }>`
  display: ${(p) => (p.$hasButtons ? "flex" : "none")};
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: "primary" | "danger" }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  background: ${(p) => (p.variant === "danger" ? "#EF4444" : "#007D88")};
  color: white;

  &:hover {
    background: ${(p) => (p.variant === "danger" ? "#DC2626" : "#005f66")};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;

  div {
    height: 100%;
    width: ${(p) => Math.min(p.progress, 100)}%;
    background: #007d88;
    transition: width 0.3s ease;
  }
`;

const ErrorBanner = styled.div`
  color: #ef4444;
  margin-bottom: 20px;
  padding: 12px;
  background: #fee2e2;
  border-radius: 4px;
`;

const PaginationWrapper = styled.div`
  flex-shrink: 0;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
  background: white;
`;

// ─── Modal form ──────────────────────────────────────────────────────────────

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 30px;
`;

const FormLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 6px;
`;

const FileInput = styled.input`
  display: block;
  margin-top: 8px;
`;

const FileInfo = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #007d88;
  }
`;

const HintText = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RequiredMark = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const FileInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileButton = styled.label`
  padding: 5px 14px;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 5px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
    color: rgba(0, 125, 136, 1);
  }
`;

const FileName = styled.span`
  font-size: 14px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CharCount = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
`;

const TypeCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
`;

const TypeCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$active ? "rgba(0, 125, 136, 1)" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "rgba(0, 125, 136, 0.06)" : "white")};
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;

  &:hover {
    border-color: rgba(0, 125, 136, 0.6);
  }
  &:focus {
    outline: none;
  }
`;

const TypeCardIcon = styled.div<{ $active: boolean }>`
  color: ${(p) => (p.$active ? "rgba(0, 125, 136, 1)" : "#6b7280")};
  display: flex;
`;

const TypeCardTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
`;

const TypeCardSubtitle = styled.div`
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
`;

const DaysRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
`;

const DaysInputWrapper = styled.div`
  width: 100px;

  input {
    max-width: none !important;
  }
`;

const DaysSuffix = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const InProgressWarning = styled.div`
  padding: 12px;
  background: #fef3c7;
  border-radius: 4px;
  color: #92400e;
  font-size: 13px;
  margin-top: 4px;
`;

const ReadonlyField = styled.div`
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  color: #374151;
  font-size: 14px;
`;

// ─── Channels tab ─────────────────────────────────────────────────────────────

const ChannelsManagementSection = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const ChannelsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #007d88;
    border-radius: 3px;
  }
`;

const ChannelCard = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid ${(p) => (p.isActive ? "#007D88" : "#E5E7EB")};
  border-radius: 8px;
  background: ${(p) => (p.isActive ? "#F0F9FA" : "white")};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ChannelInfo = styled.div`
  flex: 1;
`;
const ChannelName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;
const ChannelDetails = styled.div`
  font-size: 13px;
  color: #6b7280;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ChannelStatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${(p) => (p.status === "Connected" ? "#D1FAE5" : "#FEE2E2")};
  color: ${(p) => (p.status === "Connected" ? "#065F46" : "#991B1B")};
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const ToggleLabel = styled.span<{ isActive: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${(p) => (p.isActive ? "#007D88" : "#6B7280")};
  min-width: 35px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007d88;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const NoChannelsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
`;

// ─── Chats tab ────────────────────────────────────────────────────────────────

const ChatsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const ChatsFilterRow = styled.div`
  display: flex;
  gap: 8px;
`;

const ChatsFilterButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid ${(p) => (p.active ? "#007D88" : "#d1d5db")};
  background: ${(p) => (p.active ? "#007D88" : "#ffffff")};
  color: ${(p) => (p.active ? "#ffffff" : "#6B7280")};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #007d88;
  }
`;

const UnreadBadge = styled.span<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  background: ${(p) => (p.active ? "rgba(255,255,255,0.3)" : "#007D88")};
  color: ${(p) => (p.active ? "#fff" : "#fff")};
`;

const ChatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ChatCard = styled.div<{ unread: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: ${(p) => (p.unread ? "#f0f9fa" : "#ffffff")};
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: #007d88;
    background: #f0f9fa;
  }
`;

const ChatBody = styled.div`
  flex: 1;
  min-width: 0;
`;
const ChatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;
const ChatPhone = styled.span`
  font-weight: 600;
  color: #111827;
  font-size: 14px;
`;
const ChatTime = styled.span`
  color: #9ca3af;
  font-size: 12px;
  flex-shrink: 0;
`;

const ChatLastMessage = styled.div<{ unread: boolean }>`
  color: ${(p) => (p.unread ? "#374151" : "#6B7280")};
  font-weight: ${(p) => (p.unread ? 500 : 400)};
  font-size: 13px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #007d88;
  flex-shrink: 0;
`;
const ChatsEmpty = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
`;

const LoadMoreButton = styled.button`
  align-self: center;
  margin: 8px 0;
  padding: 8px 24px;
  border-radius: 8px;
  border: 1px solid rgba(0, 125, 136, 1);
  background: #ffffff;
  color: rgba(0, 125, 136, 1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 125, 136, 1);
    color: #ffffff;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  activeTab: "campaigns" | "channels" | "chats";
  onTabChange: (tab: "campaigns" | "channels" | "chats") => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
  refreshChannelsTick: number;
}

const BroadcastCampaignsManager: React.FC<Props> = ({
  activeTab,
  onTabChange,
  isCreateModalOpen,
  setIsCreateModalOpen,
  refreshChannelsTick,
}) => {
  const navigate = useNavigate();
  const {
    broadcastCampaigns,
    broadcastPagination,
    isLoading,
    error,
    createBroadcastCampaign,
    fetchBroadcastCampaigns,
    cancelBroadcastCampaign,
    toggleWhatsAppChannel,
    updateBroadcastCampaignMessage,
    fetchBroadcastCampaignChats,
    markBroadcastCampaignChatRead,
  } = useAdminPanel();

  const { getChannels } = useWhatsApp();

  const [chats, setChats] = useState<BroadcastCampaignChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatsNextCursor, setChatsNextCursor] = useState<string | null>(null);
  const [chatsHasMore, setChatsHasMore] = useState(false);
  const [chatsUnreadOnly, setChatsUnreadOnly] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalReadOnly, setEditModalReadOnly] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<BroadcastCampaign | null>(null);
  const [editContent, setEditContent] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isTest, setIsTest] = useState(false);
  const [campaignType, setCampaignType] = useState<
    "regular" | "upcoming" | "onDay" | "overdue"
  >("regular");
  const [campaignDays, setCampaignDays] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [channels, setChannels] = useState<any[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [togglingChannelId, setTogglingChannelId] = useState<string | null>(
    null
  );

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isSubmitting: boolean;
  }>({ isOpen: false, message: "", onConfirm: () => {}, isSubmitting: false });

  const [toasts, setToasts] = useState<
    { id: number; type: "success" | "error" | "warning"; message: string }[]
  >([]);

  const addToast = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  useEffect(() => {
    fetchBroadcastCampaigns(1, 10);
    loadChannels();
  }, []);

  useEffect(() => {
    if (refreshChannelsTick > 0) loadChannels();
  }, [refreshChannelsTick]);

  const loadChannels = async () => {
    setIsLoadingChannels(true);
    try {
      const result = await getChannels();
      setChannels(result?.length ? result : []);
    } catch {
      setChannels([]);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const loadChats = async (reset = false) => {
    setIsLoadingChats(true);
    try {
      const result = await fetchBroadcastCampaignChats({
        unread: chatsUnreadOnly || undefined,
        nextCursor: reset ? undefined : chatsNextCursor || undefined,
        limit: 20,
      });
      if (result) {
        setChats((prev) => (reset ? result.items : [...prev, ...result.items]));
        setChatsNextCursor(result.nextCursor);
        setChatsHasMore(result.hasMore);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    if (activeTab === "chats") loadChats(true);
  }, [activeTab, chatsUnreadOnly]);

  const handleChatClick = async (chat: BroadcastCampaignChat) => {
    const phone = (chat.phone || "").replace(/\D/g, "");
    if (phone) {
      const query = chat.channelId
        ? `?channelId=${encodeURIComponent(chat.channelId)}`
        : "";
      navigate(`/admin/whatsapp/${phone}${query}`);
    }
    if (!chat.isRead) {
      setChats((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, isRead: true } : c))
      );
      const ok = await markBroadcastCampaignChatRead(chat.id);
      if (!ok)
        setChats((prev) =>
          prev.map((c) => (c.id === chat.id ? { ...c, isRead: false } : c))
        );
    }
  };

  const formatChatTime = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const timeStr = d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (msgDay.getTime() === todayStart.getTime()) return timeStr;
    if (msgDay.getTime() === yesterdayStart.getTime())
      return `Вчера, ${timeStr}`;
    if (d.getFullYear() === now.getFullYear())
      return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setTitle("");
    setContent("");
    setFile(null);
    setIsTest(false);
    setCampaignType("regular");
    setCampaignDays(3);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      addToast("warning", "Заполните название и содержание кампании");
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await createBroadcastCampaign({
        title,
        content,
        file: file || null,
        test: isTest,
        campaignType,
        days:
          campaignType === "upcoming" || campaignType === "overdue"
            ? campaignDays
            : undefined,
      });
      if (success) {
        setTitle("");
        setContent("");
        setFile(null);
        setIsTest(false);
        setIsCreateModalOpen(false);
        await fetchBroadcastCampaigns(1, 10);
        addToast("success", "Кампания успешно создана");
      } else {
        addToast("error", "Ошибка при создании кампании");
      }
    } catch {
      addToast("error", "Ошибка при создании кампании");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    if (!editContent.trim()) {
      addToast("warning", "Содержание сообщения не может быть пустым");
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await updateBroadcastCampaignMessage(
        editingCampaign.id,
        editContent
      );
      if (success) {
        setIsEditModalOpen(false);
        setEditingCampaign(null);
        setEditContent("");
        await fetchBroadcastCampaigns(
          broadcastPagination.page,
          broadcastPagination.pageSize
        );
        addToast("success", "Сообщение обновлено");
      } else {
        addToast("error", "Ошибка при обновлении сообщения");
      }
    } catch {
      addToast("error", "Ошибка при обновлении сообщения");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMessage = (campaign: BroadcastCampaign) => {
    const readOnly =
      campaign.status !== "Pending" && campaign.status !== "InProgress";
    setEditingCampaign(campaign);
    setEditContent(campaign.message.content);
    setEditModalReadOnly(readOnly);
    setIsEditModalOpen(true);
  };

  const handleCancelCampaign = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: "Вы уверены, что хотите отменить эту рассылку?",
      isSubmitting: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isSubmitting: true }));
        try {
          await cancelBroadcastCampaign(id);
          await fetchBroadcastCampaigns(
            broadcastPagination.page,
            broadcastPagination.pageSize
          );
          addToast("success", "Рассылка отменена");
        } catch {
          addToast("error", "Ошибка при отмене кампании");
        } finally {
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            isSubmitting: false,
          }));
        }
      },
    });
  };

  const handleToggleChannel = (channelId: string, currentStatus: boolean) => {
    if (togglingChannelId === channelId) return;
    const channel = channels.find((ch) => ch.id === channelId);
    if (!channel) return;
    const actionText = currentStatus ? "отключить" : "включить";
    setConfirmModal({
      isOpen: true,
      message: `Вы уверены, что хотите ${actionText} канал "${channel.name}"?`,
      isSubmitting: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isSubmitting: true }));
        setTogglingChannelId(channelId);
        try {
          await toggleWhatsAppChannel(channelId);
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channelId
                ? { ...ch, adminBroadCast: !currentStatus }
                : ch
            )
          );
          addToast(
            "success",
            `Канал ${currentStatus ? "отключён" : "включён"}`
          );
        } catch {
          addToast("error", "Ошибка при изменении статуса канала");
        } finally {
          setTogglingChannelId(null);
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            isSubmitting: false,
          }));
        }
      },
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return "Ожидает";
      case "InProgress":
        return "В процессе";
      case "Completed":
        return "Завершена";
      case "Failed":
        return "Ошибка";
      case "Cancelled":
        return "Отменена";
      default:
        return status;
    }
  };

  const getProgress = (c: BroadcastCampaign) =>
    c.totalRecipients === 0 ? 0 : (c.sentCount / c.totalRecipients) * 100;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ─── Tab contents ──────────────────────────────────────────────────────────

  const campaignsContent = (
    <>
      {error && <ErrorBanner>Ошибка: {error}</ErrorBanner>}

      {!isLoading &&
      (!broadcastCampaigns || broadcastCampaigns.length === 0) ? (
        <EmptyState>
          <p>Нет созданных рекламных кампаний</p>
          <p style={{ fontSize: "14px", marginTop: "8px" }}>
            Нажмите «+ Создать кампанию», чтобы начать
          </p>
        </EmptyState>
      ) : (
        <>
          <CampaignGrid>
            {broadcastCampaigns?.map((campaign) => {
              const isTestCampaign =
                (campaign as any).isTest || (campaign as any).test || false;
              return (
                <CampaignCard
                  key={campaign.id}
                  status={campaign.status}
                  isTest={isTestCampaign}
                >
                  {isTestCampaign && <TestBadge>Тест</TestBadge>}

                  <CampaignHeader>
                    <CampaignTitle>{campaign.title}</CampaignTitle>
                    <StatusBadge status={campaign.status}>
                      {getStatusText(campaign.status)}
                    </StatusBadge>
                  </CampaignHeader>

                  <CampaignContent>{campaign.message.content}</CampaignContent>

                  <CampaignInfo>
                    <InfoItem>
                      <InfoLabel>Создана</InfoLabel>
                      <InfoValue>{formatDate(campaign.createdAt)}</InfoValue>
                    </InfoItem>
                    {campaign.completedAt && (
                      <InfoItem>
                        <InfoLabel>Завершена</InfoLabel>
                        <InfoValue>
                          {formatDate(campaign.completedAt)}
                        </InfoValue>
                      </InfoItem>
                    )}
                    <InfoItem>
                      <InfoLabel>Получатели</InfoLabel>
                      <InfoValue>
                        {campaign.totalRecipients > 0
                          ? campaign.totalRecipients
                          : "—"}
                      </InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Отправлено</InfoLabel>
                      <InfoValue>{campaign.sentCount}</InfoValue>
                    </InfoItem>
                    {campaign.failedCount > 0 && (
                      <InfoItem>
                        <InfoLabel>Ошибок</InfoLabel>
                        <InfoValueDanger>
                          {campaign.failedCount}
                        </InfoValueDanger>
                      </InfoItem>
                    )}
                  </CampaignInfo>

                  {campaign.status === "InProgress" && (
                    <ProgressBar progress={getProgress(campaign)}>
                      <div />
                    </ProgressBar>
                  )}

                  {(() => {
                    const canEdit =
                      campaign.status === "Pending" ||
                      campaign.status === "InProgress";
                    const canCancel = campaign.status === "Pending";
                    const canView = !canEdit;
                    return (
                      <CampaignActions
                        $hasButtons={canEdit || canCancel || canView}
                      >
                        {canEdit && (
                          <ActionButton
                            variant="primary"
                            onClick={() => handleEditMessage(campaign)}
                          >
                            Редактировать
                          </ActionButton>
                        )}
                        {canView && (
                          <ActionButton
                            variant="primary"
                            onClick={() => handleEditMessage(campaign)}
                          >
                            Просмотр
                          </ActionButton>
                        )}
                        {canCancel && (
                          <ActionButton
                            variant="danger"
                            onClick={() => handleCancelCampaign(campaign.id)}
                          >
                            Отменить
                          </ActionButton>
                        )}
                      </CampaignActions>
                    );
                  })()}
                </CampaignCard>
              );
            })}
          </CampaignGrid>

          <PaginationWrapper>
            <PaginationLayout>
              <CountInfoTitle total={broadcastPagination.totalCount} />
              <CustomPagination
                total={broadcastPagination.totalCount}
                current={broadcastPagination.page}
                onChange={(p) =>
                  fetchBroadcastCampaigns(p, broadcastPagination.pageSize)
                }
                itemsPerPage={broadcastPagination.pageSize}
              />
            </PaginationLayout>
          </PaginationWrapper>
        </>
      )}
    </>
  );

  const channelsContent = (
    <ChannelsManagementSection>
      {isLoadingChannels && channels.length === 0 ? (
        <NoChannelsMessage>Загрузка каналов...</NoChannelsMessage>
      ) : channels.length === 0 ? (
        <NoChannelsMessage>
          Нет доступных WhatsApp каналов.
          <br />
          <span style={{ fontSize: "13px", color: "#9CA3AF" }}>
            Перейдите в настройки WhatsApp для подключения каналов
          </span>
        </NoChannelsMessage>
      ) : (
        <ChannelsList>
          {channels.map((channel) => {
            const isActive = channel.adminBroadCast !== false;
            const isToggling = togglingChannelId === channel.id;
            return (
              <ChannelCard key={channel.id} isActive={isActive}>
                <ChannelInfo>
                  <ChannelName>{channel.name}</ChannelName>
                  <ChannelDetails>
                    {channel.phone && <span>📱 {channel.phone}</span>}
                    <ChannelStatusBadge status={channel.status}>
                      {channel.status === "Connected"
                        ? "Подключен"
                        : "Не подключен"}
                    </ChannelStatusBadge>
                  </ChannelDetails>
                </ChannelInfo>
                <ToggleContainer
                  title={
                    channel.status !== "Connected"
                      ? "Канал не подключён к WhatsApp — рассылки недоступны"
                      : undefined
                  }
                >
                  <ToggleLabel
                    isActive={isActive && channel.status === "Connected"}
                  >
                    {isActive ? "Вкл" : "Выкл"}
                  </ToggleLabel>
                  {isToggling ? (
                    <LoadingSpinner />
                  ) : (
                    <ToggleSwitch
                      checked={isActive}
                      onChange={() => handleToggleChannel(channel.id, isActive)}
                      disabled={channel.status !== "Connected"}
                    />
                  )}
                </ToggleContainer>
              </ChannelCard>
            );
          })}
        </ChannelsList>
      )}
    </ChannelsManagementSection>
  );

  const unreadCount = !chatsUnreadOnly
    ? chats.filter((c) => !c.isRead).length
    : chats.length;

  const chatsContent = (
    <ChatsSection>
      <ChatsFilterRow>
        <ChatsFilterButton
          active={!chatsUnreadOnly}
          onClick={() => setChatsUnreadOnly(false)}
        >
          Все
        </ChatsFilterButton>
        <ChatsFilterButton
          active={chatsUnreadOnly}
          onClick={() => setChatsUnreadOnly(true)}
        >
          Непрочитанные
          {unreadCount > 0 && (
            <UnreadBadge active={chatsUnreadOnly}>{unreadCount}</UnreadBadge>
          )}
        </ChatsFilterButton>
      </ChatsFilterRow>

      {isLoadingChats && chats.length === 0 ? (
        <ChatsEmpty>Загрузка...</ChatsEmpty>
      ) : chats.length === 0 ? (
        <ChatsEmpty>
          {chatsUnreadOnly ? "Нет непрочитанных ответов" : "Ответов пока нет"}
        </ChatsEmpty>
      ) : (
        <>
          <ChatsList>
            {chats.map((chat) => (
              <ChatCard
                key={chat.id}
                unread={!chat.isRead}
                onClick={() => handleChatClick(chat)}
                title="Открыть чат в WhatsApp"
              >
                <ChatBody>
                  <ChatTop>
                    <ChatPhone>{chat.phone || "Без номера"}</ChatPhone>
                    <ChatTime>{formatChatTime(chat.time)}</ChatTime>
                  </ChatTop>
                  <ChatLastMessage unread={!chat.isRead}>
                    {chat.lastMessage || "—"}
                  </ChatLastMessage>
                </ChatBody>
                {!chat.isRead && <UnreadDot />}
              </ChatCard>
            ))}
          </ChatsList>
          {chatsHasMore && (
            <LoadMoreButton
              onClick={() => loadChats(false)}
              disabled={isLoadingChats}
            >
              {isLoadingChats ? "Загрузка..." : "Показать ещё"}
            </LoadMoreButton>
          )}
        </>
      )}
    </ChatsSection>
  );

  const tabs = [
    { id: "campaigns", label: "Рекламные кампании", content: campaignsContent },
    { id: "channels", label: "WhatsApp каналы", content: channelsContent },
    { id: "chats", label: "Ответы", content: chatsContent },
  ];

  return (
    <Container>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => onTabChange(id as typeof activeTab)}
      />

      {/* Создание кампании */}
      <BaseModal
        title="Создание рекламной кампании"
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCancel={closeCreateModal}
        onSave={handleCreateCampaign}
        isSubmitting={isSubmitting}
        width="800px"
      >
        <ModalForm>
          <ModalField>
            <FormLabel>Тип рассылки</FormLabel>
            <TypeCardGrid>
              {(
                [
                  {
                    type: "regular",
                    title: "Обычная",
                    subtitle: "Ручная рассылка",
                    icon: (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    type: "upcoming",
                    title: "Приближающийся платёж",
                    subtitle: "До даты платежа",
                    icon: (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.73 21a2 2 0 0 1-3.46 0"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    type: "onDay",
                    title: "В день платежа",
                    subtitle: "День оплаты",
                    icon: (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 2v4M8 2v4M3 10h18"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 16l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    type: "overdue",
                    title: "Просрочка",
                    subtitle: "После пропуска",
                    icon: (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 9v4M12 17h.01"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                ] as const
              ).map((opt) => (
                <TypeCard
                  key={opt.type}
                  type="button"
                  $active={campaignType === opt.type}
                  onClick={() =>
                    setCampaignType(
                      opt.type as "regular" | "upcoming" | "onDay" | "overdue"
                    )
                  }
                >
                  <TypeCardIcon $active={campaignType === opt.type}>
                    {opt.icon}
                  </TypeCardIcon>
                  <TypeCardTitle>{opt.title}</TypeCardTitle>
                  <TypeCardSubtitle>{opt.subtitle}</TypeCardSubtitle>
                </TypeCard>
              ))}
            </TypeCardGrid>

            {(campaignType === "upcoming" || campaignType === "overdue") && (
              <div style={{ marginTop: "12px" }}>
                <FormLabel style={{ marginBottom: "8px" }}>
                  {campaignType === "upcoming"
                    ? "За сколько дней до платежа?"
                    : "Через сколько дней после платежа?"}
                </FormLabel>
                <DaysRow>
                  <DaysInputWrapper>
                    <CustomInput
                      type="number"
                      inputType="number"
                      value={campaignDays.toString()}
                      onChange={(e) =>
                        setCampaignDays(parseInt(e.target.value, 10) || 1)
                      }
                      min={1}
                    />
                  </DaysInputWrapper>
                  <DaysSuffix>дн.</DaysSuffix>
                </DaysRow>
              </div>
            )}
          </ModalField>

          <ModalField>
            <FormLabel>
              Название кампании <RequiredMark>*</RequiredMark>
            </FormLabel>
            <CustomInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название кампании"
            />
          </ModalField>

          <ModalField>
            <FormLabel>
              Содержание <RequiredMark>*</RequiredMark>
            </FormLabel>
            <CustomTextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введите текст сообщения для рассылки"
              rows={5}
            />
          </ModalField>

          <ModalField>
            <FormLabel>Файл</FormLabel>
            <FileInputWrapper>
              <HiddenFileInput
                id="campaign-file-input"
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
              <FileButton htmlFor="campaign-file-input">
                Выбрать файл
              </FileButton>
              <FileName>
                {file
                  ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
                  : "Файл не выбран"}
              </FileName>
            </FileInputWrapper>
          </ModalField>

          <ModalField>
            <Checkbox
              checked={isTest}
              onChange={setIsTest}
              label="Тестовая рассылка (только для проверки)"
            />
            <HintText>
              Тестовые кампании будут отправлены только на тестовые номера и не
              затронут реальных пользователей
            </HintText>
          </ModalField>
        </ModalForm>
      </BaseModal>

      {/* Редактирование сообщения */}
      <BaseModal
        title={
          editModalReadOnly ? "Просмотр сообщения" : "Редактирование сообщения"
        }
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCampaign(null);
          setEditContent("");
        }}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingCampaign(null);
          setEditContent("");
        }}
        onSave={editModalReadOnly ? undefined : handleSaveEditMessage}
        mode={editModalReadOnly ? "view" : "edit"}
        hideCanselButton={editModalReadOnly}
        isSubmitting={isSubmitting}
        width="600px"
      >
        {editingCampaign && (
          <ModalForm>
            <div>
              <FormLabel>Кампания</FormLabel>
              <ReadonlyField>{editingCampaign.title}</ReadonlyField>
            </div>

            <div>
              <FormLabel>Статус</FormLabel>
              <ReadonlyField>
                {getStatusText(editingCampaign.status)}
              </ReadonlyField>
            </div>

            <div>
              <FormLabel>Сообщение</FormLabel>
              {editModalReadOnly ? (
                <ReadonlyField
                  style={{ whiteSpace: "pre-wrap", minHeight: "80px" }}
                >
                  {editContent}
                </ReadonlyField>
              ) : (
                <>
                  <CustomTextArea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Введите новое содержание сообщения"
                    rows={6}
                  />
                  <CharCount>{editContent.length} символов</CharCount>
                </>
              )}
            </div>

            {editingCampaign.status === "InProgress" && (
              <InProgressWarning>
                Внимание: кампания уже в процессе отправки. Изменение сообщения
                может повлиять на текущую рассылку.
              </InProgressWarning>
            )}
          </ModalForm>
        )}
      </BaseModal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        message={confirmModal.message}
        isSubmitting={confirmModal.isSubmitting}
      />

      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "⚠ "}
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </Container>
  );
};

export default BroadcastCampaignsManager;
