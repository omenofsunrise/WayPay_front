import React from "react";
import { Form } from "react-bootstrap";
import styled from "styled-components";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tabIndex?: number;
}

const CustomPhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "8 (999) 500-50-50",
  tabIndex,
}) => {
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const withPrefix =
      cleaned.startsWith("8") || cleaned.length === 0 ? cleaned : `8${cleaned}`;
    const trimmed = withPrefix.slice(0, 11);

    let formattedValue = "";

    if (trimmed.length > 0) {
      formattedValue += "8";
    }
    if (trimmed.length > 1) {
      formattedValue += ` (${trimmed.slice(1, 4)}`;
    }
    if (trimmed.length > 4) {
      formattedValue += `) ${trimmed.slice(4, 7)}`;
    }
    if (trimmed.length > 7) {
      formattedValue += `-${trimmed.slice(7, 9)}`;
    }
    if (trimmed.length > 9) {
      formattedValue += `-${trimmed.slice(9, 11)}`;
    }

    return formattedValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    onChange(formattedPhone);
  };

  return (
    <StyledPhone
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={18}
      tabIndex={tabIndex}
    />
  );
};

const StyledPhone = styled(Form.Control)`
  height: auto;
  min-height: 38px;
  font-size: 14px;
  border: 1px solid rgba(156, 163, 175, 1);
  border-radius: 5px;
  padding: 5px 5px 5px 15px;
  color: black;
  background-color: white;
  box-shadow: none;
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    border-color: rgba(0, 125, 136, 1);
  }

  &:focus {
    border-color: rgba(0, 125, 136, 1);
    box-shadow: none;
    outline: none;
  }
`;

export default CustomPhoneInput;
