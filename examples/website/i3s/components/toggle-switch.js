import React from "react";
import styled from "styled-components";

const Input = styled.input`
  height: 0;
  width: 0;
  opacity: 0;
  z-index: -1;
`;

const Label = styled.label`
  position: absolute;
  margin-left: 220px;
  margin-bottom: 2px;
  font-size: 6px;
  width: 28px;
  height: 18px;
  border-radius: 8px;
  cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
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
  background-color: rgba(250, 250, 250, 0.2);
  transition: 0.4s;
  border-radius: 8px;
  &::after {
    color: white;
  }
  &::before {
    position: absolute;
    top: 2px;
    left: 2px;
    content: "";
    width: 13px;
    height: 13px;
    background-color: #FFFFFF;
    transition: 0.4s;
    border-radius: 8px;
  }

  ${Input}:checked + & {
    background: #4F52CC;
;
  }

  ${Input}:checked + &::before {
    -webkit-transform: translateX(11px);
    -ms-transform: translateX(11px);
    transform: translateX(11px);
  }
`;

export default function ToggleSwitch({
  checked,
  onChange,
  name,
  id,
  title
}) {
  return (
    <Label htmlFor={id} title={title}>
      <Input
        id={id}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        title={title}
      />
      <Slider />
    </Label>
  );
}
