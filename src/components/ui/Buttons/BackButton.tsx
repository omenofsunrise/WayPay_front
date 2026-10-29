import type { ReactNode } from "react";
import WayPayButton from "./WayPayButton";

interface BackButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

const BackIcon = () => (
  <svg width="18" height="14" viewBox="0 0 21 13" fill="none" aria-hidden="true">
    <path
      d="M6.178.978.656 6.5l5.522 5.522.928-.929L3.169 7.156h17.143V5.844H3.169l3.937-3.938L6.178.978Z"
      fill="currentColor"
    />
  </svg>
);

const BackButton = ({ children, onClick }: BackButtonProps) => (
  <WayPayButton variant="ghost" icon={<BackIcon />} onClick={onClick}>
    {children}
  </WayPayButton>
);

export default BackButton;
