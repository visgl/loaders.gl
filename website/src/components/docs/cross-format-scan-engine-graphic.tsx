import React, {type ReactNode} from 'react';

import styles from './cross-format-scan-engine-graphic.module.css';

/**
 * Renders the browser-native scan engine as a format-neutral pipeline with format-specific readers.
 */
export function CrossFormatScanEngineGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="cross-format-scan-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>The scan execution map</p>
        <h2 className={styles.title} id="cross-format-scan-title">
          One query path. Format-specific readers.
        </h2>
        <p className={styles.lead}>
          The application describes the request once. Planning and range access stay shared while
          each storage format keeps its own physical decoder.
        </p>
      </header>

      <div className={styles.pipeline}>
        <section className={styles.layerCard} data-variant="application">
          <h3 className={styles.layerTitle}>Application request</h3>
          <div className={styles.layerItems}>
            <span>Viewport / query</span>
            <span>Columns + filter</span>
            <span>Render target</span>
          </div>
        </section>

        <div className={styles.connector} aria-hidden="true">↓</div>

        <section className={styles.layerCard} data-variant="planner">
          <h3 className={styles.layerTitle}>Table planner</h3>
          <div className={styles.layerItems}>
            <span>Snapshot selection</span>
            <span>Manifest discovery</span>
            <span>Partition pruning</span>
          </div>
        </section>

        <div className={styles.connector} aria-hidden="true">↓</div>

        <section className={styles.layerCard} data-variant="engine">
          <h3 className={styles.layerTitle}>Shared scan engine</h3>
          <div className={styles.engineGrid}>
            <span>File discovery</span>
            <span>Projection</span>
            <span>Predicate AST</span>
            <span>Bounded tasks</span>
            <span>Range access</span>
            <span>Batch scheduling</span>
          </div>
        </section>

        <div className={styles.connector} aria-hidden="true">↓</div>

        <section className={styles.formatGroup}>
          <h3 className={styles.formatIntro}>Format-specific readers</h3>
          <div className={styles.formatGrid}>
            <div className={styles.formatCard} data-variant="parquet">
              <strong>Parquet</strong>
              <span>row groups · pages · indexes</span>
            </div>
            <div className={styles.formatCard} data-variant="avro">
              <strong>Avro</strong>
              <span>blocks · schemas · records</span>
            </div>
            <div className={styles.formatCard} data-variant="orc">
              <strong>ORC</strong>
              <span>stripes · streams · indexes</span>
            </div>
            <div className={styles.formatCard} data-variant="future">
              <strong>Lance · Vortex</strong>
              <span>native storage adapters</span>
            </div>
          </div>
        </section>

        <div className={styles.connector} aria-hidden="true">↓</div>

        <section className={styles.layerCard} data-variant="output">
          <h3 className={styles.layerTitle}>Common analytical result</h3>
          <div className={styles.outputRow}>
            <span>Arrow batches</span>
            <span>Zero-copy paths</span>
            <span>Application / GPU</span>
          </div>
        </section>

        <div className={styles.connector} aria-hidden="true">↓</div>

        <section className={styles.layerCard} data-variant="runtime">
          <h3 className={styles.layerTitle}>Browser-native runtime</h3>
          <div className={styles.layerItems}>
            <span>Fetch + HTTP Range</span>
            <span>Workers + cancellation</span>
            <span>Typed arrays</span>
          </div>
        </section>
      </div>

      <p className={styles.caption}>
        Iceberg and other table formats can plan files above the shared engine; the matching reader
        still owns its schema, statistics, pages, blocks, or stripes.
      </p>
    </section>
  );
}
