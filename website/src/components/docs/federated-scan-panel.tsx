import React, {useEffect, useId, useState} from 'react';
import styled from 'styled-components';

import type {
  FederatedTableSchemaPolicy,
  ScanExecutionTelemetry,
  ScanQuery,
  ScanQueryMetadata
} from '@loaders.gl/scan';

import {ScanQueryPanel} from './scan-query-panel';

/** One discoverable source shown in the federation controls. */
export type FederatedScanPanelSource = Readonly<{
  /** Stable DataSourceManager registration id. */
  id: string;
  /** Human-readable source name. */
  title: string;
  /** Physical source type reported by query metadata. */
  sourceType: string;
  /** Whether the source exposes a common executable table scan. */
  compatible: boolean;
}>;

/** Complete immutable state emitted by the federated scan panel. */
export type FederatedScanPanelState = Readonly<{
  /** Selected source ids in append order. */
  sourceIds: readonly string[];
  /** Schema compatibility policy applied across sources. */
  schemaPolicy: FederatedTableSchemaPolicy;
  /** Source-local physical-to-logical column mappings. */
  columnMappings: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** SQL WHERE expression converted to the portable predicate AST. */
  predicateSql?: string;
  /** Named scalar values bound while parsing the predicate. */
  parameters: Readonly<Record<string, unknown>>;
  /** Shared projection, limit, and family-specific controls. */
  query: ScanQuery;
}>;

/** Optional execution artifacts rendered below the common controls. */
export type FederatedScanPanelResults = Readonly<{
  /** Serializable planned query and per-source work. */
  explanation?: unknown;
  /** Terminal actual execution counters. */
  telemetry?: ScanExecutionTelemetry;
  /** Source ids observed in emitted batch order. */
  provenance?: readonly string[];
}>;

/** Props for the reusable managed-source federation controls. */
export type FederatedScanPanelProps = Readonly<{
  /** Sources returned by read-only DataSourceManager discovery. */
  sources: readonly FederatedScanPanelSource[];
  /** Reconciled metadata for the currently selected sources. */
  metadata?: ScanQueryMetadata;
  /** Current immutable control state. */
  value: FederatedScanPanelState;
  /** Whether source discovery or reconciliation is in progress. */
  loading?: boolean;
  /** Latest plan, telemetry, and provenance to make execution observable. */
  results?: FederatedScanPanelResults;
  /** Called with a validated state when the shared Apply button is pressed. */
  onApply: (value: FederatedScanPanelState) => void;
}>;

/**
 * Composes source selection and normalization controls with the source-neutral scan query panel.
 */
