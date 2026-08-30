import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './structured-data-path-graphic.module.css';

type StructuredDataPathNode = {
  /** Display name for a structured-data family member. */
  readonly label: string;
  /** Short explanation of the input or output shape. */
  readonly detail: string;
  /** Documentation route for the format, when available. */
  readonly to?: string;
};

const INPUT_NODES: readonly StructuredDataPathNode[] = [
  {label: 'JSON', detail: 'nested documents', to: '/docs/modules/json/formats/json'},
  {label: 'NDJSON', detail: 'one record per line', to: '/docs/modules/json/formats/json'},
  {label: 'CSV / TSV', detail: 'delimited rows', to: '/docs/modules/csv/formats/csv'},
  {label: 'BSON', detail: 'typed binary documents', to: '/docs/modules/bson/formats/bson'},
  {label: 'XML', detail: 'namespaced trees', to: '/docs/modules/xml/formats/xml'}
];

const OUTPUT_NODES: readonly StructuredDataPathNode[] = [
  {label: 'Document', detail: 'nested objects and arrays'},
  {label: 'Table', detail: 'rows, columns, or Arrow batches'},
  {label: 'Features', detail: 'geometry plus properties'},
  {label: 'Tree', detail: 'format-specific document structure'}
];

/** Shows how structured text and binary documents enter common application shapes. */
export function StructuredDataPathGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="structured-data-path-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Structured data boundaries</p>
        <h2 className={styles.title} id="structured-data-path-title">
          Keep the source shape. Choose the application shape.
        </h2>
        <p className={styles.lead}>
          JSON, delimited text, BSON, and XML describe data differently. loaders.gl keeps those input
          boundaries explicit while letting applications choose documents, tables, features, or trees
          for the next stage.
        </p>
      </header>

      <div className={styles.pipeline}>
        <DataGroup label="Input families" nodes={INPUT_NODES} />
        <div className={styles.connector} aria-hidden="true">
          <span>parse</span>
          <b>→</b>
        </div>
        <div className={styles.loader}>
          <span className={styles.loaderMark} aria-hidden="true">load()</span>
          <p className={styles.loaderLabel}>Common API boundary</p>
          <div className={styles.loaderTags}>
            <span>document</span>
            <span>batch</span>
            <span>stream</span>
          </div>
          <p className={styles.loaderDetail}>load · parse · write</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>shape</span>
          <b>→</b>
        </div>
        <DataGroup label="Application results" nodes={OUTPUT_NODES} />
      </div>

      <p className={styles.caption}>
        A readable interchange format can stay readable at the edge, or become a typed table when
        that is what the application needs.
      </p>
    </section>
  );
}

/** Renders a linked group of structured-data formats or application shapes. */
function DataGroup({label, nodes}: {label: string; nodes: readonly StructuredDataPathNode[]}): ReactNode {
  return (
    <div className={styles.group}>
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
    </div>
  );
}
