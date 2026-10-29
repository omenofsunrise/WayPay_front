import styled from "styled-components";

type ConfirmationStatusBadgeProps = {
  confirmed: boolean;
};

const ConfirmationStatusBadge = ({
  confirmed,
}: ConfirmationStatusBadgeProps) => (
  <Badge $confirmed={confirmed}>
    <StatusIcon viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" />
      {confirmed ? (
        <path d="m4.5 7.1 1.6 1.6 3.5-3.6" />
      ) : (
        <path d="M7 3.8v3.4l2.2 1.3" />
      )}
    </StatusIcon>
    {confirmed ? "Подтверждено" : "Ожидает подтверждения"}
  </Badge>
);

const Badge = styled.span<{ $confirmed: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: ${({ $confirmed }) => ($confirmed ? "#dcf7f0" : "#fff3df")};
  color: ${({ $confirmed }) => ($confirmed ? "#087f6a" : "#b96700")};
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
`;

const StatusIcon = styled.svg`
  display: block;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.35;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export default ConfirmationStatusBadge;
