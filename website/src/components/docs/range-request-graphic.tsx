import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './range-request-graphic.module.css';

type RangeRequestNode = {
  /** Display name for a logical request or transport result. */
  readonly label: string;
  /** Short explanation of the node. */
  readonly detail: string;
  /** Optional documentation route for the node. */
  readonly to?: string;
};

const LOGICAL_REQUESTS: readonly RangeRequestNode[] = [
  {label: 'A tile', detail: 'visible scene content', to: '/docs/modules/tiles'},
  {label: 'A column', detail: 'selected table data', to: '/docs/modules/parquet/formats/parquet'},
  {label: 'A window', detail: 'selected raster pixels', to: '/docs/modules/geotiff/formats/geotiff'},
  {label: 'A point region', detail: 'bounded cloud data', to: '/docs/modules/copc/formats/copc'}
];

const RANGE_RESULTS: readonly RangeRequestNode[] = [
  {label: 'Header bytes', detail: 'discover the layout'},
  {label: 'Selected intervals', detail: 'fetch only what is needed'},
  {label: 'Decoded result', detail: 'table, tile, or raster data'}
];

/** Shows how a logical cloud-data request becomes a small set of HTTP ranges. */
export function RangeRequestGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="range-request-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Cloud-native reads</p>
        <h2 className={styles.title} id="range-request-title">
          Ask for the data. Fetch only the bytes behind it.
        </h2>
        <p className={styles.lead}>
          Range-aware sources translate a logical request into scheduled byte ranges. Metadata,
          caching, and cancellation stay in the transport layer while the application works with a
          normal decoded result.
        </p>
      </header>

      <div className={styles.pipeline}>
        <RequestGroup label="Logical request" nodes={LOGICAL_REQUESTS} />
        <div className={styles.connector} aria-hidden="true">
          <span>locate</span>
          <b>→</b>
        </div>
        <div className={styles.scheduler}>
          <span className={styles.schedulerMark} aria-hidden="true">[ ]</span>
          <p className={styles.schedulerLabel}>Range scheduler</p>
          <div className={styles.schedulerTags}>
            <span>merge</span>
            <span>cache</span>
            <span>abort</span>
          </div>
          <p className={styles.schedulerDetail}>offsets · limits · HTTP Range</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>read</span>
          <b>→</b>
        </div>
        <RequestGroup label="Useful bytes" nodes={RANGE_RESULTS} />
      </div>

      <p className={styles.caption}>
        The same access pattern powers tiled scenes, columnar files, point clouds, and windowed
        rasters without making the whole object a prerequisite.
      </p>
    </section>
  );
}

/** Renders a linked group of logical requests or transport results. */
function RequestGroup({label, nodes}: {label: string; nodes: readonly RangeRequestNode[]}): ReactNode {
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
