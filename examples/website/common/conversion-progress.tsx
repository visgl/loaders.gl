// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';
import styles from './conversion.module.css';

/** Shared measured work counters; unknown resource totals remain indeterminate. */
export type ConversionProgressSnapshot = {
  /** Current operation. */
  phase: 'reading' | 'parsing' | 'tiles' | 'packaging' | 'complete';
  /** Completed work units, such as addresses inspected or meshes written. */
  completedUnits: number;
  /** Known total, or null when decoding determines the number of primitives. */
  totalUnits: number | null;
  /** Current address or resource identity. */
  currentResource?: string;
  /** Measured input bytes, or null for transports without counters. */
  bytesRead: number | null;
  /** Archive bytes written; final size after completion. */
  outputBytes: number;
};

/** Ordered operations; percentages measure tile addresses, never invented stage durations. */
const STAGES = ['reading', 'tiles', 'packaging', 'complete'] as const;
/** User-facing names for each observed worker stage. */
const STAGE_LABELS = {
  reading: 'Reading source',
  parsing: 'Parsing and indexing',
  tiles: 'Building tiles',
  packaging: 'Packaging archive',
  complete: 'Archive ready'
};

/** Formats measured bytes without hiding sub-megabyte reads. */
function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'Local file';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

/** Compact live work display; cancellation and partial completion remain separate actions. */
export default function ConversionProgress({
  progress,
  busy,
  startedAt,
  finishing,
  unitLabel = 'addresses',
  unitSingularLabel = 'address',
  inputLabel = 'Source read',
  tileStageLabel = 'Building tiles',
  note = 'Counts include empty addresses. Finish emits completed tiles; Cancel discards the export.'
}: {
  /** Latest measured worker state. */
  progress: ConversionProgressSnapshot;
  /** Whether the worker still owns a running conversion. */
  busy: boolean;
  /** Page timestamp captured at operation start. */
  startedAt: number;
  /** Finish has requested a partial archive at the next tile boundary. */
  finishing: boolean;
  /** Name of the counted work units. */
  unitLabel?: string;
  /** Singular name when the measured or declared total is one. */
  unitSingularLabel?: string;
  /** Distinguishes transport bytes from decoded mesh input. */
  inputLabel?: string;
  /** Label for format-specific resource conversion. */
  tileStageLabel?: string;
  /** Explains counter semantics and partial completion. */
  note?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    /** Updates elapsed wall time without simulating work progress. */
    const update = () =>
      setElapsed(Math.max(0, Math.floor((performance.now() - startedAt) / 1000)));
    update();
    if (!busy) return;
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [busy, startedAt]);
  const percent = progress.totalUnits
    ? Math.round((progress.completedUnits / progress.totalUnits) * 100)
    : null;
  const stageIndex = STAGES.indexOf(progress.phase === 'parsing' ? 'reading' : progress.phase);
  const indeterminate =
    busy &&
    (progress.totalUnits === null || progress.phase === 'reading' || progress.phase === 'parsing');
  const countLabel =
    (progress.totalUnits ?? progress.completedUnits) === 1 ? unitSingularLabel : unitLabel;
  const stageLabel = progress.phase === 'tiles' ? tileStageLabel : STAGE_LABELS[progress.phase];
  return (
    <div className={styles.progressPanel} aria-label="Conversion progress" data-active={busy}>
      <div className={styles.progressHeading}>
        <strong>
          {!busy && progress.phase !== 'complete'
            ? 'Conversion stopped'
            : finishing && busy
              ? 'Finishing completed work…'
              : stageLabel}
        </strong>
        <span>
          {progress.completedUnits}
          {progress.totalUnits !== null ? ` / ${progress.totalUnits}` : ''} {countLabel}
          {percent !== null ? ` · ${percent}%` : ''}
        </span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={`${unitLabel} completed`}
        aria-valuemin={0}
        aria-valuemax={progress.totalUnits ?? undefined}
        aria-valuenow={
          indeterminate || progress.totalUnits === null ? undefined : progress.completedUnits
        }
        aria-valuetext={
          indeterminate
            ? stageLabel
            : `${progress.completedUnits}${progress.totalUnits === null ? '' : ` of ${progress.totalUnits}`} ${countLabel} completed`
        }
        data-indeterminate={indeterminate}
      >
        <div
          className={styles.progressFill}
          style={{
            width: indeterminate
              ? '35%'
              : `${percent ?? (progress.phase === 'complete' ? 100 : 0)}%`
          }}
        />
      </div>
      <ol className={styles.progressStages} aria-label="Conversion stages">
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            data-state={index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'waiting'}
            aria-current={index === stageIndex ? 'step' : undefined}
          >
            {stage === 'reading'
              ? 'Prepare source'
              : stage === 'tiles'
                ? tileStageLabel
                : STAGE_LABELS[stage]}
          </li>
        ))}
      </ol>
      <div className={styles.progressMetrics}>
        <span>
          <small>{inputLabel}</small>
          <strong>{formatBytes(progress.bytesRead)}</strong>
        </span>
        <span>
          <small>Elapsed</small>
          <strong>
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </strong>
        </span>
        <span>
          <small>
            {progress.outputBytes
              ? progress.phase === 'complete'
                ? 'Archive size'
                : 'Archive written'
              : 'Working on'}
          </small>
          <strong>
            {progress.outputBytes
              ? formatBytes(progress.outputBytes)
              : (progress.currentResource ?? STAGE_LABELS[progress.phase])}
          </strong>
        </span>
      </div>
      <p className={styles.hint}>
        {finishing && busy
          ? 'Completing in-flight work, then packaging the completed subset.'
          : note}
      </p>
    </div>
  );
}
