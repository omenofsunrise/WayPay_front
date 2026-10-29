import React, { type ReactNode, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import DarkCyanButton from "../../ui/Buttons/DarkCyanButton";
import WayPayButton from "../../ui/Buttons/WayPayButton";
import WayPayIconButton from "../../ui/Buttons/WayPayIconButton";

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
  appearance?: "default" | "compact-form";
  saveButtonStyle?: React.CSSProperties;
  submittingText?: string;
  hideCloseButton?: boolean;
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
  cancelButtonText = "Отмена",
  width = "562px",
  saveButtonText = "Сохранить",
  customLayout,
  maxHeight = "90vh",
  subtitle,
  appearance = "default",
  saveButtonStyle,
  submittingText = "Сохранение...",
  hideCloseButton = false,
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
        {!hideCloseButton && (
          <CloseButton
            $appearance={appearance}
            icon={<CloseIcon aria-hidden="true" />}
            label="Закрыть"
            variant="ghost"
            size="small"
            onClick={onClose}
          />
        )}
        <ModalHeader $appearance={appearance}>
          <div>
            <ModalTitle $appearance={appearance}>{title}</ModalTitle>
            {subtitle && <ModalSubtitle>{subtitle}</ModalSubtitle>}
          </div>
        </ModalHeader>
        <div className="modal-body">{customLayout}</div>
        <ModalForm as={onSave ? "form" : "div"} onSubmit={onSave}>
          <ModalContent ref={contentRef} isScrollable={isScrollable} $appearance={appearance}>
            {children}
          </ModalContent>

          {(!hideCanselButton || (!isViewMode && !hideSaveButton)) && (
            <ModalFooter $appearance={appearance}>
              {!hideCanselButton && (
                <WayPayButton
                  variant="secondary"
                  size="large"
                  style={{ width: "116px" }}
                  onClick={handleCancel}
                >
                  {cancelButtonText}
                </WayPayButton>
              )}
              {!isViewMode && !hideSaveButton && (
                <DarkCyanButton
                  style={{
                    minWidth: "150px",
                    minHeight: "40px",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    ...saveButtonStyle,
                  }}
                  type="submit"
                  disabled={isSaveDisabled || isSubmitting}
                >
                  {isSubmitting ? submittingText : saveButtonText || "Сохранить"}
                </DarkCyanButton>
              )}
            </ModalFooter>
          )}
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
  $appearance: "default" | "compact-form";
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

  ${({ $appearance }) => $appearance === "compact-form" && css`
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

export const ModalHeader = styled.div<{ $appearance?: "default" | "compact-form" }>`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
  align-items: center;
  text-align: left;
  margin: 0;
  padding: 28px 34px 10px;
  flex-shrink: 0;

  ${({ $appearance }) => $appearance === "compact-form" && css`
    justify-content: flex-start;
    padding: 28px 34px 10px;
  `}
`;

export const ModalTitle = styled.h2<{ $appearance?: "default" | "compact-form" }>`
  margin: 0;
  padding: 0;
  color: #172235;
  font-size: 25px;
  font-weight: 700;
  line-height: 1.25;
  text-align: left;

  ${({ $appearance }) => $appearance === "compact-form" && css`
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

const CloseButton = styled(WayPayIconButton)<{ $appearance: "default" | "compact-form" }>`
  position: absolute;
  top: 20px;
  right: 24px;
  width: 32px;
  height: 32px;
  color: #6b7280;
  z-index: 10;

  ${({ $appearance }) => $appearance === "compact-form" && css`
    top: 20px;
    right: 24px;
  `}

  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

`;

const CloseIcon = styled.span`
  position: relative;
  display: block;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 8px;
    left: 0;
    width: 18px;
    height: 2px;
    background: currentColor;
    border-radius: 2px;
  }

  &::before { transform: rotate(45deg); }
  &::after { transform: rotate(-45deg); }
`;

const ModalContent = styled.div<{
  isScrollable: boolean;
  $appearance: "default" | "compact-form";
}>`
  flex: 1;
  width: 100%;
  margin-bottom: 0;
  padding: 0 34px;
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

  ${({ $appearance }) => $appearance === "compact-form" && css`
    margin-bottom: 0;
    padding: 0;
  `}
`;

const ModalFooter = styled.div<{ $appearance: "default" | "compact-form" }>`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 16px 34px 20px;
  border-top: 1px solid #e3e9ef;
  flex-shrink: 0;

  ${({ $appearance }) => $appearance === "compact-form" && css`
    justify-content: flex-end;
    gap: 12px;
    margin: 0;
    padding: 16px 34px 20px;
    border-top: 1px solid #e3e9ef;
  `}
`;
