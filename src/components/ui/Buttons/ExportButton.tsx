import type {
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import WayPayButton from "./WayPayButton";

const DefaultExportIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 3h7v7" />
    <path d="m10 14 11-11" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </svg>
);

interface ExportButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  onExport?: () => Promise<void>;
  isExporting?: boolean;
  exportProgress?: number;
}

const ExportButton = ({
  children = "Экспорт",
  icon = <DefaultExportIcon />,
  onExport,
  isExporting = false,
  exportProgress = 0,
  onClick,
  ...props
}: ExportButtonProps) => {
  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (onExport) await onExport();
    onClick?.(event);
  };

  return (
    <WayPayButton
      {...props}
      variant="secondary"
      icon={isExporting ? undefined : icon}
      loading={isExporting}
      onClick={handleClick}
    >
      {isExporting ? `Экспорт ${exportProgress}%` : children}
    </WayPayButton>
  );
};

export default ExportButton;
