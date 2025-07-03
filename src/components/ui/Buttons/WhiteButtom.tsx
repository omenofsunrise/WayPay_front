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
    ...style,
  };

  return (
    <button type={type} onClick={onClick} style={buttonStyle}>
      {text}
    </button>
  );
};

export default WhiteButton;