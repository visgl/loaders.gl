import React, { useState } from 'react';
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
`;

interface ControlPanelProps {
  onFileSelected: (files: string) => void;
}

export const ControlPanel = ({onFileSelected}: ControlPanelProps) => {
  const [url, setUrl] = useState<string>('')
  return (
    <Container>
      <input
        type="text"
        value={url}
        onChange={(ev) => setUrl(ev.target.value)}
      />
      <button
        onClick={() => onFileSelected(url)}
      >
        Show  
      </button>
    </Container>
  );
};
