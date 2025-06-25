import styled from "styled-components";

const ShowAllButton = styled.button`
  background: none;
  border: none;
  color: rgba(0, 125, 136, 1);
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
  text-decoration: underline;
  width: 100%;
  text-align: center;
  padding: 8px 0;
  transition: color 0.2s;

  &:hover {
    color: #0056b3;
  }
`;

export default ShowAllButton;