import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './three-d-data-formats-graphic.module.css';

const FORMAT_LANES = [
  {
    label: 'Scene descriptions',
    detail: 'Hierarchy, materials, transforms, and animation',
    tone: 'pink',
    formats: [
      {label: 'glTF 2.0 + draft 2.1', to: '/docs/modules/gltf/formats/gltf'},
      {label: 'GLB', to: '/docs/modules/gltf/formats/glb'},
      {label: 'OpenUSD', to: '/docs/modules/scene/formats/usd'}
    ]
  },
  {
    label: 'Tiled worlds and point clouds',
    detail: 'Spatial hierarchy, level of detail, and selective delivery',
    tone: 'violet',
    formats: [
      {label: '3D Tiles 1.0 / 1.1', to: '/docs/modules/3d-tiles/formats/3d-tiles'},
      {label: 'I3S 1.7 / 1.8 + PC 2.x', to: '/docs/modules/i3s/formats/i3s'},
      {label: 'COPC 1.0 · Potree 1.x', to: '/docs/modules/copc/formats/copc'}
    ]
  },
  {
    label: 'Geometry and texture payloads',
    detail: 'Compression and GPU-ready delivery underneath the formats',
    tone: 'cyan',
    formats: [
      {label: 'Draco', to: '/docs/modules/draco/formats/draco'},
      {label: 'Meshopt compression', to: '/docs/modules/gltf/formats/gltf#meshopt-compression'},
      {label: 'Basis Universal / KTX2', to: '/docs/modules/textures/formats/ktx'}
    ]
  }
] as const;

/**
 * Renders the 3D format stack from scene descriptions through tiled delivery and runtime payloads.
 */
export function ThreeDDataFormatsGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="three-d-format-stack-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>A layered 3D format stack</p>
        <h2 className={styles.title} id="three-d-format-stack-title">
          Choose the delivery layer. Keep the data path.
        </h2>
        <p className={styles.lead}>
          A scene file, a tiled world, and a compressed payload solve different problems. loaders.gl
          keeps those boundaries visible while providing the readers needed to move between them.
        </p>
      </header>

      <div className={styles.lanes}>
        {FORMAT_LANES.map(lane => (
          <article className={styles.lane} data-tone={lane.tone} key={lane.label}>
            <div className={styles.laneHeading}>
              <p className={styles.laneLabel}>{lane.label}</p>
              <p className={styles.laneDetail}>{lane.detail}</p>
            </div>
            <div className={styles.formatGrid}>
              {lane.formats.map(format => (
                <Link className={styles.format} key={format.label} to={format.to}>
                  <span>{format.label}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className={styles.output}>
        <p className={styles.outputLabel}>Application-facing results</p>
        <div className={styles.outputItems}>
          <span>scenegraph</span>
          <span>tile content</span>
          <span>Mesh / point-list</span>
          <span>TextureLevel</span>
        </div>
      </div>
    </section>
  );
}
