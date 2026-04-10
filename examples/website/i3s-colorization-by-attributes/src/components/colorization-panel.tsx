import React from 'react';
import styled from 'styled-components';
import {COLOR, FLEX, FONT} from './styles';
import {DropDown} from './drop-down';

const Container = styled.div`
  ${FLEX}
  ${COLOR}
  top: 70px;
  gap 10px;
  padding: 16px;
  margin: 10px;
  line-height: 28px;
  border-radius: 8px;
`;

const RowWrapper = styled.div`
  display: flex;
  direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const Label = styled.div`
  ${FONT}
  margin-right: 10px;
`;

type ColorizationPanelProps = {
  colorizeModes: string[];
  colorizeAttributes: Record<string, {min: number; max: number}>;
  onSelectColorizeMode: (item: string) => void;
  onSelectAttribute: (item: string) => void;
};

export function ColorizationPanel({
  colorizeModes,
  colorizeAttributes,
  onSelectColorizeMode,
  onSelectAttribute
}: ColorizationPanelProps) {
  return (
    <Container>
      <RowWrapper>
        <Label>Colorize Mode</Label>
        <DropDown items={colorizeModes} onSelect={onSelectColorizeMode} />
      </RowWrapper>
      <RowWrapper>
        <Label>Colorize Attribute</Label>
        <DropDown items={Object.keys(colorizeAttributes)} onSelect={onSelectAttribute} />
      </RowWrapper>
    </Container>
  );
}
