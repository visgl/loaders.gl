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
  margin-top: 4px;
  margin-left: 180px;
  font-size: 6px;
  width: 4.8em;
  height: 1.8em;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(36, 39, 48);
  transition: 0.4s;
  border-radius: 10%;

  &::after {
    color: white;
  }
  &::before {
    position: absolute;
    content: "";
    height: 1.8em;
    width: 2em;
    background-color: #f2e9e4;
    transition: 0.4s;
    border-radius: 10%;
  }

  ${Input}:checked + & {
    background-color: #00ADE6;
  }

  ${Input}:checked + &::before {
    -webkit-transform: translateX(3em);
    -ms-transform: translateX(3em);
    transform: translateX(3em);
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
