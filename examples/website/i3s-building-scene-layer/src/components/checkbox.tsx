import React from 'react';
import styled from 'styled-components';
import {Sublayer} from '../helpers/sublayers';

const CheckboxContainer = styled.div`
  display: inline-block;
  vertical-align: middle;
`;
const Icon = styled.svg`
  fill: none;
  stroke: white;
  stroke-width: 2px;
`;
const HiddenCheckbox = styled.input.attrs({type: 'checkbox'})`
  border: 0;
  clip: rect(0 0 0 0);
  clippath: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;
const StyledCheckbox = styled.div<{checked: boolean}>`
  display: inline-block;
  width: 22px;
  height: 22px;
  margin-right: 8px;
  background: ${({checked}) => (checked ? '#4F52CC' : '#0E111A')};
  border-radius: 4px;
  transition: all 150ms;
  box-shadow: 0 0 0 2px #4f52cc;

  ${Icon} {
    visibility: ${({checked}) => (checked ? 'visible' : 'hidden')};
  }
`;

type CheckboxProps = {
  id: string;
  value?: boolean;
  checked?: boolean;
  onChange: (sublayer: Sublayer) => void;
};

export const Checkbox = ({value, checked, onChange}: CheckboxProps) => (
  <CheckboxContainer>
    <HiddenCheckbox checked={checked} value={value} onChange={onChange} />
    <StyledCheckbox checked={checked}>
      <Icon viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </Icon>
    </StyledCheckbox>
  </CheckboxContainer>
);

export const CheckboxOption = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: wrap-content;
  padding-bottom: 8px;
`;

export const CheckboxSpan = styled.span`
  margin-left: 5px;
  cursor: pointer;
`;
