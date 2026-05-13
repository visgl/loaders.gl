import React, {type ReactNode} from 'react';
import styled from 'styled-components';

const tableRows = ['RecordBatch', 'RecordBatch', 'RecordBatch'];
const tableColumns = ['Vector', 'Vector', 'Vector'];
const fieldDetails = ['name', 'Type', 'nullable', 'metadata'];
const dataDetails = ['type', 'length', 'nullCount', 'offset'];
const dataBuffers = ['validity', 'offsets', 'values'];
const dataTypeDetails = ['typeId', 'ArrayType', 'OffsetArrayType'];
const dataTypeParameters = ['bitWidth', 'precision', 'unit'];
const vectorDetails = ['type', 'length', 'stride'];

/**
 * Renders compact diagrams for the core Arrow JS table and schema object structures.
 */
export function ArrowJsStructureGraphic(): ReactNode {
  return (
    <GraphicFrame aria-label="Arrow JS table and schema structure diagrams">
      <DiagramSection>
        <DiagramTitle>Structure of Arrow Schema</DiagramTitle>
        <SchemaDiagram aria-label="Schema structure: a schema has metadata and fields, and each field has type, nullable, and metadata">
          <SchemaColumn>
            <ConnectedFieldsLabel>fields</ConnectedFieldsLabel>
            <NestedBlock>metadata</NestedBlock>
          </SchemaColumn>
          <FieldsGrid>
            {[0, 1, 2].map(fieldIndex => (
              <FieldCard key={fieldIndex}>
                <Block $variant="field">Field</Block>
                <FieldDetails>
                  {fieldDetails.map(detail => (
                    <FieldDetail key={detail}>{detail}</FieldDetail>
                  ))}
                </FieldDetails>
              </FieldCard>
            ))}
          </FieldsGrid>
        </SchemaDiagram>
      </DiagramSection>

      <DiagramSection>
        <DiagramTitle>Structure of an Arrow Table</DiagramTitle>
        <TableDiagram aria-label="Table structure: vectors contain data chunks across record batches">
          <GridSpacer />
          {tableColumns.map((columnLabel, columnIndex) => (
            <VectorCell key={`${columnLabel}-${columnIndex}`}>
              <Block $variant="vector">{columnLabel}</Block>
              <VerticalConnector />
            </VectorCell>
          ))}
          {tableRows.map((rowLabel, rowIndex) => (
            <React.Fragment key={`${rowLabel}-${rowIndex}`}>
              <Block $variant="recordBatch">{rowLabel}</Block>
              {tableColumns.map((columnLabel, columnIndex) => (
                <ConnectedDataCell key={`${rowIndex}-${columnLabel}-${columnIndex}`}>
                  <Block $variant="data">Data</Block>
                </ConnectedDataCell>
              ))}
            </React.Fragment>
          ))}
        </TableDiagram>
      </DiagramSection>

      <DiagramSection>
        <DiagramTitle>Structure of Arrow Vector</DiagramTitle>
        <VectorDiagram aria-label="Vector structure: a vector has type and length metadata plus data chunks">
          <Block $variant="vector">Vector</Block>
          <VectorGroups>
            <DataGroup>
              {vectorDetails.map(detail => (
                <NestedBlock key={detail}>{detail}</NestedBlock>
              ))}
            </DataGroup>
            <DataBufferList>
              <DataGroupTitle $variant="data">data</DataGroupTitle>
              <FieldDetail>Data</FieldDetail>
              <FieldDetail>Data</FieldDetail>
              <FieldDetail>Data</FieldDetail>
              <FieldDetail>...</FieldDetail>
            </DataBufferList>
          </VectorGroups>
        </VectorDiagram>
      </DiagramSection>

      <DiagramSection>
        <DiagramTitle>Structure of Arrow Data</DiagramTitle>
        <DataDiagram aria-label="Data structure: data has type and row metadata, buffers, and optional child data">
          <Block $variant="data">Data</Block>
          <DataGroups>
            <DataGroup>
              {dataDetails.map(detail => (
                <NestedBlock key={detail}>{detail}</NestedBlock>
              ))}
            </DataGroup>
            <DataGroup>
              <DataBufferList>
                <DataGroupTitle $variant="buffer">buffers</DataGroupTitle>
                {dataBuffers.map(buffer => (
                  <FieldDetail key={buffer}>{buffer}</FieldDetail>
                ))}
              </DataBufferList>
            </DataGroup>
            <DataGroup>
              <DataBufferList>
                <DataGroupTitle $variant="childData">childData</DataGroupTitle>
                <FieldDetail>Data</FieldDetail>
                <FieldDetail>Data</FieldDetail>
                <FieldDetail>...</FieldDetail>
              </DataBufferList>
            </DataGroup>
          </DataGroups>
        </DataDiagram>
      </DiagramSection>

      <DiagramSection>
        <DiagramTitle>Structure of Arrow Data Type</DiagramTitle>
        <DataTypeDiagram aria-label="Data type structure: a data type has identifiers, type-specific parameters, and optional child fields">
          <Block $variant="dataType">DataType</Block>
          <DataTypeGroups>
            <DataGroup>
              {dataTypeDetails.map(detail => (
                <NestedBlock key={detail}>{detail}</NestedBlock>
              ))}
            </DataGroup>
            <DataBufferList>
              <DataGroupTitle $variant="parameter">params</DataGroupTitle>
              {dataTypeParameters.map(parameter => (
                <FieldDetail key={parameter}>{parameter}</FieldDetail>
              ))}
              <FieldDetail>...</FieldDetail>
            </DataBufferList>
            <DataBufferList>
              <DataGroupTitle $variant="field">children</DataGroupTitle>
              <FieldDetail>Field</FieldDetail>
              <FieldDetail>Field</FieldDetail>
              <FieldDetail>Field</FieldDetail>
              <FieldDetail>...</FieldDetail>
            </DataBufferList>
          </DataTypeGroups>
        </DataTypeDiagram>
      </DiagramSection>
    </GraphicFrame>
  );
}

