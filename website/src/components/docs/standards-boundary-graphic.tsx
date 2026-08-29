import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './standards-boundary-graphic.module.css';

type StandardsBoundaryNode = {
  /** Name of a standards layer or loaders.gl boundary. */
  readonly label: string;
  /** Short description of what the layer contributes. */
  readonly detail: string;
  /** Documentation route for the layer. */
  readonly to: string;
};

const STANDARD_NODES: readonly StandardsBoundaryNode[] = [
  {label: 'Formats', detail: 'GeoJSON · GeoTIFF · 3D Tiles', to: '/docs/developer-guide/3d-data-formats'},
  {label: 'Protocols', detail: 'WMS · WFS · STAC', to: '/docs/developer-guide/using-sources'},
  {label: 'Definitions', detail: 'CRS · profiles · versions', to: '/docs/developer-guide/coordinate-reference-systems'}
];

const API_NODES: readonly StandardsBoundaryNode[] = [
  {label: 'Loaders and writers', detail: 'decode and encode', to: '/docs/developer-guide/using-loaders'},
  {label: 'Sources', detail: 'metadata and requests', to: '/docs/developer-guide/using-sources'},
  {label: 'Category data', detail: 'stable application shapes', to: '/docs/developer-guide/loader-categories'}
];

/** Shows how standards remain visible while applications use stable loaders.gl boundaries. */
export function StandardsBoundaryGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="standards-boundary-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Standards at the boundary</p>
        <h2 className={styles.title} id="standards-boundary-title">
          Keep the specification visible.
        </h2>
        <p className={styles.lead}>
          A format, protocol, or CRS definition keeps its own version and profile. loaders.gl adds
          a practical API around it without flattening those distinctions into a vague support claim.
        </p>
      </header>

      <div className={styles.diagram}>
        <NodeGroup label="Standards" nodes={STANDARD_NODES} />
        <div className={styles.connector} aria-hidden="true">
          <span>describe</span>
          <b>→</b>
        </div>
        <div className={styles.contract}>
          <span className={styles.contractMark}>contract</span>
          <p className={styles.contractTitle}>Exact support</p>
          <p className={styles.contractDetail}>version · profile · capability · boundary</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>expose</span>
          <b>→</b>
        </div>
        <NodeGroup label="Application surface" nodes={API_NODES} />
      </div>

      <p className={styles.caption}>
        Follow each entry point for the implemented capability, and keep unsupported edges explicit.
      </p>
    </section>
  );
}

/** Renders one linked group of standards or API boundaries. */
function NodeGroup({label, nodes}: {label: string; nodes: readonly StandardsBoundaryNode[]}): ReactNode {
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
