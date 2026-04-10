import React from 'react';
import styled from 'styled-components';
import {Color, Font} from './styles';

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

const StyledDropDown = styled.select`
  ${Color}
  ${Font}
  ${DropDownStyle}
  width: 167px;
  margin-left: 8px;
  margin-bottom: 8px;
`;

type DropDownProps = {
  items: (string | number)[];
  onSelect: (item: string) => void;
};

export function DropDown({items, onSelect}: DropDownProps) {
  return (
    <StyledDropDown onChange={(evt) => onSelect(evt.target.value)}>
      {items.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </StyledDropDown>
  );
}