const GraphicFrame = styled.div`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  display: grid;
  gap: 28px;
  margin: 28px 0;
  overflow-x: auto;
  padding: 22px;
`;

const DiagramSection = styled.section`
  display: grid;
  gap: 14px;
  min-width: 560px;
`;

const DiagramTitle = styled.h2`
  font-size: 20px;
  margin: 0;
`;

const TableDiagram = styled.div`
  display: grid;
  gap: 12px 18px;
  grid-template-columns: minmax(128px, 0.8fr) repeat(3, minmax(96px, 1fr));
`;

const SchemaDiagram = styled.div`
  align-items: start;
  display: grid;
  gap: 22px;
  grid-template-columns: minmax(128px, 0.7fr) minmax(330px, 1.8fr);
`;

const DataDiagram = styled.div`
  align-items: start;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(128px, 0.45fr) minmax(410px, 1.8fr);
`;

const DataTypeDiagram = styled(DataDiagram)``;

const VectorDiagram = styled(DataDiagram)``;

const DataGroups = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  position: relative;

  &::before {
    background: var(--ifm-color-gray-500);
    content: '';
    height: 2px;
    left: -18px;
    position: absolute;
    top: 22px;
    width: 18px;
  }
`;

const DataTypeGroups = styled(DataGroups)``;

const VectorGroups = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(120px, 0.8fr) minmax(260px, 1.4fr);
  position: relative;

  &::before {
    background: var(--ifm-color-gray-500);
    content: '';
    height: 2px;
    left: -18px;
    position: absolute;
    top: 22px;
    width: 18px;
  }
`;

const DataGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const DataBufferList = styled.div`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 10px;
`;

const DataGroupTitle = styled.div<{$variant: 'buffer' | 'childData' | 'data' | 'field' | 'parameter'}>`
  align-items: center;
  background: ${props => getBlockBackground(props.$variant)};
  border: 1px solid ${props => getBlockBorder(props.$variant)};
  border-radius: 8px;
  color: var(--ifm-color-gray-900);
  display: flex;
  font-size: 14px;
  font-weight: 800;
  justify-content: center;
  min-height: 40px;
  padding: 9px 10px;
  text-align: center;
`;

