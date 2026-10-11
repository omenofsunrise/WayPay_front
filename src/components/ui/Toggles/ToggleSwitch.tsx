import React from 'react';
import styled from 'styled-components';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Переключатель.
 *
 * Прежний не менял цвет: включённый и выключенный отличались только
 * положением точки, и состояние приходилось угадывать. Теперь дорожка
 * закрашивается, а кружок белый — как принято в системных переключателях.
 */
const Track = styled.label<{ $checked: boolean; $disabled?: boolean }>`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background-color: ${({ $checked }) =>
    $checked ? 'rgba(0, 125, 136, 1)' : '#cbd3dd'};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  transition: background-color 0.2s ease;
`;

const Knob = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.25);
  transition: transform 0.2s ease;
  transform: ${({ $checked }) =>
    $checked ? 'translateX(20px)' : 'translateX(0)'};
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <Track $checked={checked} $disabled={disabled}>
      <HiddenCheckbox
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <Knob $checked={checked} />
    </Track>
  );
};

export default ToggleSwitch;
