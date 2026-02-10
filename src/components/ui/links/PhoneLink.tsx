import styled from 'styled-components';

export const PHONE_LINK_COLOR = '#007D88';

const PhoneLink = styled.a`
  color: ${PHONE_LINK_COLOR};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    opacity: 0.9;
  }
`;

export default PhoneLink;
