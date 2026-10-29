import type { MouseEvent } from "react";
import WayPayIconButton from "./WayPayIconButton";

interface AddButtonProps {
  onClick: (event: MouseEvent) => void;
  tooltip?: string;
  size?: number;
  margin?: string;
}

const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const AddButton = ({
  onClick,
  tooltip = "Добавить",
  size = 32,
  margin,
}: AddButtonProps) => (
  <WayPayIconButton
    icon={<PlusIcon />}
    label={tooltip}
    onClick={onClick}
    style={{
      width: size,
      minWidth: size,
      height: size,
      minHeight: size,
      margin,
    }}
  />
);

export default AddButton;
