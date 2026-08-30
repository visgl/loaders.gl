import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './loader-selection-graphic.module.css';

type LoaderSelectionNode = {
  /** Label shown for a format or result shape. */
  readonly label: string;
  /** Short explanation of the node. */
  readonly detail: string;
  /** Optional documentation route for the node. */
  readonly to?: string;
};

const INPUTS: readonly LoaderSelectionNode[] = [
  {label: 'Parquet', detail: 'columnar table', to: '/docs/modules/parquet/formats/parquet'},
  {label: 'GeoJSON', detail: 'feature data', to: '/docs/modules/json/formats/geojson'},
  {label: 'glTF / GLB', detail: 'scenegraph', to: '/docs/modules/gltf/formats/gltf'},
  {label: 'LAS / LAZ', detail: 'point cloud', to: '/docs/modules/las/formats/las'}
];

const OUTPUTS: readonly LoaderSelectionNode[] = [
  {label: 'Table', detail: 'rows or Arrow columns', to: '/docs/specifications/category-table'},
  {label: 'Mesh', detail: 'positions and attributes', to: '/docs/specifications/category-mesh'},
  {label: 'Scenegraph', detail: 'nodes and materials', to: '/docs/specifications/category-scenegraph'},
  {label: 'Point cloud', detail: 'positions and point fields', to: '/docs/specifications/category-mesh'}
];

/**
 * Shows how format-specific loader selection leads to a stable application-facing result.
 */
export function LoaderSelectionGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="loader-selection-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>The loader boundary</p>
        <h2 className={styles.title} id="loader-selection-title">
          Formats change. The application path can stay the same.
        </h2>
        <p className={styles.lead}>
          Choose a loader explicitly when the format is known, or let the selector choose from a
          compatible set. The result remains the shape your application is built to consume.
        </p>
      </header>

      <div className={styles.pipeline}>
        <DataGroup label="Input formats" nodes={INPUTS} />
        <div className={styles.connector} aria-hidden="true">
          <span>select</span>
          <b>→</b>
        </div>
        <div className={styles.selector}>
          <span className={styles.selectorMark} aria-hidden="true">{`{ }`}</span>
          <p className={styles.selectorLabel}>Loader selection</p>
          <p className={styles.selectorDetail}>explicit · list · registry</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>return</span>
          <b>→</b>
        </div>
        <DataGroup label="Application shapes" nodes={OUTPUTS} />
      </div>

      <p className={styles.caption}>
        One loader can be precise; a loader list can be flexible; the result contract is still yours.
      </p>
    </section>
  );
}

/** Renders one group of linked formats or application-facing shapes. */
function DataGroup({label, nodes}: {label: string; nodes: readonly LoaderSelectionNode[]}): ReactNode {
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
