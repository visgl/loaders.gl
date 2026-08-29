import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './vector-tile-delivery-graphic.module.css';

const REQUESTS = [
  {label: 'Viewport', detail: 'bounds and zoom'},
  {label: 'TileJSON', detail: 'scheme and limits', to: '/docs/modules/mvt/formats/tilejson'},
  {label: 'Map style', detail: 'layers and sources', to: '/docs/modules/mvt/formats/map-style'}
] as const;

const RESULTS = [
  {label: 'Features', detail: 'decoded geometry and properties'},
  {label: 'Binary data', detail: 'typed buffers for rendering'},
  {label: 'Arrow table', detail: 'optional columnar view', to: '/docs/specifications/category-table'}
] as const;

/** Shows how vector-tile metadata and view state become a bounded application result. */
export function VectorTileDeliveryGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="vector-tile-delivery-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Vector tile delivery</p>
        <h2 className={styles.title} id="vector-tile-delivery-title">
          Request map pieces. Decode features where they are used.
        </h2>
        <p className={styles.lead}>
          Vector-tile metadata describes the grid and the style describes how layers are used. A
          source can request only the tiles near the current view, while the decoder keeps the
          protobuf boundary separate from rendering.
        </p>
      </header>

      <div className={styles.pipeline}>
        <NodeGroup label="Map context" nodes={REQUESTS} />
        <div className={styles.connector} aria-hidden="true">
          <span>address</span>
          <b>→</b>
        </div>
        <div className={styles.tile}>
          <span className={styles.tileMark} aria-hidden="true">z / x / y</span>
          <p className={styles.tileLabel}>Vector tile source</p>
          <div className={styles.tileTags}>
            <span>request</span>
            <span>decode</span>
            <span>cache</span>
          </div>
          <p className={styles.tileDetail}>MVT protobuf · source lifecycle</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>shape</span>
          <b>→</b>
        </div>
        <NodeGroup label="Application result" nodes={RESULTS} />
      </div>

      <p className={styles.caption}>
        Tile addressing and feature decoding stay reusable whether the source is a static tile set,
        a generated table source, or a service-backed vector layer.
      </p>
    </section>
  );
}

/** Renders a linked or descriptive group of vector-tile inputs and outputs. */
function NodeGroup({label, nodes}: {label: string; nodes: readonly {label: string; detail: string; to?: string}[]}): ReactNode {
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
            <Link className={styles.node} key={node.label} to={node.to}>{content}</Link>
          ) : (
            <div className={styles.node} key={node.label}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
