import type { ButtonHTMLAttributes, ReactNode } from "react";
import WayPayButton from "./WayPayButton";

interface GrayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  width?: number | string;
}

const GrayButton = ({
  children = "Подтвердить",
  icon,
  width,
  style,
  ...props
}: GrayButtonProps) => (
  <WayPayButton
    {...props}
    variant="neutral"
    icon={icon}
    style={{
      ...style,
      width:
        width == null
          ? style?.width
          : typeof width === "number"
            ? `${width}px`
            : width,
    }}
  >
    {children}
  </WayPayButton>
);

export default GrayButton;
