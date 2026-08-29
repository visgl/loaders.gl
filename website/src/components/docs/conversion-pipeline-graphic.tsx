import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './conversion-pipeline-graphic.module.css';

type ConversionPipelineNode = {
  /** Display name for a source or destination format. */
  readonly label: string;
  /** Short description of the data at that edge of the pipeline. */
  readonly detail: string;
  /** Documentation route for the format or operation. */
  readonly to: string;
};

const INPUTS: readonly ConversionPipelineNode[] = [
  {label: 'CSV / JSONL', detail: 'records and streams', to: '/docs/modules/csv/formats/csv'},
  {label: 'GeoJSON', detail: 'features and geometry', to: '/docs/modules/json/formats/geojson'},
  {label: 'Parquet', detail: 'columns and row groups', to: '/docs/modules/parquet/formats/parquet'},
  {label: 'glTF / GLB', detail: 'scenes and meshes', to: '/docs/modules/gltf/formats/gltf'}
];

const OUTPUTS: readonly ConversionPipelineNode[] = [
  {label: 'Arrow IPC', detail: 'typed batches', to: '/docs/modules/arrow/formats/arrow'},
  {label: 'GeoParquet', detail: 'columnar geospatial data', to: '/docs/modules/parquet/formats/geoparquet'},
  {label: 'LAS / LAZ', detail: 'point cloud data', to: '/docs/modules/las/formats/las'},
  {label: 'glTF / GLB', detail: 'portable scene assets', to: '/docs/modules/gltf/formats/gltf'}
];

/** Shows how format-specific data can pass through a shared application shape. */
export function ConversionPipelineGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="conversion-pipeline-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Explicit conversion paths</p>
        <h2 className={styles.title} id="conversion-pipeline-title">
          Connect formats through data shapes.
        </h2>
        <p className={styles.lead}>
          Read a format, work with a documented table or geometry shape, then write the result where
          it needs to go. Each edge is an explicit converter that can be composed with the next one.
        </p>
      </header>

      <div className={styles.pipeline}>
        <NodeGroup label="Read" nodes={INPUTS} />
        <div className={`${styles.connector} ${styles.inputConnector}`} aria-hidden="true">→</div>
        <div className={styles.shape}>
          <span className={styles.shapeMark} aria-hidden="true">convert()</span>
          <p className={styles.shapeLabel}>Application shape</p>
          <div className={styles.shapeList}>
            <span>table</span>
            <span>geometry</span>
            <span>mesh</span>
          </div>
          <p className={styles.shapeDetail}>normalize · transform · preserve</p>
        </div>
        <div className={`${styles.connector} ${styles.outputConnector}`} aria-hidden="true">→</div>
        <NodeGroup label="Write" nodes={OUTPUTS} />
      </div>

      <p className={styles.caption}>
        Keep conversion logic at the boundary so the rest of the application can stay format-agnostic.
      </p>
    </section>
  );
}

/** Renders a linked set of format nodes on one side of the conversion path. */
function NodeGroup({label, nodes}: {label: string; nodes: readonly ConversionPipelineNode[]}): ReactNode {
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
