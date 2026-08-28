import React from 'react';

import styles from './capability-flow-graphics.module.css';

/**
 * Explains how workers move expensive parsing away from interactive application work.
 */
export function WorkerFlowGraphic(): React.ReactElement {
  return (
    <section className={styles.frame} data-tone="blue" aria-labelledby="worker-flow-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Worker execution</p>
        <h2 className={styles.title} id="worker-flow-title">
          Keep parsing off the interaction path.
        </h2>
        <p className={styles.lead}>
          loaders.gl transfers binary input to a reusable worker and returns parsed data while the
          main thread remains available for rendering and input.
        </p>
      </header>
      <div className={styles.flow}>
        <div className={styles.stage}>
          <p className={styles.stageLabel}>Main thread</p>
          <div className={styles.nodeGrid}>
            <span className={styles.node}>Fetch bytes</span>
            <span className={styles.node}>Render UI</span>
            <span className={styles.node}>Handle input</span>
          </div>
        </div>
        <div className={styles.connector}>
          <span>transfer</span>
          <b aria-hidden="true">→</b>
        </div>
        <div className={`${styles.stage} ${styles.activeStage}`}>
          <p className={styles.stageLabel}>Worker pool</p>
          <div className={styles.workerGrid}>
            <span className={styles.worker}>worker 01</span>
            <span className={styles.worker}>worker 02</span>
          </div>
          <p className={styles.stageNote}>parse · decompress · transform</p>
        </div>
        <div className={styles.connector}>
          <span>return</span>
          <b aria-hidden="true">→</b>
        </div>
        <div className={styles.stage}>
          <p className={styles.stageLabel}>Application data</p>
          <div className={styles.nodeGrid}>
            <span className={styles.node}>Tables</span>
            <span className={styles.node}>Meshes</span>
            <span className={styles.node}>Images</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Separates CRS metadata preservation from explicit coordinate transformation.
 */
export function CrsFlowGraphic(): React.ReactElement {
  return (
    <section className={styles.frame} data-tone="orange" aria-labelledby="crs-flow-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Coordinate meaning</p>
        <h2 className={styles.title} id="crs-flow-title">
          Preserve first. Transform deliberately.
        </h2>
        <p className={styles.lead}>
          A loader can retain the coordinate definition without changing a single value. Reprojection
          is a separate, explicit operation with a named target.
        </p>
      </header>
      <div className={styles.crsFlow}>
        <div className={styles.stage}>
          <p className={styles.stageLabel}>Source data</p>
          <span className={styles.coordinate}>12.4924, 41.8902</span>
          <div className={styles.tagRow}>
            <span className={styles.tag}>GeoParquet</span>
            <span className={styles.tag}>GeoArrow</span>
            <span className={styles.tag}>WKT</span>
          </div>
        </div>
        <div className={styles.connector}>
          <span>discover</span>
          <b aria-hidden="true">→</b>
        </div>
        <div className={`${styles.stage} ${styles.activeStage}`}>
          <p className={styles.stageLabel}>CRS definition</p>
          <strong className={styles.definition}>EPSG:4326</strong>
          <p className={styles.stageNote}>identifier · axis order · epoch · provenance</p>
        </div>
        <div className={styles.connector}>
          <span>choose</span>
          <b aria-hidden="true">→</b>
        </div>
        <div className={styles.outcomeGrid}>
          <div className={styles.outcome}>
            <span>Preserve</span>
            <strong>Same values + CRS</strong>
          </div>
          <div className={styles.outcome}>
            <span>Transform</span>
            <strong>New values + target CRS</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
