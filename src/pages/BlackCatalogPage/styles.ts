import styled from "styled-components";
import CountInfoTitle from "../../components/ui/Text/CountInfoTitle";

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
  }
`;

export const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #007d88;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    stroke: white;
  }
`;

export const StickyHeader = styled(TitleContainer)`
  position: sticky;
  top: 0;
  z-index: 11;
  padding: 12px 0;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: 8px 0;
  }
`;

export const HeaderTitleGroup = styled(TitleContainer)`
  max-width: none;
  width: auto;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
  padding: 15px;
`;

export const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

export const EmptyStateTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
`;

export const EmptyStateText = styled.p`
  font-size: 16px;
  margin-bottom: 24px;
  max-width: 500px;
  line-height: 1.5;
`;

export const StyledCountInfo = styled(CountInfoTitle)`
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

export const WildInputContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  display: flex;
  align-items: center;
`;

export const ClearSearchButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #333;
    background-color: #f0f0f0;
  }

  &:focus {
    outline: none;
  }
`;

export const RealVersionLink = styled.a`
  color: #007d88;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px dashed #007d88;

  &:hover {
    color: #005f66;
    border-bottom: 1px solid #005f66;
  }
`;

export const ReadOnlyModeIndicator = styled.div`
  background: #ff6b6b;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  margin: 10px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const TotalCountBadge = styled.div`
  padding: 8px 16px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
`;

export const ActionBlockedMessage = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  background: #ff6b6b;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
