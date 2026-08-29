import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './point-cloud-format-graphic.module.css';

type PointCloudFormatNode = {
  /** Label for a point-cloud format or output shape. */
  readonly label: string;
  /** Short explanation of the node's role. */
  readonly detail: string;
  /** Documentation route for the node. */
  readonly to: string;
};

const INPUTS: readonly PointCloudFormatNode[] = [
  {label: 'LAS', detail: 'uncompressed records', to: '/docs/modules/las/formats/las'},
  {label: 'LAZ', detail: 'lossless compression', to: '/docs/modules/las/formats/las#las-laz-and-copc'},
  {label: 'COPC', detail: 'hierarchy + ranges', to: '/docs/modules/copc/formats/copc'}
];

const OUTPUTS: readonly PointCloudFormatNode[] = [
  {label: 'Arrow point table', detail: 'typed columns', to: '/docs/developer-guide/apache-arrow'},
  {label: 'Mesh / point cloud', detail: 'render-ready positions', to: '/docs/specifications/category-mesh'},
  {label: 'LAS / LAZ writer', detail: 'exchange the records', to: '/docs/modules/las/api-reference/las-writer'}
];

/** Shows how LAS-family files preserve point records across compressed, cloud, and table paths. */
export function PointCloudFormatGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="point-cloud-format-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>One point-cloud family</p>
        <h2 className={styles.title} id="point-cloud-format-title">
          Keep the points. Change the delivery layer.
        </h2>
        <p className={styles.lead}>
          LAS defines the record, LAZ compresses it, and COPC indexes it for cloud range reads. The
          logical attributes can continue into Arrow, rendering, or a writer without being reduced
          to positions alone.
        </p>
      </header>

      <div className={styles.pipeline}>
        <NodeGroup label="Formats" nodes={INPUTS} />
        <div className={styles.connector} aria-hidden="true">
          <span>decode</span>
          <b>→</b>
        </div>
        <div className={styles.record}>
          <span className={styles.recordMark}>point record</span>
          <p className={styles.recordTitle}>Typed point columns</p>
          <div className={styles.attributeGrid}>
            <span>POSITION</span>
            <span>intensity</span>
            <span>classification</span>
            <span>COLOR_0</span>
            <span>GPS_TIME</span>
            <span>EXTRA_BYTES</span>
          </div>
          <p className={styles.recordDetail}>scale · offset · metadata</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>shape</span>
          <b>→</b>
        </div>
        <NodeGroup label="Application paths" nodes={OUTPUTS} />
      </div>

      <p className={styles.caption}>
        Select raw records, typed columns, or spatial ranges according to the next operation.
      </p>
    </section>
  );
}

/** Renders one linked set of point-cloud format or application nodes. */
function NodeGroup({label, nodes}: {label: string; nodes: readonly PointCloudFormatNode[]}): ReactNode {
  return (
    <section className={styles.group} aria-label={label}>
      <p className={styles.groupLabel}>{label}</p>
      <div className={styles.nodeGrid}>
        {nodes.map(node => (
          <Link className={styles.node} key={`${label}-${node.label}`} to={node.to}>
            <span className={styles.nodeLabel}>{node.label}</span>
            <span className={styles.nodeDetail}>{node.detail}</span>
            <span className={styles.nodeArrow} aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
