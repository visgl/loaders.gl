import React from 'react';
import styled from 'styled-components';
import {Color, Flex} from './styles';
import {DropDown} from './drop-down';

const Container = styled.div`
  ${Flex}
  ${Color}
  gap: 10px;
  padding: 16px;
  margin: 10px;
  line-height: 28px;
  background: #0e111a;
  border-radius: 8px;
  z-index: 15;
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