const GridSpacer = styled.div``;

const VectorCell = styled.div`
  align-items: center;
  display: grid;
  gap: 6px;
  justify-items: center;
`;

const VerticalConnector = styled.div`
  background: var(--ifm-color-gray-500);
  height: 20px;
  width: 2px;
`;

const ConnectedDataCell = styled.div`
  position: relative;

  &::before {
    background: var(--ifm-color-gray-500);
    content: '';
    height: 2px;
    left: -18px;
    position: absolute;
    top: 50%;
    width: 18px;
  }
`;

const SchemaColumn = styled.div`
  display: grid;
  gap: 10px;
`;

const NestedBlock = styled.div`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  color: var(--ifm-color-gray-800);
  font-size: 13px;
  font-weight: 700;
  padding: 10px 12px;
`;

const ConnectedFieldsLabel = styled(NestedBlock)`
  position: relative;

  &::after {
    background: var(--ifm-color-gray-500);
    content: '';
    height: 2px;
    left: 100%;
    position: absolute;
    top: 50%;
    width: 22px;
  }
`;

const FieldsGrid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
`;

const FieldCard = styled.div`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 10px;
`;

const FieldDetails = styled.div`
  display: grid;
  gap: 6px;
`;

const FieldDetail = styled.div`
  background: var(--ifm-color-gray-100);
  border: 1px solid var(--ifm-color-gray-300);
  border-radius: 8px;
  color: var(--ifm-color-gray-800);
  font-size: 12px;
  font-weight: 700;
  padding: 7px 8px;
  text-align: center;
`;

const Block = styled.div<{
  $variant: 'buffer' | 'childData' | 'data' | 'dataType' | 'field' | 'recordBatch' | 'vector';
}>`
  align-items: center;
  background: ${props => getBlockBackground(props.$variant)};
  border: 1px solid ${props => getBlockBorder(props.$variant)};
  border-radius: 8px;
  color: ${props =>
    props.$variant === 'recordBatch' ? 'var(--ifm-color-primary-darkest)' : 'var(--ifm-color-gray-900)'};
  display: flex;
  font-size: 14px;
  font-weight: 800;
  justify-content: center;
  min-height: 44px;
  padding: 10px 12px;
  text-align: center;
`;

/**
 * Returns the visual fill color for one diagram block type.
 */
type BlockVariant = 'buffer' | 'childData' | 'data' | 'dataType' | 'field' | 'parameter' | 'recordBatch' | 'vector';

function getBlockBackground(variant: BlockVariant): string {
  switch (variant) {
    case 'recordBatch':
      return 'rgba(0, 173, 230, 0.12)';
    case 'vector':
      return 'rgba(76, 175, 80, 0.12)';
    case 'buffer':
      return 'rgba(255, 193, 7, 0.18)';
    case 'dataType':
      return 'rgba(63, 81, 181, 0.1)';
    case 'childData':
      return 'rgba(121, 85, 72, 0.1)';
    case 'field':
      return 'rgba(156, 39, 176, 0.1)';
    case 'parameter':
      return 'rgba(96, 125, 139, 0.12)';
    default:
      return 'var(--ifm-color-white)';
  }
}

/**
 * Returns the border color for one diagram block type.
 */
function getBlockBorder(variant: BlockVariant): string {
  switch (variant) {
    case 'recordBatch':
      return 'rgba(0, 173, 230, 0.7)';
    case 'vector':
      return 'rgba(76, 175, 80, 0.55)';
    case 'buffer':
      return 'rgba(255, 193, 7, 0.75)';
    case 'dataType':
      return 'rgba(63, 81, 181, 0.42)';
    case 'childData':
      return 'rgba(121, 85, 72, 0.42)';
    case 'field':
      return 'rgba(156, 39, 176, 0.42)';
    case 'parameter':
      return 'rgba(96, 125, 139, 0.45)';
    default:
      return 'var(--ifm-color-gray-400)';
  }
}
