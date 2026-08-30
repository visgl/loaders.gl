import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './tiled-scene-graphic.module.css';

/**
 * Illustrates how view state selects a small set of payloads from a hierarchical 3D dataset.
 */
export function TiledSceneGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="tiled-scene-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>View-dependent delivery</p>
        <h2 className={styles.title} id="tiled-scene-title">
          A hierarchy turns one scene into useful requests.
        </h2>
        <p className={styles.lead}>
          Tiled formats keep spatial structure and level-of-detail metadata alongside their
          payloads. A runtime can select visible leaves instead of downloading the complete world.
        </p>
      </header>

      <div className={styles.flow}>
        <div className={styles.hierarchy}>
          <p className={styles.stageLabel}>Dataset hierarchy</p>
          <div className={styles.tree} aria-label="A tiled dataset hierarchy">
            <div className={styles.root}>
              <span className={styles.nodeTitle}>root · world bounds</span>
              <span className={styles.nodeNote}>coarse content and children</span>
            </div>
            <div className={styles.branchRow}>
              <div className={styles.branch}>
                <span className={styles.nodeTitle}>region west</span>
                <span className={styles.nodeNote}>geometric error</span>
              </div>
              <div className={styles.branch}>
                <span className={styles.nodeTitle}>region east</span>
                <span className={styles.nodeNote}>geometric error</span>
              </div>
            </div>
            <div className={styles.leafRow}>
              <span className={styles.leaf}>leaf · L06</span>
              <span className={styles.leaf}>leaf · L07</span>
              <span className={styles.leaf}>leaf · L06</span>
              <span className={styles.leaf}>leaf · L08</span>
            </div>
          </div>
        </div>

        <div className={styles.connector} aria-hidden="true">
          <span>select</span>
          <b>→</b>
        </div>

        <div className={styles.selection}>
          <p className={styles.selectionLabel}>Current view</p>
          <div className={styles.viewport}>
            <span className={styles.viewportLabel}>viewport + error budget</span>
            <div className={styles.viewportValues}>
              <span>bounds</span>
              <span>SSE</span>
              <span>priority</span>
            </div>
          </div>
          <div className={styles.selected}>
            <span className={styles.selectedTitle}>selected content</span>
            <span className={styles.selectedNote}>
              Fetch only the leaves that can contribute to this view.
            </span>
            <div className={styles.payloads}>
              <span>glTF</span>
              <span>points</span>
              <span>textures</span>
            </div>
            <Link className={styles.resultLink} to="/docs/modules/tiles/api-reference/tileset-3d">
              Tileset3D traversal ↗
            </Link>
          </div>
        </div>
      </div>

      <p className={styles.caption}>
        3D Tiles and I3S differ in their resource layouts, but the application-facing idea is the
        same: preserve the hierarchy, select by view, and request content progressively.
      </p>
    </section>
  );
}
