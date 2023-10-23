export const DropDownStyle = `
  position: static;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  cursor: pointer;
  border-radius: 4px;
  box-sizing: border-box;
    option {
      color: white;
      background: #0E111A;
      display: flex;
      white-space: pre;
    }
  &:hover {
    background: #4F52CC;
    color: black;
  }
`;

export const Font = `
  font-family: 'Uber Move' sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 19px;
  letter-spacing: 0em;
  text-align: left;
`;

export const Flex = `
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: absolute;
`;

export const Color = `
  background: #0E111A;
  color: white;
`;