export function FederatedScanPanel({
  sources,
  metadata,
  value,
  loading = false,
  results,
  onApply
}: FederatedScanPanelProps): JSX.Element {
  const panelId = useId().replace(/:/g, '');
  const [sourceIds, setSourceIds] = useState<string[]>([...value.sourceIds]);
  const [schemaPolicy, setSchemaPolicy] = useState(value.schemaPolicy);
  const [predicateSql, setPredicateSql] = useState(value.predicateSql || '');
  const [mappingText, setMappingText] = useState(formatJson(value.columnMappings));
  const [parameterText, setParameterText] = useState(formatJson(value.parameters));
  const [validationError, setValidationError] = useState<string>();

  useEffect(() => {
    setSourceIds([...value.sourceIds]);
    setSchemaPolicy(value.schemaPolicy);
    setPredicateSql(value.predicateSql || '');
    setMappingText(formatJson(value.columnMappings));
    setParameterText(formatJson(value.parameters));
  }, [value]);

  const toggleSource = (sourceId: string): void => {
    setSourceIds(current =>
      current.includes(sourceId)
        ? current.filter(id => id !== sourceId)
        : [...current, sourceId]
    );
  };
  const moveSource = (sourceId: string, offset: -1 | 1): void => {
    setSourceIds(current => {
      const index = current.indexOf(sourceId);
      const nextIndex = index + offset;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  return (
    <Frame aria-label="Federated scan controls">
      <Heading>
        <div>
          <strong>Managed sources</strong>
          <Hint>Choose sources and set their deterministic UNION ALL order.</Hint>
        </div>
        <SourceCount>{sourceIds.length} selected</SourceCount>
      </Heading>
      <SourceList>
        {sources.map(source => {
          const selectedIndex = sourceIds.indexOf(source.id);
          return (
            <SourceRow key={source.id} $compatible={source.compatible}>
              <label>
                <input
                  type="checkbox"
                  disabled={!source.compatible}
                  checked={selectedIndex >= 0}
                  onChange={() => toggleSource(source.id)}
                />
                <span>{source.title}</span>
                <SourceType>{source.sourceType}</SourceType>
              </label>
              {selectedIndex >= 0 ? (
                <OrderControls>
                  <OrderNumber>{selectedIndex + 1}</OrderNumber>
                  <OrderButton
                    type="button"
                    aria-label={`Move ${source.title} earlier`}
                    disabled={selectedIndex === 0}
                    onClick={() => moveSource(source.id, -1)}
                  >
                    ↑
                  </OrderButton>
                  <OrderButton
                    type="button"
                    aria-label={`Move ${source.title} later`}
                    disabled={selectedIndex === sourceIds.length - 1}
                    onClick={() => moveSource(source.id, 1)}
                  >
                    ↓
                  </OrderButton>
                </OrderControls>
              ) : null}
            </SourceRow>
          );
        })}
      </SourceList>
      <EditorGrid>
        <Editor>
          <Label htmlFor={`${panelId}-schema-policy`}>Schema policy</Label>
          <Select
            id={`${panelId}-schema-policy`}
            value={schemaPolicy}
            onChange={event => setSchemaPolicy(event.target.value as FederatedTableSchemaPolicy)}
          >
            <option value="strict">Strict</option>
            <option value="union">Union with typed nulls</option>
          </Select>
          <Hint>Explicit mappings and safe casts are validated before data pages are read.</Hint>
        </Editor>
        <Editor>
          <Label htmlFor={`${panelId}-predicate`}>Predicate</Label>
          <Input
            id={`${panelId}-predicate`}
            value={predicateSql}
            placeholder="temperature >= :minimum"
            onChange={event => setPredicateSql(event.target.value)}
          />
          <Hint>Enter the SQL WHERE expression, without SELECT or WHERE.</Hint>
        </Editor>
        <Editor>
          <Label htmlFor={`${panelId}-mappings`}>Column mappings by source</Label>
          <Textarea
            id={`${panelId}-mappings`}
            value={mappingText}
            onChange={event => setMappingText(event.target.value)}
            spellCheck={false}
          />
        </Editor>
        <Editor>
          <Label htmlFor={`${panelId}-parameters`}>Predicate parameters</Label>
          <Textarea
            id={`${panelId}-parameters`}
            value={parameterText}
            onChange={event => setParameterText(event.target.value)}
            spellCheck={false}
          />
        </Editor>
      </EditorGrid>
      {validationError ? <ValidationError>{validationError}</ValidationError> : null}
      <ScanQueryPanel
        metadata={metadata}
        loading={loading}
        value={value.query}
        title="Federated result query"
        onApply={query => {
          try {
            if (!sourceIds.length) throw new Error('Select at least one compatible source.');
            const columnMappings = parseNestedStringMap(mappingText, 'column mappings');
            const parameters = parseRecord(parameterText, 'predicate parameters');
            setValidationError(undefined);
            onApply({
              sourceIds,
              schemaPolicy,
              columnMappings,
              predicateSql: predicateSql.trim() || undefined,
              parameters,
              query
            });
          } catch (error) {
            setValidationError(error instanceof Error ? error.message : String(error));
          }
        }}
      />
      {results ? <ExecutionResults results={results} /> : null}
    </Frame>
  );
}

/** Renders planned and actual execution data without hiding source-specific fields. */
function ExecutionResults({results}: {results: FederatedScanPanelResults}): JSX.Element {
  return (
    <ResultsGrid>
      <ResultCard>
        <strong>Explain</strong>
        <Code>{formatJson(results.explanation || {})}</Code>
      </ResultCard>
      <ResultCard>
        <strong>Actual telemetry</strong>
        <Code>{formatJson(results.telemetry || {})}</Code>
      </ResultCard>
      <ResultCard>
        <strong>Batch provenance</strong>
        <Provenance>
          {results.provenance?.map((sourceId, index) => (
            <span key={`${sourceId}-${index}`}>{sourceId}</span>
          )) || 'No batches yet'}
        </Provenance>
      </ResultCard>
    </ResultsGrid>
  );
}

/** Parses a JSON object and reports a panel-specific validation error. */
function parseRecord(value: string, label: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value || '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

/** Parses source-to-column-to-column mappings and rejects non-string targets. */
function parseNestedStringMap(
  value: string,
  label: string
): Record<string, Record<string, string>> {
  const parsed = parseRecord(value, label);
  const result: Record<string, Record<string, string>> = {};
  for (const [sourceId, mappingValue] of Object.entries(parsed)) {
    if (!mappingValue || typeof mappingValue !== 'object' || Array.isArray(mappingValue)) {
      throw new Error(`${label}.${sourceId} must be a JSON object.`);
    }
    const entries = Object.entries(mappingValue);
    if (entries.some(([, target]) => typeof target !== 'string')) {
      throw new Error(`${label}.${sourceId} values must be column names.`);
    }
    result[sourceId] = Object.fromEntries(entries) as Record<string, string>;
  }
  return result;
}

/** Serializes UI artifacts with readable indentation. */
function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

const Frame = styled.section`
  margin: 18px 0;
  border: 1px solid #cfd8e6;
  border-radius: 10px;
  padding: 16px;
  background: #f8fafc;
`;
const Heading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`;
const Hint = styled.div`
  color: #667085;
  font-size: 0.76rem;
`;
const SourceCount = styled.span`
  color: #175cd3;
  background: #eff8ff;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.76rem;
  font-weight: 600;
`;
const SourceList = styled.div`
  display: grid;
  gap: 6px;
`;
const SourceRow = styled.div<{$compatible: boolean}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  padding: 7px 9px;
  background: white;
  opacity: ${({$compatible}) => ($compatible ? 1 : 0.55)};

  label {
    display: flex;
    align-items: center;
    gap: 7px;
  }
`;
const SourceType = styled.span`
  color: #667085;
  font-size: 0.72rem;
`;
const OrderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;
const OrderNumber = styled.span`
  min-width: 1.5rem;
  text-align: center;
  color: #344054;
  font-size: 0.76rem;
`;
const OrderButton = styled.button`
  border: 1px solid #d0d5dd;
  border-radius: 4px;
  background: white;
  cursor: pointer;

  &:disabled {
    color: #98a2b3;
    cursor: default;
  }
`;
const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-top: 14px;
`;
const Editor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;
const Label = styled.label`
  font-weight: 600;
  font-size: 0.82rem;
`;
const Input = styled.input`
  border: 1px solid #d0d5dd;
  border-radius: 5px;
  padding: 7px;
`;
const Select = styled.select`
  border: 1px solid #d0d5dd;
  border-radius: 5px;
  padding: 7px;
  background: white;
`;
const Textarea = styled.textarea`
  min-height: 92px;
  border: 1px solid #d0d5dd;
  border-radius: 5px;
  padding: 7px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.76rem;
`;
const ValidationError = styled.div`
  margin-top: 10px;
  color: #b42318;
  font-size: 0.82rem;
`;
const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
`;
const ResultCard = styled.div`
  min-width: 0;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  padding: 10px;
  background: white;
`;
const Code = styled.pre`
  max-height: 260px;
  overflow: auto;
  margin: 8px 0 0;
  font-size: 0.7rem;
`;
const Provenance = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
  color: #667085;
  font-size: 0.76rem;

  span {
    border-radius: 999px;
    padding: 3px 7px;
    color: #175cd3;
    background: #eff8ff;
  }
`;
