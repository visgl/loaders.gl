import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './bundle-boundary-graphic.module.css';

type BundleBoundaryNode = {
  /** Display name for a loader or bundle stage. */
  readonly label: string;
  /** Short explanation of the stage. */
  readonly detail: string;
  /** Optional documentation route for the node. */
  readonly to?: string;
};

const FORMAT_NODES: readonly BundleBoundaryNode[] = [
  {label: 'CSV', detail: 'delimited tables', to: '/docs/modules/csv/formats/csv'},
  {label: 'Parquet', detail: 'columnar files', to: '/docs/modules/parquet/formats/parquet'},
  {label: 'glTF', detail: 'scene assets', to: '/docs/modules/gltf/formats/gltf'},
  {label: 'LAS / LAZ', detail: 'point clouds', to: '/docs/modules/las/formats/las'}
];

const RESULT_NODES: readonly BundleBoundaryNode[] = [
  {label: 'Metadata', detail: 'name, extensions, MIME types'},
  {label: 'Parser chunk', detail: 'loaded only when selected'},
  {label: 'Application data', detail: 'table, mesh, scene, or points'}
];

/** Shows how unbundled loader metadata becomes an on-demand parser and result. */
export function BundleBoundaryGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="bundle-boundary-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Bundle boundaries</p>
        <h2 className={styles.title} id="bundle-boundary-title">
          Recognize many formats. Load fewer parsers up front.
        </h2>
        <p className={styles.lead}>
          Keep format metadata in the application bundle and defer parser code until a file actually
          needs it. The async core APIs hide the split point from the normal loading path.
        </p>
      </header>

      <div className={styles.pipeline}>
        <BundleGroup label="Supported inputs" nodes={FORMAT_NODES} />
        <div className={styles.connector} aria-hidden="true">
          <span>recognize</span>
          <b>→</b>
        </div>
        <div className={styles.boundary}>
          <span className={styles.boundaryMark} aria-hidden="true">import()</span>
          <p className={styles.boundaryLabel}>On-demand boundary</p>
          <div className={styles.boundaryTags}>
            <span>metadata</span>
            <span>preload</span>
            <span>cache</span>
          </div>
          <p className={styles.boundaryDetail}>bundled for sync · split for async</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>parse</span>
          <b>→</b>
        </div>
        <BundleGroup label="What the app receives" nodes={RESULT_NODES} />
      </div>

      <p className={styles.caption}>
        Broad format recognition and small startup bundles can coexist when the parser boundary is
        explicit.
      </p>
    </section>
  );
}

/** Renders a linked group of formats or bundle stages. */
function BundleGroup({label, nodes}: {label: string; nodes: readonly BundleBoundaryNode[]}): ReactNode {
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
