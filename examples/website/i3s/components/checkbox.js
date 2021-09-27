import React from 'react';
import styled from 'styled-components';

const CheckboxContainer = styled.div`
  display: inline-block;
  vertical-align: middle;
  cursor: ${(props) => (props.disabled ? 'auto' : 'pointer')}};
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
const StyledCheckbox = styled.div`
  display: inline-block;
  width: 22px;
  height: 22px;
  margin-right: 8px;
  background: ${(props) => (props.checked ? '#4F52CC' : '#0E111A')};
  border: ${(props) => (props.disabled ? '1px solid rgba(255,255,255, .6)' : '1px solid #4F52CC')};
  border-radius: 4px;
  transition: all 150ms;

  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 0 2px #4f52cc;
  }

  ${Icon} {
    visibility: ${(props) => (props.checked ? 'visible' : 'hidden')};
  }
`;
export const Checkbox = ({checked, ...props}) => (
  <CheckboxContainer disabled={props.disabled}>
    <HiddenCheckbox checked={checked} {...props} />
    <StyledCheckbox disabled={props.disabled} checked={checked}>
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
  width: 246px;
  padding-bottom: 8px;
`;

export const CheckboxSpan = styled.span`
  margin-left: 5; 
  cursor: pointer;
`;
