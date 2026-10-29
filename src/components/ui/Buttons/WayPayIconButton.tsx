import type { ButtonHTMLAttributes, ReactNode } from "react";
import styled from "styled-components";
import {
  WayPayButtonBase,
  type WayPayButtonVariant,
} from "./WayPayButton";

type WayPayIconButtonSize = "small" | "medium" | "large";

interface WayPayIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: WayPayButtonVariant;
  size?: WayPayIconButtonSize;
  label: string;
  active?: boolean;
}

const iconButtonSizes = {
  small: "32px",
  medium: "38px",
  large: "42px",
};

const IconButton = styled(WayPayButtonBase)<{
  $iconSize: WayPayIconButtonSize;
  $active: boolean;
}>`
  width: ${({ $iconSize }) => iconButtonSizes[$iconSize]};
  min-width: ${({ $iconSize }) => iconButtonSizes[$iconSize]};
  height: ${({ $iconSize }) => iconButtonSizes[$iconSize]};
  min-height: ${({ $iconSize }) => iconButtonSizes[$iconSize]};
  padding: 0;
  color: ${({ $active }) => ($active ? "var(--wp-color-primary)" : undefined)};
  border-color: ${({ $active }) =>
    $active ? "var(--wp-color-primary)" : undefined};
  background: ${({ $active }) =>
    $active ? "var(--wp-color-primary-soft)" : undefined};
`;

const WayPayIconButton = ({
  icon,
  variant = "secondary",
  size = "medium",
  label,
  active = false,
  type = "button",
  ...props
}: WayPayIconButtonProps) => (
  <IconButton
    {...props}
    type={type}
    aria-label={label}
    title={props.title || label}
    $variant={variant}
    $size="medium"
    $fullWidth={false}
    $iconSize={size}
    $active={active}
  >
    {icon}
  </IconButton>
);

export default WayPayIconButton;
