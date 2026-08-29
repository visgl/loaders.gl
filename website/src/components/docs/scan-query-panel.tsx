import React, {useEffect, useId, useState} from 'react';
import type {ScanQuery, ScanQueryMetadata} from '@loaders.gl/scan';

import styles from './scan-query-panel.module.css';

/** State emitted by the reusable scan-query controls. */
export type ScanQueryPanelState = ScanQuery;

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
  const [minimumLevelText, setMinimumLevelText] = useState(
    value?.minimumLevel === undefined ? '' : String(value.minimumLevel)
  );
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
    setMinimumLevelText(value?.minimumLevel === undefined ? '' : String(value.minimumLevel));
    setMaximumLevelText(value?.maximumLevel === undefined ? '' : String(value.maximumLevel));
    setTargetSpacingText(value?.targetSpacing === undefined ? '' : String(value.targetSpacing));
  }, [value]);

  const columns = metadata?.columns || [];
  const execution = metadata?.execution;
  const isExecutable = execution?.status === 'supported';
  const isPointCloud = metadata?.queryType === 'point-cloud';
  const hasLimit = metadata?.capabilities.table?.limit && metadata.capabilities.table.limit !== 'unsupported';
  const hasBounds = metadata?.capabilities.bounds && metadata.capabilities.bounds !== 'unsupported';
  const hasLevel = Boolean(
    metadata?.levels?.length ||
      (metadata?.capabilities.levelOfDetail && metadata.capabilities.levelOfDetail !== 'unsupported')
  );
  const hasRasterLevels = !isPointCloud && Boolean(metadata?.levels?.length);
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
    <section className={styles.panel} aria-label={`${title} controls`}>
      <div className={styles.panelHeader}>
        <strong>{title}</strong>
        <span className={styles.panelHint}>
          {loading ? 'Discovering schema…' : metadata ? `${metadata.sourceType} · ${metadata.queryType}` : 'Select a source'}
        </span>
      </div>
      {metadata ? (
        <>
          <div className={styles.metadataSummary}>
            <span className={`${styles.supportBadge} ${isExecutable ? styles.supported : styles.unsupported}`}>
              {execution?.status === 'supported'
                ? `Scan supported · ${execution.method}`
                : 'Metadata only'}
            </span>
            <span>{columns.length} columns</span>
            {metadata.statistics?.rowCount !== undefined ? <span>{String(metadata.statistics.rowCount)} rows</span> : null}
            {metadata.spatial?.coordinateReferenceSystems?.[0] ? (
              <span>{metadata.spatial.coordinateReferenceSystems[0]}</span>
            ) : null}
          </div>
          {execution?.status === 'metadata-only' ? (
            <div className={styles.supportMessage}>{execution.reason}</div>
          ) : null}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Output columns</label>
            <div className={styles.columnGrid}>
              {columns.map(column => (
                <label className={styles.columnOption} key={column.name}>
                  <input
                    type="checkbox"
                    checked={selectedColumns.length === 0 || selectedColumns.includes(column.name)}
                    onChange={() => toggleColumn(column.name)}
                  />
                  <span>{column.title || column.name}</span>
                  <span className={styles.columnType}>{column.role}</span>
                </label>
              ))}
            </div>
            <div className={styles.fieldHint}>Leave every column selected to preserve the source projection.</div>
          </div>
          <div className={styles.inlineFields}>
            {hasLimit ? (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`${panelId}-limit`}>Row limit</label>
                <input className={styles.textInput}
                  id={`${panelId}-limit`}
                  inputMode="numeric"
                  min="0"
                  placeholder="All rows"
                  value={limitText}
                  onChange={event => setLimitText(event.target.value)}
                />
              </div>
            ) : null}
            {hasBounds ? (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`${panelId}-bounds`}>Bounding box</label>
                <input className={styles.textInput}
                  id={`${panelId}-bounds`}
                  placeholder={sourceBounds ? formatBounds(sourceBounds) : 'minX,minY,maxX,maxY'}
                  value={boundingBoxText}
                  onChange={event => setBoundingBoxText(event.target.value)}
                />
              </div>
            ) : null}
            {hasLevel ? (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`${panelId}-level`}>{isPointCloud ? 'Minimum level' : 'Overview level'}</label>
                {hasRasterLevels ? (
                  <select className={styles.select}
                    id={`${panelId}-level`}
                    value={levelText}
                    onChange={event => setLevelText(event.target.value)}
                  >
                    <option value="">Native/default</option>
                    {metadata.levels?.map(level => (
                      <option key={level.index} value={level.index}>
                        Level {level.index} ({level.width} × {level.height})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className={styles.textInput}
                    id={`${panelId}-level`}
                    inputMode="numeric"
                    min="0"
                    placeholder="Native/default"
                    value={isPointCloud ? minimumLevelText : levelText}
                    onChange={event =>
                      isPointCloud ? setMinimumLevelText(event.target.value) : setLevelText(event.target.value)
                    }
                  />
                )}
              </div>
            ) : null}
            {isPointCloud && hasLevel ? (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor={`${panelId}-maximum-level`}>Maximum level</label>
                  <input className={styles.textInput}
                    id={`${panelId}-maximum-level`}
                    inputMode="numeric"
                    min="0"
                    placeholder="Any"
                    value={maximumLevelText}
                    onChange={event => setMaximumLevelText(event.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor={`${panelId}-spacing`}>Target spacing</label>
                  <input className={styles.textInput}
                    id={`${panelId}-spacing`}
                    inputMode="decimal"
                    min="0"
                    placeholder="Native/default"
                    value={targetSpacingText}
                    onChange={event => setTargetSpacingText(event.target.value)}
                  />
                </div>
              </>
            ) : null}
          </div>
          <button className={styles.applyButton}
            type="button"
            disabled={!isExecutable}
            onClick={() => {
              const limit = limitText.trim() ? Number(limitText) : undefined;
              const boundingBox = parseBounds(boundingBoxText);
              const level = parseNonNegativeInteger(levelText);
              const minimumLevel = parseNonNegativeInteger(minimumLevelText);
              const maximumLevel = parseNonNegativeInteger(maximumLevelText);
              const targetSpacing = parsePositiveNumber(targetSpacingText);
              onApply({
                columns: selectedColumns.length && selectedColumns.length < columns.length ? selectedColumns : undefined,
                limit: Number.isSafeInteger(limit) && (limit as number) >= 0 ? limit : undefined,
                boundingBox,
                level: isPointCloud ? undefined : level,
                minimumLevel: isPointCloud ? minimumLevel : undefined,
                maximumLevel,
                targetSpacing
              });
            }}
          >
            {isExecutable ? 'Apply scan parameters' : 'Scan execution unavailable'}
          </button>
        </>
      ) : (
        <div className={styles.emptyState}>{loading ? 'Reading source metadata before opening the data…' : 'Metadata will appear here when a source is selected.'}</div>
      )}
    </section>
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
