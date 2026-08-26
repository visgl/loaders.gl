import React, {useEffect, useId, useState} from 'react';
import styled from 'styled-components';
import type {ScanQueryMetadata} from '@loaders.gl/loader-utils';

/** State emitted by the reusable scan-query controls. */
export type ScanQueryPanelState = Readonly<{
  /** Output columns; an empty selection means all columns. */
  columns?: readonly string[];
  /** Maximum number of rows to return. */
  limit?: number;
  /** Optional source-coordinate bounding box in minX, minY, maxX, maxY order. */
  boundingBox?: readonly [number, number, number, number];
  /** Optional raster overview or point-cloud minimum hierarchy level. */
  level?: number;
  /** Optional point-cloud maximum hierarchy level. */
  maximumLevel?: number;
  /** Optional point-cloud target spacing. */
  targetSpacing?: number;
}>;

/** Props for a source-neutral query-parameter panel. */
export type ScanQueryPanelProps = Readonly<{
  /** Metadata discovered from the active source. */
  metadata?: ScanQueryMetadata;
  /** Whether metadata discovery is still in progress. */
  loading?: boolean;
  /** Current query values to show in the controls. */
  value?: ScanQueryPanelState;
  /** Called when the user submits the panel. */
  onApply: (value: ScanQueryPanelState) => void;
  /** Optional label shown above the controls. */
  title?: string;
}>;

/** Renders schema-driven projection, limit, and spatial controls for compatible scan sources. */
export function ScanQueryPanel({
  metadata,
  loading = false,
  value,
  onApply,
  title = 'Scan query'
}: ScanQueryPanelProps): JSX.Element {
  const panelId = useId().replace(/:/g, '');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(value?.columns ? [...value.columns] : []);
  const [limitText, setLimitText] = useState(value?.limit === undefined ? '' : String(value.limit));
  const [boundingBoxText, setBoundingBoxText] = useState(
    value?.boundingBox ? value.boundingBox.join(',') : ''
  );
  const [levelText, setLevelText] = useState(value?.level === undefined ? '' : String(value.level));
  const [maximumLevelText, setMaximumLevelText] = useState(
    value?.maximumLevel === undefined ? '' : String(value.maximumLevel)
  );
  const [targetSpacingText, setTargetSpacingText] = useState(
    value?.targetSpacing === undefined ? '' : String(value.targetSpacing)
  );

  useEffect(() => {
    setSelectedColumns(value?.columns ? [...value.columns] : []);
    setLimitText(value?.limit === undefined ? '' : String(value.limit));
    setBoundingBoxText(value?.boundingBox ? value.boundingBox.join(',') : '');
    setLevelText(value?.level === undefined ? '' : String(value.level));
    setMaximumLevelText(value?.maximumLevel === undefined ? '' : String(value.maximumLevel));
    setTargetSpacingText(value?.targetSpacing === undefined ? '' : String(value.targetSpacing));
  }, [value]);

  const columns = metadata?.columns || [];
  const hasLimit = metadata?.capabilities.table?.limit && metadata.capabilities.table.limit !== 'unsupported';
  const hasBounds = metadata?.capabilities.bounds && metadata.capabilities.bounds !== 'unsupported';
  const hasLevel = metadata?.capabilities.levelOfDetail && metadata.capabilities.levelOfDetail !== 'unsupported';
  const isPointCloud = metadata?.queryType === 'point-cloud';
  const sourceBounds = metadata?.spatial?.bounds;
  const toggleColumn = (name: string): void => {
    setSelectedColumns(current =>
      current.length === 0
        ? columns.map(column => column.name).filter(column => column !== name)
        : current.includes(name)
          ? current.filter(column => column !== name)
          : [...current, name]
    );
  };

  return (
    <Panel aria-label={`${title} controls`}>
      <PanelHeader>
        <strong>{title}</strong>
        <PanelHint>
          {loading ? 'Discovering schema…' : metadata ? `${metadata.sourceType} · ${metadata.queryType}` : 'Select a source'}
        </PanelHint>
      </PanelHeader>
      {metadata ? (
        <>
          <MetadataSummary>
            <span>{columns.length} columns</span>
            {metadata.statistics?.rowCount !== undefined ? <span>{String(metadata.statistics.rowCount)} rows</span> : null}
            {metadata.spatial?.coordinateReferenceSystems?.[0] ? (
              <span>{metadata.spatial.coordinateReferenceSystems[0]}</span>
            ) : null}
          </MetadataSummary>
          <FieldGroup>
            <FieldLabel>Output columns</FieldLabel>
            <ColumnGrid>
              {columns.map(column => (
                <ColumnOption key={column.name}>
                  <input
                    type="checkbox"
                    checked={selectedColumns.length === 0 || selectedColumns.includes(column.name)}
                    onChange={() => toggleColumn(column.name)}
                  />
                  <span>{column.title || column.name}</span>
                  <ColumnType>{column.role}</ColumnType>
                </ColumnOption>
              ))}
            </ColumnGrid>
            <FieldHint>Leave every column selected to preserve the source projection.</FieldHint>
          </FieldGroup>
          <InlineFields>
            {hasLimit ? (
              <FieldGroup>
                <FieldLabel htmlFor={`${panelId}-limit`}>Row limit</FieldLabel>
                <TextInput
                  id={`${panelId}-limit`}
                  inputMode="numeric"
                  min="0"
                  placeholder="All rows"
                  value={limitText}
                  onChange={event => setLimitText(event.target.value)}
                />
              </FieldGroup>
            ) : null}
            {hasBounds ? (
              <FieldGroup>
                <FieldLabel htmlFor={`${panelId}-bounds`}>Bounding box</FieldLabel>
                <TextInput
                  id={`${panelId}-bounds`}
                  placeholder={sourceBounds ? formatBounds(sourceBounds) : 'minX,minY,maxX,maxY'}
                  value={boundingBoxText}
                  onChange={event => setBoundingBoxText(event.target.value)}
                />
              </FieldGroup>
            ) : null}
            {hasLevel ? (
              <FieldGroup>
                <FieldLabel htmlFor={`${panelId}-level`}>{isPointCloud ? 'Minimum level' : 'Overview level'}</FieldLabel>
                <TextInput
                  id={`${panelId}-level`}
                  inputMode="numeric"
                  min="0"
                  placeholder="Native/default"
                  value={levelText}
                  onChange={event => setLevelText(event.target.value)}
                />
              </FieldGroup>
            ) : null}
            {isPointCloud && hasLevel ? (
              <>
                <FieldGroup>
                  <FieldLabel htmlFor={`${panelId}-maximum-level`}>Maximum level</FieldLabel>
                  <TextInput
                    id={`${panelId}-maximum-level`}
                    inputMode="numeric"
                    min="0"
                    placeholder="Any"
                    value={maximumLevelText}
                    onChange={event => setMaximumLevelText(event.target.value)}
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor={`${panelId}-spacing`}>Target spacing</FieldLabel>
                  <TextInput
                    id={`${panelId}-spacing`}
                    inputMode="decimal"
                    min="0"
                    placeholder="Native/default"
                    value={targetSpacingText}
                    onChange={event => setTargetSpacingText(event.target.value)}
                  />
                </FieldGroup>
              </>
            ) : null}
          </InlineFields>
          <ApplyButton
            type="button"
            onClick={() => {
              const limit = limitText.trim() ? Number(limitText) : undefined;
              const boundingBox = parseBounds(boundingBoxText);
              const level = parseNonNegativeInteger(levelText);
              const maximumLevel = parseNonNegativeInteger(maximumLevelText);
              const targetSpacing = parsePositiveNumber(targetSpacingText);
              onApply({
                columns: selectedColumns.length && selectedColumns.length < columns.length ? selectedColumns : undefined,
                limit: Number.isSafeInteger(limit) && (limit as number) >= 0 ? limit : undefined,
                boundingBox,
                level,
                maximumLevel,
                targetSpacing
              });
            }}
          >
            Apply scan parameters
          </ApplyButton>
        </>
      ) : (
        <EmptyState>{loading ? 'Reading source metadata before opening the data…' : 'Metadata will appear here when a source is selected.'}</EmptyState>
      )}
    </Panel>
  );
}

