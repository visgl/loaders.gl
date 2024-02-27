import React from 'react';
import styled from 'styled-components';
import {COLOR, FONT} from './styles';

const StyledDropDown = styled.select`
  ${COLOR}
  ${FONT}
  width: 200px;
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
    background: #0e111a;
    display: flex;
    white-space: pre;
  }
  &:hover {
    background: #4f52cc;
    color: black;
  }
`;

type DropDownProps = {
  items: (string | number)[];
  onSelect: (item: string) => void;
};

export const DropDown = ({items, onSelect}: DropDownProps) => {
  return (
    <StyledDropDown onChange={(evt) => onSelect(evt.target.value)}>
      {items.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </StyledDropDown>
  );
};
