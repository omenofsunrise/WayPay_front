import type { MouseEvent } from "react";
import WayPayIconButton from "./WayPayIconButton";

interface EditButtonProps {
  onClick: (event: MouseEvent) => void;
  tooltip?: string;
  size?: number;
}

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditButton = ({
  onClick,
  tooltip = "Редактировать",
  size = 32,
}: EditButtonProps) => (
  <WayPayIconButton
    icon={<EditIcon />}
    label={tooltip}
    onClick={onClick}
    style={{ width: size, minWidth: size, height: size, minHeight: size }}
  />
);

export default EditButton;