/** Parses a four-coordinate source bounding box from panel text. */
function parseBounds(value: string): readonly [number, number, number, number] | undefined {
  const numbers = value.split(',').map(part => Number(part.trim()));
  return numbers.length === 4 && numbers.every(Number.isFinite) ? [numbers[0], numbers[1], numbers[2], numbers[3]] : undefined;
}

/** Formats the two-dimensional portion of discovered source bounds. */
function formatBounds(bounds: {minimum: readonly number[]; maximum: readonly number[]}): string {
  return [...bounds.minimum.slice(0, 2), ...bounds.maximum.slice(0, 2)].join(',');
}

/** Parses an optional non-negative hierarchy or overview level. */
function parseNonNegativeInteger(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

/** Parses an optional positive point-cloud spacing. */
function parsePositiveNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

const Panel = styled.section`
  border: 1px solid #d8dee9;
  border-radius: 8px;
  padding: 14px;
  margin: 14px 0;
  background: #fbfcfe;
`;
const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`;
const PanelHint = styled.span`
  color: #667085;
  font-size: 0.82rem;
`;
const MetadataSummary = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #475467;
  font-size: 0.82rem;
  margin-bottom: 10px;
`;
const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
`;
const FieldLabel = styled.label`
  font-weight: 600;
  font-size: 0.82rem;
`;
const FieldHint = styled.div`
  color: #667085;
  font-size: 0.76rem;
`;
const ColumnGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;
const ColumnOption = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d0d5dd;
  border-radius: 5px;
  padding: 5px 7px;
  background: white;
  font-size: 0.82rem;
`;
const ColumnType = styled.span`
  color: #667085;
  font-size: 0.7rem;
`;
const InlineFields = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
`;
const TextInput = styled.input`
  min-width: 180px;
  border: 1px solid #d0d5dd;
  border-radius: 5px;
  padding: 7px;
`;
const ApplyButton = styled.button`
  margin-top: 12px;
  border: 0;
  border-radius: 5px;
  padding: 8px 12px;
  color: white;
  background: #475467;
  cursor: pointer;
`;
const EmptyState = styled.div`
  color: #667085;
  font-size: 0.84rem;
`;
