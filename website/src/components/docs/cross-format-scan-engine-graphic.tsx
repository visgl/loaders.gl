import React, {type ReactNode} from 'react';
import styled from 'styled-components';

const sources = ['Iceberg', 'Delta', 'Parquet', 'ORC', 'Avro', 'FlatGeobuf'];
const scanSteps = ['catalog + metadata', 'prune files', 'range read', 'Arrow batches'];

/** Renders the browser-native scan path shared by table and file formats. */
export function CrossFormatScanEngineGraphic(): ReactNode {
  return (
    <GraphicFrame aria-label="Cross-format browser scan engine">
      <GraphicHeading>One browser-native scan path</GraphicHeading>
      <GraphicDescription>
        Table metadata and file formats converge on the same selective, range-aware Arrow output.
      </GraphicDescription>
      <Diagram>
        <SourceColumn>
          <ColumnLabel>Sources</ColumnLabel>
          <SourceGrid>
            {sources.map(source => <SourceCard key={source}>{source}</SourceCard>)}
          </SourceGrid>
        </SourceColumn>
        <Connector aria-hidden="true">→</Connector>
        <EngineColumn>
          <ColumnLabel>Shared scan engine</ColumnLabel>
          <StepGrid>
            {scanSteps.map((step, index) => (
              <StepCard key={step}>
                <StepNumber>{index + 1}</StepNumber>
                {step}
              </StepCard>
            ))}
          </StepGrid>
        </EngineColumn>
        <Connector aria-hidden="true">→</Connector>
        <OutputColumn>
          <ColumnLabel>Application output</ColumnLabel>
          <OutputCard>Arrow tables</OutputCard>
          <OutputCard>GeoArrow / GPU</OutputCard>
        </OutputColumn>
      </Diagram>
    </GraphicFrame>
  );
}

const GraphicFrame = styled.section`
  margin: 2rem 0;
  padding: 1.25rem;
  border: 1px solid #d8e2ec;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fbff, #ffffff);
`;

const GraphicHeading = styled.h3`
  margin: 0;
  color: #19324d;
`;

const GraphicDescription = styled.p`
  margin: 0.35rem 0 1.1rem;
  color: #53677b;
`;

const Diagram = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.6fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const SourceColumn = styled.div``;
const EngineColumn = styled.div``;
const OutputColumn = styled.div``;

const ColumnLabel = styled.div`
  margin-bottom: 0.5rem;
  color: #668096;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SourceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
`;

const SourceCard = styled.div`
  padding: 0.55rem 0.65rem;
  border: 1px solid #b9d3e7;
  border-radius: 8px;
  background: #eaf5ff;
  color: #244863;
  font-size: 0.85rem;
  text-align: center;
`;

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StepCard = styled.div`
  display: flex;
  min-height: 4.2rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid #9ec7e7;
  border-radius: 8px;
  background: #f0f8ff;
  color: #244863;
  font-size: 0.76rem;
  text-align: center;
`;

const StepNumber = styled.span`
  display: grid;
  width: 1.35rem;
  height: 1.35rem;
  place-items: center;
  border-radius: 50%;
  background: #367da9;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
`;

const OutputCard = styled.div`
  margin-bottom: 0.45rem;
  padding: 0.75rem;
  border: 1px solid #b9d3e7;
  border-radius: 8px;
  background: #edf9f5;
  color: #245746;
  font-size: 0.85rem;
  text-align: center;
`;

const Connector = styled.div`
  color: #6f879b;
  font-size: 1.7rem;
  font-weight: 300;

  @media (max-width: 700px) {
    transform: rotate(90deg);
  }
`;
