import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: absolute;

  background: #0e111a;
  color: white;

  gap: 10px;
  padding: 16px;
  margin: 10px;
  line-height: 28px;
  border-radius: 8px;
  font-size: 13px;
`;

interface ControlPanelProps {
  onFileSelected: (files: File[]) => void;
}

export const ControlPanel = ({onFileSelected}: ControlPanelProps) => {
  return (
    <Container>
      <div>Choose *.slpk file from your filesystem</div>
      <input
        type="file"
        accept=".slpk"
        multiple={false}
        onChange={(ev) => onFileSelected(ev.target.files)}
      />
    </Container>
  );
};
