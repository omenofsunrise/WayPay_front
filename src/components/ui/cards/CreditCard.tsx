import React from "react";
import { useAuth } from "../../../сontext/AuthContext";
import styled from "styled-components";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import type { Credit } from "../../../api/types/credit";
import { formatMoney } from "../../../utils/formatPrice";
import { formatDate } from "../../../utils/dateFormatter";

export type CreditCardField =
  | "totalClean"
  | "firstPayment"
  | "accured"
  | "payed"
  | "rest"
  | "debt"
  | "incomePercents"
  | "incomeRubles"
  | "employee";

export type CreditCardStatus =
  | "unconfirmed"
  | "active"
  | "overdue"
  | "closed"
  | "terminated";

interface CreditCardProps {
  credit: Credit;
  fields: CreditCardField[];
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onToggleSelect?: () => void;
  onToggleFavourite?: () => void;
  onActionMenu?: (e: React.MouseEvent) => void;
  // Доп. строка под заголовком (напр. в «Контроле» — сотрудник и доход),
  // чтобы раздел визуально отличался от «Договоров».
  subtitle?: React.ReactNode;
  // Переопределение заголовка карточки. По умолчанию — ФИО клиента
  // (в «Контроле договоров» сюда передаётся имя сотрудника).
  title?: React.ReactNode;
}

const FIELD_LABEL: Record<CreditCardField, string> = {
  totalClean: "Стоимость",
  firstPayment: "Аванс",
  accured: "Начислено",
  payed: "Уплачено",
  rest: "Остаток",
  debt: "Долг",
  incomePercents: "Доход, %",
  incomeRubles: "Доход, руб",
  employee: "Сотрудник",
};

const computeStatus = (
  credit: Credit,
  creditAcceptance: boolean
): CreditCardStatus => {
  // Неподтверждённый договор имеет наивысший приоритет — его нужно
  // визуально выделить, чтобы сразу было понятно, что требуется подтверждение
  // (так же, как в табличном режиме на CreditPage / CreditControlPage).
  //
  // Если подтверждение договоров выключено в настройках компании, делить их
  // на подтверждённые и нет незачем: показываем обычный статус.
  if (creditAcceptance && !credit.hasCounterApproved) return "unconfirmed";
  if (credit.terminated) return "terminated";
  if (!credit.isActive) return "closed";
  if ((credit.debt ?? 0) > 0) return "overdue";
  return "active";
};

const STATUS_PALETTE: Record<
  CreditCardStatus,
  { bg: string; border: string; color: string; label: string }
> = {
  unconfirmed: {
    bg: "#FFD6D6",
    border: "#EF4444",
    color: "#B91C1C",
    label: "Не подтверждён",
  },
  active: {
    bg: "#E0F2F1",
    border: "#009688",
    color: "#00695C",
    label: "Активный",
  },
  overdue: {
    bg: "#FFEBEE",
    border: "#E53935",
    color: "#B71C1C",
    label: "Просрочка",
  },
  closed: {
    bg: "#ECEFF1",
    border: "#78909C",
    color: "#455A64",
    label: "Закрыт",
  },
  terminated: {
    bg: "#F3E8FF",
    border: "#7C3AED",
    color: "#6B21A8",
    label: "Расторгнут",
  },
};

const fieldValue = (credit: Credit, field: CreditCardField): string => {
  switch (field) {
    case "totalClean":
      return `${formatMoney((credit.totalClean ?? 0).toString())}`;
    case "firstPayment":
      return `${formatMoney((credit.firstPayment ?? 0).toString())}`;
    case "accured":
      return `${formatMoney((credit.accured ?? 0).toString())}`;
    case "payed":
      return `${formatMoney((credit.payed ?? 0).toString())}`;
    case "rest":
      return `${formatMoney((credit.rest ?? 0).toString())}`;
    case "debt":
      return `${formatMoney((credit.debt ?? 0).toString())}`;
    case "incomePercents":
      return `${credit.incomePercents ?? 0}%`;
    case "incomeRubles":
      return `${formatMoney((credit.incomeRubles ?? 0).toString())}`;
    case "employee":
      return credit.employeeName || "—";
    default:
      return "—";
  }
};

