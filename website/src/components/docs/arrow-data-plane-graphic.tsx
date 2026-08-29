import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './arrow-data-plane-graphic.module.css';

type ArrowDataPlaneNode = {
  /** Display name for the input or consumer. */
  readonly label: string;
  /** Short explanation of the node's role. */
  readonly detail: string;
  /** Optional documentation route for the node. */
  readonly to?: string;
};

const INPUTS: readonly ArrowDataPlaneNode[] = [
  {label: 'Parquet', detail: 'columns and row groups', to: '/docs/modules/parquet/formats/parquet'},
  {label: 'CSV / JSONL', detail: 'streamed records', to: '/docs/modules/csv/formats/csv'},
  {label: 'Geo formats', detail: 'features and geometry columns', to: '/docs/specifications/category-gis'},
  {label: 'Arrow IPC', detail: 'file or stream', to: '/docs/modules/arrow/formats/arrow'}
];

const OUTPUTS: readonly ArrowDataPlaneNode[] = [
  {label: 'Scan', detail: 'filter and project', to: '/docs/developer-guide/common-scan-architecture'},
  {label: 'Workers', detail: 'transfer buffers', to: '/docs/developer-guide/using-worker-loaders'},
  {label: 'Render', detail: 'tables and geometry', to: '/docs/specifications/category-table'},
  {label: 'Write', detail: 'IPC or another format', to: '/docs/developer-guide/using-writers'}
];

/**
 * Shows Arrow as the shared table boundary between format-specific readers and application work.
 */
export function ArrowDataPlaneGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="arrow-data-plane-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>The common data plane</p>
        <h2 className={styles.title} id="arrow-data-plane-title">
          Many inputs. One typed table boundary.
        </h2>
        <p className={styles.lead}>
          The file format stays specialized at the edges. Arrow is the shared shape in the middle,
          where loaders, scans, workers, renderers, and writers can exchange columns and batches.
        </p>
      </header>

      <div className={styles.pipeline}>
        <DataGroup label="Format-specific input" nodes={INPUTS} />
        <div className={styles.connector} aria-hidden="true">
          <span>→</span>
        </div>
        <div className={styles.arrowBoundary}>
          <span className={styles.arrowMark} aria-hidden="true">↔</span>
          <p className={styles.boundaryLabel}>Apache Arrow</p>
          <p className={styles.boundaryDetail}>schema · vectors · record batches</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>→</span>
        </div>
        <DataGroup label="Application work" nodes={OUTPUTS} />
      </div>

      <p className={styles.caption}>
        Keep the representation stable while the source, execution engine, or destination changes.
      </p>
    </section>
  );
}

/** Renders one side of the Arrow data-plane diagram. */
function DataGroup({label, nodes}: {label: string; nodes: readonly ArrowDataPlaneNode[]}): ReactNode {
  return (
    <section className={styles.group} aria-label={label}>
      <p className={styles.groupLabel}>{label}</p>
      <div className={styles.nodeGrid}>
        {nodes.map(node => {
          const content = (
            <>
              <span className={styles.nodeLabel}>{node.label}</span>
              <span className={styles.nodeDetail}>{node.detail}</span>
            </>
          );
          return node.to ? (
            <Link className={styles.node} key={node.label} to={node.to}>
              {content}
              <span className={styles.nodeArrow} aria-hidden="true">↗</span>
            </Link>
          ) : (
            <div className={styles.node} key={node.label}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
