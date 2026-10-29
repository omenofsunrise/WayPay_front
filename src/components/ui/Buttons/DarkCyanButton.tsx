import type { ButtonHTMLAttributes, ReactNode } from "react";
import WayPayButton from "./WayPayButton";

interface DarkCyanButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
}

const DarkCyanButton = ({
  children = "Подтвердить",
  icon,
  ...props
}: DarkCyanButtonProps) => (
  <WayPayButton {...props} variant="primary" icon={icon}>
    {children}
  </WayPayButton>
);

export default DarkCyanButton;
