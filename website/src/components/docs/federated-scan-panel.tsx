import React, {useEffect, useId, useState} from 'react';

import type {
  FederatedTableSchemaPolicy,
  ScanExecutionTelemetry,
  ScanQuery,
  ScanQueryMetadata
} from '@loaders.gl/scan';

import {ScanQueryPanel} from './scan-query-panel';
import styles from './federated-scan-panel.module.css';

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
    <section className={styles.frame} aria-label="Federated scan controls">
      <div className={styles.heading}>
        <div>
          <strong>Managed sources</strong>
          <div className={styles.hint}>Choose sources and set their deterministic UNION ALL order.</div>
        </div>
        <span className={styles.sourceCount}>{sourceIds.length} selected</span>
      </div>
      <div className={styles.sourceList}>
        {sources.map(source => {
          const selectedIndex = sourceIds.indexOf(source.id);
          return (
            <div className={`${styles.sourceRow} ${source.compatible ? styles.compatible : styles.incompatible}`} key={source.id}>
              <label>
                <input
                  type="checkbox"
                  disabled={!source.compatible}
                  checked={selectedIndex >= 0}
                  onChange={() => toggleSource(source.id)}
                />
                <span>{source.title}</span>
                <span className={styles.sourceType}>{source.sourceType}</span>
              </label>
              {selectedIndex >= 0 ? (
                <div className={styles.orderControls}>
                  <span className={styles.orderNumber}>{selectedIndex + 1}</span>
                  <button className={styles.orderButton}
                    type="button"
                    aria-label={`Move ${source.title} earlier`}
                    disabled={selectedIndex === 0}
                    onClick={() => moveSource(source.id, -1)}
                  >
                    ↑
                  </button>
                  <button className={styles.orderButton}
                    type="button"
                    aria-label={`Move ${source.title} later`}
                    disabled={selectedIndex === sourceIds.length - 1}
                    onClick={() => moveSource(source.id, 1)}
                  >
                    ↓
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className={styles.editorGrid}>
        <div className={styles.editor}>
          <label className={styles.label} htmlFor={`${panelId}-schema-policy`}>Schema policy</label>
          <select
            className={styles.select}
            id={`${panelId}-schema-policy`}
            value={schemaPolicy}
            onChange={event => setSchemaPolicy(event.target.value as FederatedTableSchemaPolicy)}
          >
            <option value="strict">Strict</option>
            <option value="union">Union with typed nulls</option>
          </select>
          <div className={styles.hint}>Explicit mappings and safe casts are validated before data pages are read.</div>
        </div>
        <div className={styles.editor}>
          <label className={styles.label} htmlFor={`${panelId}-predicate`}>Predicate</label>
          <input className={styles.input}
            id={`${panelId}-predicate`}
            value={predicateSql}
            placeholder="temperature >= :minimum"
            onChange={event => setPredicateSql(event.target.value)}
          />
          <div className={styles.hint}>Enter the SQL WHERE expression, without SELECT or WHERE.</div>
        </div>
        <div className={styles.editor}>
          <label className={styles.label} htmlFor={`${panelId}-mappings`}>Column mappings by source</label>
          <textarea className={styles.textarea}
            id={`${panelId}-mappings`}
            value={mappingText}
            onChange={event => setMappingText(event.target.value)}
            spellCheck={false}
          />
        </div>
        <div className={styles.editor}>
          <label className={styles.label} htmlFor={`${panelId}-parameters`}>Predicate parameters</label>
          <textarea className={styles.textarea}
            id={`${panelId}-parameters`}
            value={parameterText}
            onChange={event => setParameterText(event.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
      {validationError ? <div className={styles.validationError}>{validationError}</div> : null}
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
    </section>
  );
}

/** Renders planned and actual execution data without hiding source-specific fields. */
function ExecutionResults({results}: {results: FederatedScanPanelResults}): JSX.Element {
  return (
    <div className={styles.resultsGrid}>
      <div className={styles.resultCard}>
        <strong>Explain</strong>
        <pre className={styles.code}>{formatJson(results.explanation || {})}</pre>
      </div>
      <div className={styles.resultCard}>
        <strong>Actual telemetry</strong>
        <pre className={styles.code}>{formatJson(results.telemetry || {})}</pre>
      </div>
      <div className={styles.resultCard}>
        <strong>Batch provenance</strong>
        <div className={styles.provenance}>
          {results.provenance?.map((sourceId, index) => (
            <span key={`${sourceId}-${index}`}>{sourceId}</span>
          )) || 'No batches yet'}
        </div>
      </div>
    </div>
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
