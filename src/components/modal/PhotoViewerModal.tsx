import React, { useState } from 'react';
import styled from 'styled-components';

interface PhotoViewerModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ 
  images, 
  initialIndex, 
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <ModalOverlay 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </CloseButton>
        
        <ImageContainer>
          <NavButton $position="left" onClick={handlePrev}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </NavButton>
          
          <Image 
            src={images[currentIndex]} 
            alt={`Photo ${currentIndex + 1}`} 
          />
          
          <NavButton $position="right" onClick={handleNext}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </NavButton>
        </ImageContainer>
        
        <Pagination>
          {images.map((_, index) => (
            <PaginationDot 
              key={index} 
              $active={index === currentIndex}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </Pagination>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  outline: none;
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 10;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 4px;
`;

interface NavButtonProps {
  $position: 'left' | 'right';
}

const NavButton = styled.button<NavButtonProps>`
  position: absolute;
  ${({ $position }) => $position}: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  opacity: 0.8;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.9);
  }
  
  svg {
    width: 32px;
    height: 32px;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    ${({ $position }) => $position}: 10px;
    
    svg {
      width: 64px;
      height: 64px;
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 20px;
`;

interface PaginationDotProps {
  $active: boolean;
}

const PaginationDot = styled.div<PaginationDotProps>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ $active }) => $active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #ffffff;
  }
`;

export default PhotoViewerModal;