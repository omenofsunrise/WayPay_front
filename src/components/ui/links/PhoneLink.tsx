import styled from 'styled-components';

const PhoneLink = styled.a`
  color: var(--phone-link-color, #007d88);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    color: var(--phone-link-color-hover, #006a74);
    text-decoration: underline;
  }
`;

export default PhoneLink;
