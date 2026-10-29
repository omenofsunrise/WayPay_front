import type { MouseEvent } from "react";
import WayPayIconButton from "./WayPayIconButton";

interface DeleteButtonProps {
  onClick: (event: MouseEvent) => void;
  tooltip?: string;
  size?: number;
}

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteButton = ({
  onClick,
  tooltip = "Удалить",
  size = 32,
}: DeleteButtonProps) => (
  <WayPayIconButton
    icon={<DeleteIcon />}
    label={tooltip}
    variant="danger"
    onClick={onClick}
    style={{ width: size, minWidth: size, height: size, minHeight: size }}
  />
);

export default DeleteButton;
