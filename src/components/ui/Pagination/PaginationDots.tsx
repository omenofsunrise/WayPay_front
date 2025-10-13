import styled from 'styled-components';

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
  className?: string;
  onClick?: (index: number) => void;
}

interface DotProps {
  $isActive: boolean;
  $isVertical?: boolean;
}

const DotsContainer = styled.div<{ $isVertical?: boolean }>`
  display: flex;
  flex-direction: ${props => props.$isVertical ? 'column' : 'row'};
  gap: 8px;
  align-items: center;
  justify-content: center;
`;

const Dot = styled.div<DotProps>`
  width: ${props => {
    if (props.$isVertical) {
      return '8px';
    }
    return props.$isActive ? '16px' : '8px';
  }};
  height: ${props => {
    if (props.$isVertical) {
      return props.$isActive ? '16px' : '8px';
    }
    return '8px';
  }};
  border-radius: 4px;
  background-color: rgba(37, 203, 161, 1);
  opacity: ${props => props.$isActive ? 1 : 0.4};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    opacity: ${props => props.$isActive ? 1 : 0.7};
  }
`;

const PaginationDots: React.FC<PaginationDotsProps> = ({ 
  count, 
  activeIndex, 
  className,
  onClick 
}) => {
  const isVertical = className?.includes('vertical');
  
  return (
    <DotsContainer 
      className={className}
      $isVertical={isVertical}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Dot
          key={index}
          $isActive={index === activeIndex}
          $isVertical={isVertical}
          onClick={() => onClick?.(index)}
        />
      ))}
    </DotsContainer>
  );
};

export default PaginationDots;