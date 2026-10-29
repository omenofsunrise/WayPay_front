import type { ReactNode } from "react";
import styled from "styled-components";

export interface WayPayMoreMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  icon?: ReactNode;
}

interface WayPayMoreMenuProps {
  items: WayPayMoreMenuItem[];
  label?: string;
  size?: "small" | "medium" | "large";
}

const menuSizes = {
  small: "32px",
  medium: "38px",
  large: "42px",
};

const Menu = styled.details`
  position: relative;

  &[open] > summary {
    border-color: var(--wp-color-primary);
    background: var(--wp-color-primary-soft);
    color: var(--wp-color-primary);
  }
`;

const Trigger = styled.summary<{ $size: keyof typeof menuSizes }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: ${({ $size }) => menuSizes[$size]};
  height: ${({ $size }) => menuSizes[$size]};
  padding: 0;
  border: 1px solid var(--wp-color-border-strong);
  border-radius: 8px;
  background: #fff;
  color: var(--wp-color-text-muted);
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    border-color: var(--wp-color-primary);
    background: var(--wp-color-primary-soft);
    color: var(--wp-color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--wp-color-focus-ring);
  }

  span {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  z-index: 40;
  top: calc(100% + 6px);
  right: 0;
  min-width: 190px;
  padding: 6px;
  border: 1px solid var(--wp-color-border);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
`;

const MenuItem = styled.button<{ $tone: "default" | "danger" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: ${({ $tone }) =>
    $tone === "danger" ? "var(--wp-color-danger)" : "var(--wp-color-text)"};
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ $tone }) =>
      $tone === "danger"
        ? "var(--wp-color-danger-soft)"
        : "var(--wp-color-primary-soft)"};
    color: ${({ $tone }) =>
      $tone === "danger"
        ? "var(--wp-color-danger)"
        : "var(--wp-color-primary)"};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const WayPayMoreMenu = ({
  items,
  label = "Другие действия",
  size = "medium",
}: WayPayMoreMenuProps) => (
  <Menu>
    <Trigger aria-label={label} title={label} $size={size}>
      <span />
      <span />
      <span />
    </Trigger>
    <Dropdown>
      {items.map((item) => (
        <MenuItem
          key={item.label}
          type="button"
          $tone={item.tone || "default"}
          disabled={item.disabled}
          onClick={(event) => {
            item.onClick();
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
        >
          {item.icon}
          {item.label}
        </MenuItem>
      ))}
    </Dropdown>
  </Menu>
);

export default WayPayMoreMenu;
