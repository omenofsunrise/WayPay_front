import type { CSSProperties } from "react";
import WayPayButton from "./WayPayButton";

interface WhiteButtonProps {
  text: string;
  onClick?: () => void;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
}

const WhiteButton = ({
  text,
  onClick,
  style,
  type = "button",
}: WhiteButtonProps) => (
  <WayPayButton
    type={type}
    variant="secondary"
    fullWidth
    onClick={onClick}
    style={style}
  >
    {text}
  </WayPayButton>
);

export default WhiteButton;
