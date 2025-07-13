import styled from "styled-components";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    children: React.ReactNode;
}

export const ContextMenu = ({ x, y, onClose, children }: ContextMenuProps) => {
    return (
        <>
            <Backdrop onClick={onClose} />
            <MenuContainer style={{ left: x, top: y }}>
                {children}
            </MenuContainer>
        </>
    );
};

export const MenuItem = styled.div<{ danger?: boolean }>`
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: ${props => props.danger ? '#ff4d4f' : '#333'};
    
    &:hover {
        background-color: #f5f5f5;
    }
    
    svg {
        font-size: 16px;
    }
`;

const Backdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
`;

const MenuContainer = styled.div`
    position: fixed;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    min-width: 160px;
    padding: 4px 0;
`;