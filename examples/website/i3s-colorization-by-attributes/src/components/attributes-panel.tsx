import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

import type {StatisticsInfo} from '@loaders.gl/i3s';

import StatisticsIcon from '../icons/statistics.svg?react';
import ArrowLeft from '../icons/arrow-left.svg?react';
import {ColorsByAttribute, FeatureAttributes} from '../types';

import {CloseButton} from './close-button';
import {AttributeStats} from './attributes-stats/attribute-stats';

const BG_COLOR = '#0E111A';
const ITEM_BG_COLOR = '#232430';
const ITEM_BG_HOVER_COLOR = '#393A45';
const ITEM_ICON_HOVER_COLOR = '#605DEC';
const SPLITLINE_BORDER_COLOR = '#393A45';

export const AttributesSidePanelWrapper = styled.div`
  position: absolute;
  z-index: 2;
  height: 100%;
  top: 80px;
  left: 10px;
`;

type RowProps = {
  selectable: boolean;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-items: center;
  background: ${BG_COLOR};
  flex-flow: column;
  width: 370px;
  height: auto;
  min-height: 120px;
  z-index: 16;
  word-break: break-word;
  border-radius: 8px;
  box-shadow: 0px 17px 80px rgba(0, 0, 0, 0.1);
  max-height: calc(100% - 90px);
  padding: 0 16px;
`;

const HeaderWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const Title = styled.div`
  color: white;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  margin: 20px 0px;
`;

const ContentWrapper = styled.div`
  overflow-y: auto;
  margin-bottom: 20px;
  width: 100%;
`;

const Row = styled.div<RowProps>`
  display: grid;
  grid-template-columns: 1fr 1fr 24px;
  align-items: center;
  border-radius: 8px;
  background: ${ITEM_BG_COLOR};
  padding: 10px 13px;
  margin-bottom: 4px;
  cursor: ${({selectable}) => (selectable ? 'pointer' : 'auto')};

  svg {
    fill: white;
  }

  &:hover {
    background: ${ITEM_BG_HOVER_COLOR};
  }

  &:hover svg {
    fill: ${ITEM_ICON_HOVER_COLOR};
    opacity: 1;
  }
`;

const RowItem = styled.div`
  display: flex;
  max-width: 80%;
  align-items: center;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: white;

  :nth-child(1) {
    font-weight: 500;
  }

  :nth-child(2n) {
    opacity: 0.8;
  }
`;

const SplitLine = styled.div`
  margin-bottom: 16px;
  width: 100%;
  border-bottom: 1px solid ${SPLITLINE_BORDER_COLOR};
`;

const BackButton = styled(ArrowLeft)`
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const NO_DATA = 'No Data';
const STATISTICS_TITLE = 'Statistics';

type AttributesPanelProps = {
  title: string;
  tilesetName: string;
  attributes: FeatureAttributes | null;
  tilesetBasePath: string;
  statisticsInfo: StatisticsInfo[] | null;
  colorsByAttribute: ColorsByAttribute | null;
  onClose: () => void;
  onColorsByAttributeChange: (colorsByAttribute: ColorsByAttribute | null) => void;
};

export function AttributesPanel({
  title,
  tilesetName,
  attributes,
  statisticsInfo,
  tilesetBasePath,
  colorsByAttribute,
  onClose,
  onColorsByAttributeChange
}: AttributesPanelProps) {
  const [selectedAttributeStatsInfo, setSelectedAttributeStatsInfo] =
    useState<StatisticsInfo | null>(null);
  const [selectedAttributeName, setSelectedAttributeName] = useState('');

  useEffect(() => {
    setSelectedAttributeStatsInfo(null);
  }, [attributes]);

  function handleRowClick(attributeName: string, statisticsInfo: StatisticsInfo | null): void {
    setSelectedAttributeName(attributeName);
    setSelectedAttributeStatsInfo(statisticsInfo);
  }

  function renderRows() {
    const rows: any[] = [];

    for (const attributeName in attributes) {
      const attributeValue = formatValue(attributes[attributeName]);
      const attributeStatisticInfo =
        statisticsInfo?.find((stat) => stat.name === attributeName) || null;
      const row = renderItemRow(attributeName, attributeValue, attributeStatisticInfo);
      rows.push(row);
    }

    return rows;
  }

  function renderItemRow(
    key: string,
    value: string,
    attributeStatisticInfo: StatisticsInfo | null
  ) {
    return (
      <Row
        key={key}
        selectable={Boolean(attributeStatisticInfo)}
        onClick={() => handleRowClick(key, attributeStatisticInfo)}
      >
        <RowItem>{key}</RowItem>
        <RowItem>{value}</RowItem>
        {attributeStatisticInfo && <StatisticsIcon />}
      </Row>
    );
  }

  function formatValue(value) {
    return (
      String(value)
        .replace(/[{}']+/g, '')
        .trim() || NO_DATA
    );
  }

  return (
    <Container>
      <HeaderWrapper>
        {selectedAttributeStatsInfo && (
          <BackButton
            data-testid="attributes-panel-back-button"
            fill={'white'}
            onClick={() => setSelectedAttributeStatsInfo(null)}
          />
        )}
        <Title>{(selectedAttributeStatsInfo && STATISTICS_TITLE) || title}</Title>
        <CloseButton id="attributes-panel-close-button" onClick={onClose} />
      </HeaderWrapper>
      <SplitLine />
      {!selectedAttributeStatsInfo && <ContentWrapper>{renderRows()}</ContentWrapper>}
      {selectedAttributeStatsInfo && (
        <AttributeStats
          attributeName={selectedAttributeName}
          statisticsInfo={selectedAttributeStatsInfo}
          tilesetName={tilesetName}
          tilesetBasePath={tilesetBasePath}
          colorsByAttribute={colorsByAttribute}
          onColorsByAttributeChange={onColorsByAttributeChange}
        />
      )}
    </Container>
  );
}
