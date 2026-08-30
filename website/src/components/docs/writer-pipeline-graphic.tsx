import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './writer-pipeline-graphic.module.css';

type WriterPipelineNode = {
  /** Label shown in the pipeline. */
  readonly label: string;
  /** Short description of the input or output shape. */
  readonly detail: string;
  /** Documentation page for the input or output. */
  readonly to: string;
};

const INPUTS: readonly WriterPipelineNode[] = [
  {label: 'Arrow table', detail: 'typed columns and batches', to: '/docs/developer-guide/apache-arrow'},
  {label: 'Mesh data', detail: 'attributes and geometry', to: '/docs/specifications/category-mesh'},
  {label: 'GeoJSON data', detail: 'features and geometry', to: '/docs/specifications/category-gis'}
];

const OUTPUTS: readonly WriterPipelineNode[] = [
  {label: 'Parquet', detail: 'columnar analytical files', to: '/docs/modules/parquet/formats/parquet'},
  {label: 'glTF / GLB', detail: 'portable scene assets', to: '/docs/modules/gltf/formats/gltf'},
  {label: 'Draco / LAS', detail: 'compressed geometry and points', to: '/docs/modules/draco/formats/draco'}
];

/** Shows how category-shaped application data reaches format-specific writers. */
export function WriterPipelineGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="writer-pipeline-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Portable output</p>
        <h2 className={styles.title} id="writer-pipeline-title">
          One application shape. Many destinations.
        </h2>
        <p className={styles.lead}>
          Writers keep encoding at the edge of the pipeline. Prepare a documented category shape,
          choose the destination format, and let that writer own its physical layout and compression.
        </p>
      </header>

      <div className={styles.pipeline}>
        <NodeGroup label="Application data" nodes={INPUTS} />
        <div className={`${styles.connector} ${styles.inputConnector}`} aria-hidden="true">
          →
        </div>
        <div className={styles.boundary}>
          <span className={styles.boundaryMark} aria-hidden="true">encode()</span>
          <p className={styles.boundaryLabel}>Writer boundary</p>
          <p className={styles.boundaryDetail}>validate · encode · compress</p>
        </div>
        <div className={`${styles.connector} ${styles.outputConnector}`} aria-hidden="true">
          →
        </div>
        <NodeGroup label="Portable files" nodes={OUTPUTS} />
      </div>

      <p className={styles.caption}>
        The application chooses the data shape; the writer chooses the bytes.
      </p>
    </section>
  );
}

/** Renders one set of linked application or destination nodes. */
function NodeGroup({label, nodes}: {label: string; nodes: readonly WriterPipelineNode[]}): ReactNode {
  return (
    <section className={styles.group} aria-label={label}>
      <p className={styles.groupLabel}>{label}</p>
      <div className={styles.nodeGrid}>
        {nodes.map(node => (
          <Link className={styles.node} key={node.label} to={node.to}>
            <span className={styles.nodeLabel}>{node.label}</span>
            <span className={styles.nodeDetail}>{node.detail}</span>
            <span className={styles.nodeArrow} aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
