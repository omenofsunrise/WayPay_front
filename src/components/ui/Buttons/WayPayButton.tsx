import type { ButtonHTMLAttributes, ReactNode } from "react";
import styled, { css } from "styled-components";

export type WayPayButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "ghost"
  | "danger";

export type WayPayButtonSize = "small" | "medium" | "large";

export interface WayPayButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: WayPayButtonVariant;
  size?: WayPayButtonSize;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles = {
  primary: css`
    border-color: var(--wp-color-primary);
    background: var(--wp-color-primary);
    color: #fff;

    &:hover:not(:disabled) {
      border-color: var(--wp-color-primary-hover);
      background: var(--wp-color-primary-hover);
    }
  `,
  secondary: css`
    border-color: var(--wp-color-border-strong);
    background: #fff;
    color: var(--wp-color-text);

    &:hover:not(:disabled) {
      border-color: var(--wp-color-primary);
      background: var(--wp-color-primary-soft);
      color: var(--wp-color-primary);
    }
  `,
  neutral: css`
    border-color: var(--wp-color-neutral-200);
    background: var(--wp-color-neutral-200);
    color: var(--wp-color-text);

    &:hover:not(:disabled) {
      border-color: var(--wp-color-primary-muted);
      background: var(--wp-color-primary-muted);
    }
  `,
  ghost: css`
    border-color: transparent;
    background: transparent;
    color: var(--wp-color-text-muted);

    &:hover:not(:disabled) {
      background: var(--wp-color-primary-soft);
      color: var(--wp-color-primary);
    }
  `,
  danger: css`
    border-color: var(--wp-color-danger-border);
    background: var(--wp-color-danger-soft);
    color: var(--wp-color-danger);

    &:hover:not(:disabled) {
      border-color: var(--wp-color-danger);
      background: var(--wp-color-danger);
      color: #fff;
    }
  `,
};

const sizeStyles = {
  small: css`
    min-height: 32px;
    padding: 5px 12px;
    border-radius: 7px;
    font-size: 12px;
  `,
  medium: css`
    min-height: 38px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 13px;
  `,
  large: css`
    min-height: 42px;
    padding: 9px 18px;
    border-radius: 9px;
    font-size: 14px;
  `,
};

export const WayPayButtonBase = styled.button<{
  $variant: WayPayButtonVariant;
  $size: WayPayButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  margin: 0;
  border: 1px solid transparent;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;

  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size }) => sizeStyles[$size]}

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--wp-color-focus-ring);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  svg,
  img {
    flex: 0 0 auto;
  }
`;

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: wp-button-spin 0.7s linear infinite;

  @keyframes wp-button-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const WayPayButton = ({
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "start",
  fullWidth = false,
  loading = false,
  disabled,
  children,
  type = "button",
  ...props
}: WayPayButtonProps) => (
  <WayPayButtonBase
    {...props}
    type={type}
    disabled={disabled || loading}
    $variant={variant}
    $size={size}
    $fullWidth={fullWidth}
    aria-busy={loading || undefined}
  >
    {loading ? (
      <Spinner aria-hidden="true" />
    ) : (
      iconPosition === "start" && icon
    )}
    {children != null && <ButtonContent>{children}</ButtonContent>}
    {!loading && iconPosition === "end" && icon}
  </WayPayButtonBase>
);

export default WayPayButton;
