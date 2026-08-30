import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './copc-range-graphic.module.css';

const FILE_REGIONS = [
  {label: 'LAS header', detail: 'scale · bounds · CRS', tone: 'muted'},
  {label: 'COPC info VLR', detail: 'root cube · spacing', tone: 'info'},
  {label: 'hierarchy pages', detail: 'node → byte range', tone: 'hierarchy'},
  {label: 'LAZ point chunks', detail: 'selected nodes only', tone: 'points'}
] as const;

/**
 * Shows how COPC metadata narrows a cloud request before compressed point ranges are decoded.
 */
export function CopcRangeGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="copc-range-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>The cloud point path</p>
        <h2 className={styles.title} id="copc-range-title">
          Let the hierarchy choose the ranges.
        </h2>
        <p className={styles.lead}>
          COPC puts an octree directory beside the point data. A viewport or bounded query can use
          that directory first, then fetch only the compressed nodes that can contribute results.
        </p>
      </header>

      <div className={styles.pipeline}>
        <section className={styles.file} aria-label="COPC file regions">
          <div className={styles.fileHeader}>
            <span>one .copc.laz object</span>
            <span className={styles.fileMark}>COPC 1.0</span>
          </div>
          <div className={styles.fileRegions}>
            {FILE_REGIONS.map(region => (
              <div className={styles.fileRegion} data-tone={region.tone} key={region.label}>
                <strong>{region.label}</strong>
                <span>{region.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.connector} aria-hidden="true">
          <span>→</span>
          <small>HTTP ranges</small>
        </div>

        <section className={styles.request} aria-label="COPC request planning">
          <p className={styles.requestLabel}>bounded request</p>
          <div className={styles.requestItem}>
            <span className={styles.requestIcon}>⌖</span>
            <span>bounds + level of detail</span>
          </div>
          <div className={styles.requestItem}>
            <span className={styles.requestIcon}>#</span>
            <span>columns + limit</span>
          </div>
          <div className={styles.requestItem}>
            <span className={styles.requestIcon}>↯</span>
            <span>cancel when enough arrives</span>
          </div>
        </section>

        <div className={styles.connector} aria-hidden="true">
          <span>→</span>
          <small>decode selected nodes</small>
        </div>

        <Link className={styles.output} to="/docs/developer-guide/apache-arrow">
          <p className={styles.outputLabel}>application result</p>
          <strong>Arrow point batches</strong>
          <span>positions · color · attributes ↗</span>
        </Link>
      </div>

      <p className={styles.caption}>
        The same source can serve progressive viewport tiles or a bounded scan without changing the
        underlying point representation.
      </p>
    </section>
  );
}
