import React from 'react';
import styled from 'styled-components';
import {COLOR, FLEX} from './styles';
import {DropDown} from './drop-down';

const Container = styled.div`
  ${FLEX}
  ${COLOR}
  gap: 10px;
  padding: 16px;
  margin: 10px;
  line-height: 28px;
  border-radius: 8px;
`;

type ControlPanelProps = {
  tileSets: string[];
  onSelectTileset: (item: string) => void;
};

export const ControlPanel = ({tileSets, onSelectTileset}: ControlPanelProps) => {
  return (
    <Container>
      <DropDown items={tileSets} onSelect={onSelectTileset} />
    </Container>
  );
};
