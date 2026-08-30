import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './trace-table-graphic.module.css';

const TRACE_SOURCES = [
  {
    label: 'Chrome Trace',
    detail: 'events and metadata',
    to: '/docs/modules/traces/formats/chrome-trace'
  },
  {
    label: 'Perfetto',
    detail: 'TrackEvent protobuf',
    to: '/docs/modules/traces/formats/perfetto-trace'
  },
  {
    label: 'OTLP / Jaeger / Zipkin',
    detail: 'distributed spans',
    to: '/docs/modules/traces/formats/otlp-trace'
  }
] as const;

const TRACE_USES = [
  {label: 'Filter and scan', detail: 'columns, predicates, and limits'},
  {label: 'Build a timeline', detail: 'slices, spans, processes, and threads'},
  {label: 'Write or exchange', detail: 'Arrow tables and record batches'}
] as const;

/**
 * Illustrates how multiple trace formats converge on typed Arrow tables for application use.
 */
export function TraceTableGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="trace-table-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>A common trace boundary</p>
        <h2 className={styles.title} id="trace-table-title">
          Different event models. One typed table path.
        </h2>
        <p className={styles.lead}>
          The input formats keep their own vocabulary. The application can work with named Arrow
          tables for filtering, analysis, visualization, and writing.
        </p>
      </header>

      <div className={styles.pipeline}>
        <div className={styles.sources}>
          <p className={styles.stageLabel}>Trace inputs</p>
          <div className={styles.sourceList}>
            {TRACE_SOURCES.map(source => (
              <Link className={styles.source} key={source.label} to={source.to}>
                {source.label}
                <span>{source.detail} ↗</span>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.connector} aria-hidden="true">
          <span>normalize</span>
          <b>→</b>
        </div>

        <div className={styles.table}>
          <p className={styles.tableLabel}>Application boundary</p>
          <h3 className={styles.tableTitle}>Arrow trace tables</h3>
          <p className={styles.tableNote}>
            Named tables preserve the important entities without forcing analysis code to parse
            every source dialect.
          </p>
          <div className={styles.columns} aria-label="Example trace table columns">
            <span className={styles.column}>timestamp</span>
            <span className={styles.column}>duration</span>
            <span className={styles.column}>name</span>
            <span className={styles.column}>traceId</span>
            <span className={styles.column}>spanId</span>
            <span className={styles.column}>attributes</span>
          </div>
        </div>

        <div className={styles.connector} aria-hidden="true">
          <span>use</span>
          <b>→</b>
        </div>

        <div className={styles.uses}>
          <p className={styles.useLabel}>What stays portable</p>
          <div className={styles.useList}>
            {TRACE_USES.map(use => (
              <div className={styles.use} key={use.label}>
                {use.label}
                <span>{use.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={styles.caption}>
        The normalized schema is intentionally explicit: source-specific fields remain available
        where they matter, while shared operations can target the table boundary.
      </p>
    </section>
  );
}
