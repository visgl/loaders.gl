import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './table-shape-graphic.module.css';

type TableShapeNode = {
  /** Label for a table representation or consumer. */
  readonly label: string;
  /** Short description of the representation or consumer. */
  readonly detail: string;
  /** Optional documentation route for the node. */
  readonly to?: string;
};

const INPUTS: readonly TableShapeNode[] = [
  {label: 'Rows', detail: 'objects or arrays'},
  {label: 'Columns', detail: 'typed array-like values'},
  {label: 'Arrow', detail: 'vectors and record batches', to: '/docs/developer-guide/apache-arrow'},
  {label: 'Features', detail: 'geometry plus properties', to: '/docs/specifications/category-gis'}
];

const OUTPUTS: readonly TableShapeNode[] = [
  {label: 'Render', detail: 'application or GPU path'},
  {label: 'Scan', detail: 'filter, project, and limit', to: '/docs/developer-guide/common-scan-architecture'},
  {label: 'Convert', detail: 'move between category shapes', to: '/docs/developer-guide/converting-data'},
  {label: 'Write', detail: 'encode another format', to: '/docs/developer-guide/using-writers'}
];

/** Shows how loaders.gl table contracts connect format results to application work. */
export function TableShapeGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="table-shape-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>The table contract</p>
        <h2 className={styles.title} id="table-shape-title">
          Keep the shape explicit as the format changes.
        </h2>
        <p className={styles.lead}>
          A table result tells the application where its rows, columns, schema, and batches live.
          The source format can change without making every consumer guess what it received.
        </p>
      </header>

      <div className={styles.pipeline}>
        <NodeGroup label="Compatible inputs" nodes={INPUTS} />
        <div className={styles.connector} aria-hidden="true">
          <span>declare</span>
          <b>→</b>
        </div>
        <div className={styles.contract}>
          <span className={styles.contractMark} aria-hidden="true">shape</span>
          <p className={styles.contractLabel}>Table contract</p>
          <div className={styles.contractTags}>
            <span>schema</span>
            <span>data</span>
            <span>batch</span>
          </div>
          <p className={styles.contractDetail}>explicit discriminant · stable handoff</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>use</span>
          <b>→</b>
        </div>
        <NodeGroup label="Application paths" nodes={OUTPUTS} />
      </div>

      <p className={styles.caption}>
        Use the lightweight schema boundary for package interoperability; use full Arrow objects
        when the next operation needs columnar execution or IPC.
      </p>
    </section>
  );
}

/** Renders a linked or descriptive group of table inputs and consumers. */
function NodeGroup({label, nodes}: {label: string; nodes: readonly TableShapeNode[]}): ReactNode {
  return (
    <section className={styles.group} aria-label={label}>
      <p className={styles.groupLabel}>{label}</p>
      <div className={styles.nodeGrid}>
        {nodes.map(node => {
          const content = (
            <>
              <span>
                <strong className={styles.nodeLabel}>{node.label}</strong>
                <small className={styles.nodeDetail}>{node.detail}</small>
              </span>
              {node.to ? <span className={styles.nodeArrow} aria-hidden="true">↗</span> : null}
            </>
          );

          return node.to ? (
            <Link className={styles.node} key={node.label} to={node.to}>
              {content}
            </Link>
          ) : (
            <div className={styles.node} key={node.label}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
