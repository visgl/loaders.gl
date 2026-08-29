import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './texture-transcode-graphic.module.css';

type TextureTranscodeNode = {
  /** Display name for a texture delivery stage. */
  readonly label: string;
  /** Short explanation of the stage. */
  readonly detail: string;
  /** Optional documentation route for the stage. */
  readonly to?: string;
};

const SOURCE_NODES: readonly TextureTranscodeNode[] = [
  {label: 'KTX2', detail: 'container and mip chain', to: '/docs/modules/textures/formats/ktx'},
  {label: 'Basis', detail: 'portable supercompression', to: '/docs/modules/textures/formats/basis'},
  {label: 'DDS / PVR', detail: 'native GPU payloads', to: '/docs/modules/textures/formats/compressed-textures'}
];

const OUTPUT_NODES: readonly TextureTranscodeNode[] = [
  {label: 'BC / S3TC', detail: 'desktop GPU target'},
  {label: 'ETC2 / ASTC', detail: 'mobile GPU target'},
  {label: 'Fallback pixels', detail: 'when compression is unavailable'}
];

/** Shows how portable texture payloads become a device-compatible runtime texture. */
export function TextureTranscodeGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="texture-transcode-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Portable texture delivery</p>
        <h2 className={styles.title} id="texture-transcode-title">
          Package once. Choose the GPU target at runtime.
        </h2>
        <p className={styles.lead}>
          Containers preserve dimensions and mip levels; portable payloads delay the final format
          choice until the application knows what the current device supports.
        </p>
      </header>

      <div className={styles.pipeline}>
        <TextureGroup label="Distributed asset" nodes={SOURCE_NODES} />
        <div className={styles.connector} aria-hidden="true">
          <span>inspect</span>
          <b>→</b>
        </div>
        <div className={styles.transcoder}>
          <span className={styles.transcoderMark} aria-hidden="true">GPU?</span>
          <p className={styles.transcoderLabel}>Runtime choice</p>
          <div className={styles.transcoderTags}>
            <span>mips</span>
            <span>device</span>
            <span>transcode</span>
          </div>
          <p className={styles.transcoderDetail}>metadata · levels · capabilities</p>
        </div>
        <div className={styles.connector} aria-hidden="true">
          <span>upload</span>
          <b>→</b>
        </div>
        <TextureGroup label="Renderer receives" nodes={OUTPUT_NODES} />
      </div>

      <p className={styles.caption}>
        The application keeps one asset pipeline while the renderer receives the representation its
        WebGL or WebGPU device can use efficiently.
      </p>
    </section>
  );
}

/** Renders a linked group of source formats or runtime texture targets. */
function TextureGroup({label, nodes}: {label: string; nodes: readonly TextureTranscodeNode[]}): ReactNode {
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
