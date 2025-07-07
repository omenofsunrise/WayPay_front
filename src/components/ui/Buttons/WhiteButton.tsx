import React from 'react';

interface WhiteButtonProps {
  text: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

const WhiteButton: React.FC<WhiteButtonProps> = ({
  text,
  onClick,
  style = {},
  type = 'button',
}) => {
  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid rgba(209, 213, 219, 1)',
    color: 'rgba(0, 125, 136, 1)',
    borderRadius: '10px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    width: '100%',
    transition: 'all 0.3s ease',
    transform: 'scale(1)',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    outline: 'none',
    ...style,
  };

  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  const dynamicStyle = {
    ...buttonStyle,
    ...(isHovered && {
      backgroundColor: 'rgba(0, 125, 136, 0.05)',
      borderColor: 'rgba(0, 125, 136, 0.5)',
    }),
    ...(!isHovered && {
      borderColor: 'rgba(209, 213, 219, 1)',
    }),
    ...(isActive && {
      transform: 'scale(0.98)',
      backgroundColor: 'rgba(0, 125, 136, 0.1)',
    }),
    ':focus-visible': {
      outline: '2px solid rgba(0, 125, 136, 0.5)',
      outlineOffset: '2px',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={dynamicStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      {text}
    </button>
  );
};

export default WhiteButton;