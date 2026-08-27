import React, {type ReactNode} from 'react';
import styled from 'styled-components';

/**
 * Renders the browser-native scan engine as a format-neutral pipeline with format-specific readers.
 */
export function CrossFormatScanEngineGraphic(): ReactNode {
  return (
    <GraphicFrame aria-label="Browser-native cross-format analytical scan engine architecture">
      <DiagramTitle>Browser-native cross-format scan engine</DiagramTitle>
      <DiagramIntro>
        One bounded scan pipeline coordinates remote files and emits Arrow batches while each format
        keeps its own physical decoder.
      </DiagramIntro>

      <PipelineDiagram>
        <LayerCard $variant="application">
          <LayerTitle>Visualization application</LayerTitle>
          <LayerItems>
            <LayerItem>Viewport / query</LayerItem>
            <LayerItem>Columns + filter</LayerItem>
            <LayerItem>Render target</LayerItem>
          </LayerItems>
        </LayerCard>
        <ArrowConnector aria-hidden="true">↓</ArrowConnector>
        <LayerCard $variant="planner">
          <LayerTitle>Iceberg table planner</LayerTitle>
          <LayerItems>
            <LayerItem>Snapshot selection</LayerItem>
            <LayerItem>Manifest discovery</LayerItem>
            <LayerItem>Partition pruning</LayerItem>
          </LayerItems>
        </LayerCard>
        <ArrowConnector aria-hidden="true">↓</ArrowConnector>
        <LayerCard $variant="engine">
          <LayerTitle>Shared scan engine</LayerTitle>
          <EngineGrid>
            <EngineItem>File discovery</EngineItem>
            <EngineItem>Projection</EngineItem>
            <EngineItem>Predicate AST</EngineItem>
            <EngineItem>Bounded tasks</EngineItem>
            <EngineItem>Range access</EngineItem>
            <EngineItem>Batch scheduling</EngineItem>
          </EngineGrid>
        </LayerCard>
        <ArrowConnector aria-hidden="true">↓</ArrowConnector>
        <FormatGroup>
          <FormatIntro>Format-specific readers</FormatIntro>
          <FormatGrid>
            <FormatCard $variant="parquet">
              <FormatName>Parquet</FormatName>
              <FormatDetail>row groups · pages · indexes</FormatDetail>
            </FormatCard>
            <FormatCard $variant="avro">
              <FormatName>Avro</FormatName>
              <FormatDetail>blocks · schemas · records</FormatDetail>
            </FormatCard>
            <FormatCard $variant="orc">
              <FormatName>ORC</FormatName>
              <FormatDetail>stripes · streams · indexes</FormatDetail>
            </FormatCard>
            <FormatCard $variant="future">
              <FormatName>Lance · Vortex</FormatName>
              <FormatDetail>native storage adapters</FormatDetail>
            </FormatCard>
          </FormatGrid>
        </FormatGroup>
        <ArrowConnector aria-hidden="true">↓</ArrowConnector>
        <LayerCard $variant="output">
          <LayerTitle>Common analytical result</LayerTitle>
          <OutputRow>
            <OutputBlock>Arrow batches</OutputBlock>
            <OutputBlock>Zero-copy paths</OutputBlock>
            <OutputBlock>Application / GPU</OutputBlock>
          </OutputRow>
        </LayerCard>
        <ArrowConnector aria-hidden="true">↓</ArrowConnector>
        <LayerCard $variant="browser">
          <LayerTitle>Browser-native runtime</LayerTitle>
          <LayerItems>
            <LayerItem>Fetch + HTTP Range</LayerItem>
            <LayerItem>Workers + cancellation</LayerItem>
            <LayerItem>Typed arrays</LayerItem>
          </LayerItems>
        </LayerCard>
      </PipelineDiagram>

      <DiagramCaption>
        Iceberg sits above the scan engine as a table-planning layer: snapshots and manifests select
        files, then the matching reader performs the scan.
      </DiagramCaption>
    </GraphicFrame>
  );
}

const GraphicFrame = styled.div`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  margin: 28px 0;
  overflow-x: auto;
  padding: 22px;
`;

const DiagramTitle = styled.h2`
  font-size: 20px;
  margin: 0;
`;

const DiagramIntro = styled.p`
  color: var(--ifm-color-gray-700);
  margin: 8px 0 18px;
  max-width: 760px;
`;

