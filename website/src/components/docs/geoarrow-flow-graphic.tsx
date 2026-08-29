import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './geoarrow-flow-graphic.module.css';

type GeoArrowNode = {
  /** Label shown for an input or consumer. */
  readonly label: string;
  /** Short description of the node. */
  readonly detail: string;
  /** Documentation route for the node. */
  readonly to: string;
};

const SOURCES: readonly GeoArrowNode[] = [
  {label: 'GeoParquet', detail: 'file-level metadata', to: '/docs/modules/parquet/formats/geoparquet'},
  {label: 'GeoJSON', detail: 'features to columns', to: '/docs/modules/json/formats/geojson'},
  {label: 'WKB / WKT', detail: 'geometry wire formats', to: '/docs/modules/wkt/formats/wkb'}
];

const CONSUMERS: readonly GeoArrowNode[] = [
  {label: 'Scan', detail: 'project and filter', to: '/docs/developer-guide/common-scan-architecture'},
  {label: 'Render', detail: 'geometry and attributes', to: '/docs/specifications/category-gis'},
  {label: 'Write', detail: 'Arrow IPC or GeoParquet', to: '/docs/developer-guide/using-writers'}
];

/**
 * Shows how GeoArrow keeps geometry metadata beside ordinary typed Arrow columns.
 */
export function GeoArrowFlowGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="geoarrow-flow-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>The GeoArrow boundary</p>
        <h2 className={styles.title} id="geoarrow-flow-title">
          Geometry columns stay Arrow columns.
        </h2>
        <p className={styles.lead}>
          GeoArrow adds geometry layouts and extension metadata to an ordinary Arrow table. The
          geometry travels with typed attributes instead of taking a separate application path.
        </p>
      </header>

      <div className={styles.pipeline}>
        <DataGroup label="Geospatial inputs" nodes={SOURCES} />
        <div className={styles.connector} aria-hidden="true">
          <span>encode</span>
          <b>→</b>
        </div>
        <div className={styles.boundary}>
          <span className={styles.boundaryMark} aria-hidden="true">◎</span>
          <p className={styles.boundaryLabel}>GeoArrow table</p>
          <p className={styles.boundaryDetail}>geometry · attributes · CRS metadata</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>reuse</span>
          <b>→</b>
        </div>
        <DataGroup label="Shared table work" nodes={CONSUMERS} />
      </div>

      <p className={styles.caption}>
        GeoArrow is a convention on top of Arrow, so the result stays compatible with Arrow IPC and
        the broader Arrow ecosystem.
      </p>
    </section>
  );
}

/** Renders one linked group of GeoArrow inputs or consumers. */
function DataGroup({label, nodes}: {label: string; nodes: readonly GeoArrowNode[]}): ReactNode {
  return (
    <div className={styles.group}>
      <p className={styles.groupLabel}>{label}</p>
      <div className={styles.nodeGrid}>
        {nodes.map(node => (
          <Link className={styles.node} key={node.label} to={node.to}>
            <span>
              <strong className={styles.nodeLabel}>{node.label}</strong>
              <small className={styles.nodeDetail}>{node.detail}</small>
            </span>
            <span className={styles.nodeArrow} aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
