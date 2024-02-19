import React from 'react';
import styled from 'styled-components';

const SWITCH_BG_HOVER_COLOR = '#616678';
const SWITCH_BG_DISABLED_COLOR = '#393A45';
const SWITCH_BG_CHECKED_COLOR = '#605DEC';
const SWITCH_BG_DISABLED_HOVER_COLOR = '#4744D3';

const Switch = styled.div`
  position: relative;
  width: 28px;
  height: 18px;
`;

const Input = styled.input`
  height: 0;
  width: 0;
  opacity: 0;
  z-index: -1;
`;

const Label = styled.label<{
  title?: string;
  htmlFor?: string;
}>`
  font-size: 6px;
  width: 28px;
  height: 18px;
  border-radius: 8px;
  cursor: pointer;
  ${Input} {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 1px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${SWITCH_BG_DISABLED_COLOR};
  transition: 0.4s;
  border-radius: 8px;
  &::after {
    color: white;
  }
  &::before {
    position: absolute;
    top: 2px;
    left: 2px;
    content: '';
    width: 13px;
    height: 13px;
    background-color: white;
    transition: 0.4s;
    border-radius: 8px;
  }
  &:hover {
    background-color: ${SWITCH_BG_HOVER_COLOR};
  }

  ${Input}:checked + & {
    background: ${SWITCH_BG_CHECKED_COLOR};
    &:hover {
      background: ${SWITCH_BG_DISABLED_HOVER_COLOR};
    }
  }

  ${Input}:checked + &::before {
    -webkit-transform: translateX(11px);
    -ms-transform: translateX(11px);
    transform: translateX(11px);
  }
`;

type ToggleSwitchProps = {
  checked: boolean;
  name?: string;
  id?: string;
  title?: string;
  onChange: () => void;
};

export function ToggleSwitch({
  checked,
  onChange,
  name = '',
  id = '',
  title = ''
}: ToggleSwitchProps) {
  return (
    <Switch>
      <Label htmlFor={id} title={title}>
        <Input
          id={id}
          type="checkbox"
          name={name}
          checked={checked}
          title={title}
          onChange={onChange}
        />
        <Slider />
      </Label>
    </Switch>
  );
}
