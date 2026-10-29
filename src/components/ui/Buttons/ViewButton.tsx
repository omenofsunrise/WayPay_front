import WayPayIconButton from "./WayPayIconButton";
import viewIcon from "../../../assets/ui/credits/newCredit/view.svg";

interface ViewButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

const ViewButton = ({ onClick, disabled = false }: ViewButtonProps) => (
  <WayPayIconButton
    icon={<img src={viewIcon} alt="" width="17" height="17" />}
    label="Просмотреть"
    variant="ghost"
    onClick={onClick}
    disabled={disabled}
  />
);

export default ViewButton;
