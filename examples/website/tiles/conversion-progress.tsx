// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useEffect, useState} from 'react';
import type {PMTilesExampleProgress} from './create-pmtiles';
import styles from '../common/conversion.module.css';

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
  finishing
}: {
  /** Latest measured worker state. */
  progress: PMTilesExampleProgress;
  /** Whether the worker still owns a running conversion. */
  busy: boolean;
  /** Page timestamp captured at operation start. */
  startedAt: number;
  /** Finish has requested a partial archive at the next tile boundary. */
  finishing: boolean;
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
  const percent = Math.round((progress.completedTiles / progress.totalTiles) * 100);
  const stageIndex = STAGES.indexOf(progress.phase === 'parsing' ? 'reading' : progress.phase);
  const indeterminate = busy && (progress.phase === 'reading' || progress.phase === 'parsing');
  return (
    <div className={styles.progressPanel} aria-label="Conversion progress" data-active={busy}>
      <div className={styles.progressHeading}>
        <strong>
          {!busy && progress.phase !== 'complete'
            ? 'Conversion stopped'
            : finishing && busy
              ? 'Finishing completed work…'
              : STAGE_LABELS[progress.phase]}
        </strong>
        <span>
          {progress.completedTiles} / {progress.totalTiles} addresses · {percent}%
        </span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Tile addresses inspected"
        aria-valuemin={0}
        aria-valuemax={progress.totalTiles}
        aria-valuenow={indeterminate ? undefined : progress.completedTiles}
        aria-valuetext={
          indeterminate
            ? STAGE_LABELS[progress.phase]
            : `${progress.completedTiles} of ${progress.totalTiles} addresses inspected`
        }
        data-indeterminate={indeterminate}
      >
        <div
          className={styles.progressFill}
          style={{width: indeterminate ? '35%' : `${percent}%`}}
        />
      </div>
      <ol className={styles.progressStages} aria-label="Conversion stages">
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            data-state={index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'waiting'}
            aria-current={index === stageIndex ? 'step' : undefined}
          >
            {stage === 'reading' ? 'Prepare source' : STAGE_LABELS[stage]}
          </li>
        ))}
      </ol>
      <div className={styles.progressMetrics}>
        <span>
          <small>Source read</small>
          <strong>{formatBytes(progress.bytesRead)}</strong>
        </span>
        <span>
          <small>Elapsed</small>
          <strong>
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </strong>
        </span>
        <span>
          <small>{progress.outputBytes ? 'Archive size' : 'Working on'}</small>
          <strong>
            {progress.outputBytes
              ? formatBytes(progress.outputBytes)
              : (progress.currentTile ?? STAGE_LABELS[progress.phase])}
          </strong>
        </span>
      </div>
      <p className={styles.hint}>
        {finishing && busy
          ? 'Completing the in-flight tile, then packaging the completed subset.'
          : 'Counts include empty addresses. Finish emits completed tiles; Cancel discards the export.'}
      </p>
    </div>
  );
}
