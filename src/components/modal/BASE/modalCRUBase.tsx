import React, { type ReactNode, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import DarkCyanButton from "../../ui/Buttons/DarkCyanButton";

export type ModalMode =
  | "create"
  | "edit"
  | "view"
  | "create-pool"
  | "edit-pool";

interface ModalProps {
  isOpen?: boolean;
  title?: string;
  onClose: () => void;
  onCancel: () => void;
  onSave?: (e: React.FormEvent) => void;
  children: ReactNode;
  isSaveDisabled?: boolean;
  isSubmitting?: boolean;
  mode?: ModalMode;
  hideSaveButton?: boolean;
  hideCanselButton?: boolean;
  cancelButtonText?: string;
  width?: string;
  saveButtonText?: string;
  customLayout?: React.ReactNode;
  maxHeight?: string;
  subtitle?: string;
  appearance?: "default" | "client-create";
}

const BaseModal: React.FC<ModalProps> = ({
  isOpen = true,
  title,
  onClose,
  onCancel,
  onSave,
  children,
  isSaveDisabled = false,
  isSubmitting = false,
  mode = "create",
  hideSaveButton = false,
  hideCanselButton = false,
  cancelButtonText = "Отменить",
  width = "562px",
  saveButtonText = "Сохранить",
  customLayout,
  maxHeight = "90vh",
  subtitle,
  appearance = "default",
}) => {
  const isViewMode = mode === "view";

  // ✅ ВСЕ ХУКИ ВЫЗЫВАЮТСЯ ДО ЛЮБОГО УСЛОВНОГО ВОЗВРАТА
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onCancel();
  };

  // ✅ Эффекты тоже до условного возврата
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const checkContentHeight = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = contentRef.current.clientHeight;
        setIsScrollable(contentHeight > containerHeight);
      }
    };

    checkContentHeight();
    window.addEventListener("resize", checkContentHeight);

    const observer = new MutationObserver(checkContentHeight);
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    return () => {
      window.removeEventListener("resize", checkContentHeight);
      observer.disconnect();
    };
  }, []);

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

  const handleModalScroll = (e: React.WheelEvent) => {
    const modalContent = contentRef.current;
    if (!modalContent) return;

    const isAtTop = modalContent.scrollTop === 0;
    const isAtBottom =
      Math.abs(
        modalContent.scrollHeight -
          modalContent.clientHeight -
          modalContent.scrollTop
      ) < 1;

    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.stopPropagation();
    }
  };

  // ✅ УСЛОВНЫЙ ВОЗВРАТ ПОСЛЕ ВСЕХ ХУКОВ
  if (!isOpen) {
    return null;
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContainer
        width={width}
        maxHeight={maxHeight}
        $appearance={appearance}
        ref={modalRef}
        onWheel={handleModalScroll}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton $appearance={appearance} onClick={onClose}>&times;</CloseButton>
        <ModalHeader $appearance={appearance}>
          <div>
            <ModalTitle $appearance={appearance}>{title}</ModalTitle>
            {subtitle && <ModalSubtitle>{subtitle}</ModalSubtitle>}
          </div>
        </ModalHeader>
        <div className="modal-body">{customLayout}</div>
        <ModalForm onSubmit={onSave}>
          <ModalContent ref={contentRef} isScrollable={isScrollable} $appearance={appearance}>
            {children}
          </ModalContent>

          <ModalFooter $appearance={appearance}>
            {!hideCanselButton && (
              <CancelButton $appearance={appearance} onClick={handleCancel}>
                {cancelButtonText}
              </CancelButton>
            )}
            {!isViewMode && !hideSaveButton && (
              <DarkCyanButton
                style={{
                  minWidth: appearance === "client-create" ? "150px" : "128px",
                  minHeight: "40px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
                type="submit"
                disabled={isSaveDisabled || isSubmitting}
              >
                {isSubmitting ? "Сохранение..." : saveButtonText || "Сохранить"}
              </DarkCyanButton>
            )}
          </ModalFooter>
        </ModalForm>
      </ModalContainer>
    </ModalBackdrop>
  );
};

export default BaseModal;

// Стили остаются без изменений...
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
`;

const ModalContainer = styled.div<{
  width: string;
  maxHeight: string;
  $appearance: "default" | "client-create";
}>`
  width: ${(props) => props.width};
  max-width: calc(100vw - 32px);
  max-height: ${(props) => props.maxHeight};
  background: #fff;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28);
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
  margin: 0;
  overflow: hidden;

  ${({ $appearance }) => $appearance === "client-create" && css`
    padding: 0;
    background: #fff;
    border: 0;
    border-radius: 14px;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28);
  `}

  @media (max-height: 768px) {
    max-height: 95vh;
  }

  @media (max-width: 600px) {
    padding: 0;
    border-radius: 10px;
    max-height: 95vh;
  }
`;

const ModalForm = styled.form`
  display: flex;
  width: 100%;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

export const ModalHeader = styled.div<{ $appearance?: "default" | "client-create" }>`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
  align-items: center;
  text-align: left;
  margin: 0;
  padding: 24px 28px 14px;
  flex-shrink: 0;

  ${({ $appearance }) => $appearance === "client-create" && css`
    justify-content: flex-start;
    padding: 28px 34px 10px;
  `}
`;

export const ModalTitle = styled.h2<{ $appearance?: "default" | "client-create" }>`
  margin: 0;
  padding: 0;
  color: #172235;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  text-align: left;

  ${({ $appearance }) => $appearance === "client-create" && css`
    margin: 0;
    padding: 0;
    color: #172235;
    font-size: 25px;
    font-weight: 700;
    line-height: 1.2;
  `}
`;

const ModalSubtitle = styled.p`
  margin: 5px 0 0;
  color: #7b8799;
  font-size: 14px;
  line-height: 1.4;
  text-align: left;
`;

const CloseButton = styled.button<{ $appearance: "default" | "client-create" }>`
  position: absolute;
  top: 17px;
  right: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
  z-index: 1;
  transition: background-color 0.15s, color 0.15s;

  ${({ $appearance }) => $appearance === "client-create" && css`
    top: 20px;
    right: 24px;
    font-size: 26px;
    font-weight: 300;
  `}

  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

  &:active {
    background-color: #e5e7eb;
  }
`;

const ModalContent = styled.div<{
  isScrollable: boolean;
  $appearance: "default" | "client-create";
}>`
  flex: 1;
  width: 100%;
  margin-bottom: 0;
  padding: 0 24px;
  box-sizing: border-box;
  text-align: left;
  min-height: 0;
  overflow-y: ${(props) => (props.isScrollable ? "auto" : "visible")};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(173, 179, 188, 1);
    border-radius: 4px;

    &:hover {
      background: rgba(130, 140, 150, 1);
    }
  }

  scrollbar-width: thin;
  scrollbar-color: rgba(173, 179, 188, 1) rgba(241, 241, 241, 1);

  ${({ $appearance }) => $appearance === "client-create" && css`
    margin-bottom: 0;
    padding: 0;
  `}
`;

const ModalFooter = styled.div<{ $appearance: "default" | "client-create" }>`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 16px 24px 20px;
  border-top: 1px solid #e3e9ef;
  flex-shrink: 0;

  ${({ $appearance }) => $appearance === "client-create" && css`
    justify-content: flex-end;
    gap: 12px;
    margin: 0;
    padding: 16px 34px 20px;
    border-top: 1px solid #e3e9ef;
  `}
`;

const CancelButton = styled.button<{ $appearance: "default" | "client-create" }>`
  min-height: 40px;
  padding: 8px 18px;
  background: #fff;
  border: 1px solid #aeb9c6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  width: 116px;
  color: black;

  ${({ $appearance }) => $appearance === "client-create" && css`
    width: 116px;
    min-height: 40px;
    padding: 8px 18px;
    background: #fff;
    border: 1px solid #aeb9c6;
    border-radius: 8px;
    font-size: 14px;
  `}

  &:hover {
    background: #f5f7f9;
  }

  ${({ $appearance }) => $appearance === "client-create" && css`
    &:hover { background: #f5f7f9; }
  `}
`;