const CreditCard: React.FC<CreditCardProps> = ({
  credit,
  fields,
  selected = false,
  highlighted = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  onToggleSelect,
  onToggleFavourite,
  onActionMenu,
  subtitle,
  title,
}) => {
  const { authInfo } = useAuth();
  const creditAcceptance = authInfo?.employee.creditAcceptance ?? true;
  const status = computeStatus(credit, creditAcceptance);
  const palette = STATUS_PALETTE[status];
  const isUnconfirmed = status === "unconfirmed";

  return (
    <Card
      $selected={selected}
      $highlighted={highlighted}
      $borderAccent={palette.border}
      $bg={isUnconfirmed ? palette.bg : undefined}
      $accentBorder={isUnconfirmed ? palette.border : undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <Header>
        {onToggleSelect && (
          <Checkbox
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggleSelect()}
          />
        )}

        <IconBadge>
          <DescriptionOutlinedIcon fontSize="small" />
        </IconBadge>

        <HeaderInfo>
          <TitleRow>
            <Title>{title ?? (credit.clientFullName || `№${credit.id}`)}</Title>
            {onToggleFavourite && (
              <FavButton
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavourite();
                }}
                title={
                  credit.isFavourite ? "Убрать из избранного" : "В избранное"
                }
              >
                {credit.isFavourite ? (
                  <StarRoundedIcon
                    fontSize="small"
                    style={{ color: "#F59E0B" }}
                  />
                ) : (
                  <StarBorderRoundedIcon
                    fontSize="small"
                    style={{ color: "#9CA3AF" }}
                  />
                )}
              </FavButton>
            )}
          </TitleRow>
          <MetaRow>
            <CalendarMonthOutlinedIcon style={{ fontSize: 14 }} />
            <span>{formatDate(credit.creditDate)}</span>
            <Sep>·</Sep>
            <span>№{credit.id}</span>
          </MetaRow>
          {subtitle && <SubtitleRow>{subtitle}</SubtitleRow>}
        </HeaderInfo>

        <StatusBadge
          $bg={palette.bg}
          $border={palette.border}
          $color={palette.color}
        >
          {palette.label}
        </StatusBadge>

        {onActionMenu && (
          <ActionButton
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActionMenu(e);
            }}
            title="Действия"
          >
            <MoreVertOutlinedIcon fontSize="small" />
          </ActionButton>
        )}
      </Header>

      {fields.length > 0 && (
        <Body>
          {fields.map((field) => (
            <Field key={field}>
              <FieldLabel>{FIELD_LABEL[field]}</FieldLabel>
              <FieldValue
                $emphasis={
                  field === "debt" && (credit.debt ?? 0) > 0
                    ? "danger"
                    : undefined
                }
              >
                {fieldValue(credit, field)}
              </FieldValue>
            </Field>
          ))}
        </Body>
      )}
    </Card>
  );
};

const Card = styled.div<{
  $selected: boolean;
  $highlighted: boolean;
  $borderAccent: string;
  $bg?: string;
  $accentBorder?: string;
}>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: ${(p) => p.$bg ?? "#fff"};
  border: 1px solid
    ${(p) => (p.$selected ? "#007D88" : p.$accentBorder ?? "#E5E7EB")};
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    border-radius: 12px 0 0 12px;
    background: ${(p) => p.$borderAccent};
    opacity: ${(p) => (p.$highlighted ? 1 : 0.65)};
  }

  &:hover {
    border-color: #007d88;
    background: #f3fbfa;
    box-shadow: 0 4px 12px rgba(0, 125, 136, 0.12);
    transform: translateY(-1px);
  }

  ${(p) =>
    p.$selected &&
    `
    background: #F0FDFA;
    box-shadow: 0 2px 8px rgba(0, 125, 136, 0.12);
  `}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: #007d88;
`;

const IconBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(0, 125, 136, 0.1);
  color: #007d88;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 2px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FavButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  line-height: 0;

  &:hover {
    transform: scale(1.1);
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #50555c;
  flex-wrap: wrap;
  min-width: 0;
`;

const Sep = styled.span`
  color: #cbd5e1;
`;

// Акцентная строка под мета-данными — выделяет специфику раздела
// (в «Контроле» — сотрудник/доход).
const SubtitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
  color: #0f766e;
  min-width: 0;
`;

const StatusBadge = styled.span<{
  $bg: string;
  $border: string;
  $color: string;
}>`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: ${(p) => p.$bg};
  border: 1px solid ${(p) => p.$border};
  color: ${(p) => p.$color};
  white-space: nowrap;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px 16px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const FieldLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const FieldValue = styled.span<{ $emphasis?: "danger" }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$emphasis === "danger" ? "#B91C1C" : "#111827")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export default CreditCard;