const PipelineDiagram = styled.div`
  display: grid;
  gap: 10px;
  justify-items: center;
  min-width: 680px;
`;

const ArrowConnector = styled.div`
  color: var(--ifm-color-gray-600);
  font-size: 22px;
  font-weight: 800;
  height: 22px;
  line-height: 22px;
`;

const LayerCard = styled.section<{$variant: 'application' | 'browser' | 'engine' | 'output' | 'planner'}>`
  background: ${props => getLayerBackground(props.$variant)};
  border: 1px solid ${props => getLayerBorder(props.$variant)};
  border-radius: 8px;
  padding: 12px;
  width: min(100%, 720px);
`;

const LayerTitle = styled.h3`
  color: var(--ifm-color-gray-900);
  font-size: 15px;
  margin: 0 0 10px;
  text-align: center;
`;

const LayerItems = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const LayerItem = styled.div`
  background: var(--ifm-color-white);
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  color: var(--ifm-color-gray-800);
  font-size: 13px;
  font-weight: 700;
  padding: 9px 8px;
  text-align: center;
`;

const EngineItem = styled(LayerItem)``;

const EngineGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const FormatGroup = styled.section`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  padding: 12px;
  width: min(100%, 720px);
`;

const FormatIntro = styled.h3`
  color: var(--ifm-color-gray-800);
  font-size: 14px;
  margin: 0 0 10px;
  text-align: center;
`;

const FormatGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
`;

const FormatCard = styled.div<{$variant: 'avro' | 'future' | 'orc' | 'parquet'}>`
  background: ${props => getFormatBackground(props.$variant)};
  border: 1px solid ${props => getFormatBorder(props.$variant)};
  border-radius: 8px;
  display: grid;
  gap: 7px;
  min-height: 82px;
  padding: 10px 8px;
  place-content: center;
  text-align: center;
`;

const FormatName = styled.div`
  color: var(--ifm-color-gray-900);
  font-size: 14px;
  font-weight: 800;
`;

const FormatDetail = styled.div`
  color: var(--ifm-color-gray-800);
  font-size: 11px;
  line-height: 1.25;
`;

const OutputRow = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const OutputBlock = styled.div`
  background: rgba(76, 175, 80, 0.12);
  border: 1px solid rgba(76, 175, 80, 0.55);
  border-radius: 8px;
  color: var(--ifm-color-gray-900);
  font-size: 13px;
  font-weight: 800;
  padding: 9px 8px;
  text-align: center;
`;

const DiagramCaption = styled.p`
  color: var(--ifm-color-gray-700);
  font-size: 13px;
  margin: 18px 0 0;
`;

function getLayerBackground(variant: 'application' | 'browser' | 'engine' | 'output' | 'planner'): string {
  switch (variant) {
    case 'application':
      return 'rgba(156, 39, 176, 0.1)';
    case 'browser':
      return 'rgba(96, 125, 139, 0.12)';
    case 'engine':
      return 'rgba(0, 173, 230, 0.12)';
    case 'output':
      return 'rgba(76, 175, 80, 0.1)';
    case 'planner':
      return 'rgba(255, 193, 7, 0.14)';
  }
}

function getLayerBorder(variant: 'application' | 'browser' | 'engine' | 'output' | 'planner'): string {
  const colors = {
    application: 'rgba(156, 39, 176, 0.42)',
    browser: 'rgba(96, 125, 139, 0.5)',
    engine: 'rgba(0, 173, 230, 0.7)',
    output: 'rgba(76, 175, 80, 0.55)',
    planner: 'rgba(255, 193, 7, 0.72)'
  };
  return colors[variant];
}

function getFormatBackground(variant: 'avro' | 'future' | 'orc' | 'parquet'): string {
  const colors = {
    avro: 'rgba(156, 39, 176, 0.1)',
    future: 'rgba(96, 125, 139, 0.1)',
    orc: 'rgba(255, 193, 7, 0.16)',
    parquet: 'rgba(63, 81, 181, 0.1)'
  };
  return colors[variant];
}

function getFormatBorder(variant: 'avro' | 'future' | 'orc' | 'parquet'): string {
  const colors = {
    avro: 'rgba(156, 39, 176, 0.42)',
    future: 'rgba(96, 125, 139, 0.45)',
    orc: 'rgba(255, 193, 7, 0.75)',
    parquet: 'rgba(63, 81, 181, 0.42)'
  };
  return colors[variant];
}
