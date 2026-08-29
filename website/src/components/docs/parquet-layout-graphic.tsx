import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './parquet-layout-graphic.module.css';

const ROW_GROUPS = [
  {label: 'row group 0', selected: true, columns: ['id', 'status', 'geometry']},
  {label: 'row group 1', selected: false, columns: ['id', 'status', 'geometry']},
  {label: 'row group 2', selected: true, columns: ['id', 'status', 'geometry']}
] as const;

/**
 * Shows how a Parquet reader discovers metadata, selects physical ranges, and returns Arrow
 * batches without treating the file as one indivisible download.
 */
export function ParquetLayoutGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="parquet-layout-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>The Parquet layout</p>
        <h2 className={styles.title} id="parquet-layout-title">
          Read the footer. Fetch the useful ranges.
        </h2>
        <p className={styles.lead}>
          A Parquet file keeps its directory at the end. A reader can inspect that small suffix,
          choose columns and row groups, and decode only the ranges that survive planning.
        </p>
      </header>

      <div className={styles.file} aria-label="Parquet file layout">
        <div className={styles.magic}>PAR1</div>
        <div className={styles.groups}>
          {ROW_GROUPS.map(group => (
            <article className={styles.rowGroup} data-selected={group.selected} key={group.label}>
              <div className={styles.rowGroupHeader}>
                <span>{group.label}</span>
                <span className={styles.rowGroupState}>{group.selected ? 'read' : 'skip'}</span>
              </div>
              <div className={styles.columns}>
                {group.columns.map(column => (
                  <span className={styles.column} key={column}>
                    {column}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className={styles.footer}>
          <span className={styles.footerLabel}>file metadata</span>
          <span>schema · statistics · page indexes</span>
          <strong>PAR1</strong>
        </div>
      </div>

      <div className={styles.flow}>
        <div className={styles.step}>
          <span className={styles.stepNumber}>01</span>
          <strong>Inspect</strong>
          <span>footer and schema</span>
        </div>
        <span className={styles.connector} aria-hidden="true">→</span>
        <div className={styles.step}>
          <span className={styles.stepNumber}>02</span>
          <strong>Request</strong>
          <span>selected ranges</span>
        </div>
        <span className={styles.connector} aria-hidden="true">→</span>
        <Link className={styles.result} to="/docs/developer-guide/apache-arrow">
          <span className={styles.stepNumber}>03</span>
          <strong>Arrow batches</strong>
          <span>typed columns, ready to use ↗</span>
        </Link>
      </div>

      <p className={styles.caption}>
        The exact pruning layers depend on the source and indexes, but the application receives the
        same Arrow-shaped result.
      </p>
    </section>
  );
}
