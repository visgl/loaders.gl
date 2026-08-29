import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './service-source-graphic.module.css';

/** The service family used to tailor the endpoint and request labels. */
export type ServiceSourceGraphicKind = 'arcgis' | 'ogc';

/** Properties for the service source flow graphic. */
export type ServiceSourceGraphicProps = {
  /** Select the service vocabulary shown in the first two stages. */
  kind: ServiceSourceGraphicKind;
};

const SERVICE_CONTENT = {
  arcgis: {
    endpoint: 'ArcGIS REST endpoint',
    endpointNote: 'A service directory exposes layers, operations, and formats.',
    endpointTags: ['FeatureServer', 'ImageServer', 'SceneServer'],
    request: 'Request the useful subset',
    requestNote: 'Choose features, images, tiles, or scene content for this view.',
    requestTags: ['where', 'bbox', 'outFields', 'size'],
    result: 'VectorSource · ImageSource · Tileset3DSource',
    resultNote: 'The application receives a source contract rather than a vendor-specific client.',
    link: '/docs/modules/services'
  },
  ogc: {
    endpoint: 'OGC service endpoint',
    endpointNote: 'Capabilities describe collections, operations, CRS, and response formats.',
    endpointTags: ['WMS / WMTS', 'WFS / Features', 'WCS / EDR'],
    request: 'Build a standards-shaped request',
    requestNote: 'Select a layer, collection, extent, time, or coverage slice.',
    requestTags: ['layers', 'bbox', 'datetime', 'format'],
    result: 'ImageSource · VectorSource · RasterSource',
    resultNote: 'Decoded results can move into maps, analysis, scans, or application-owned code.',
    link: '/docs/modules/wms'
  }
} as const;

/**
 * Shows how remote service metadata becomes a focused loaders.gl source request and normalized
 * application result.
 */
export function ServiceSourceGraphic({kind}: ServiceSourceGraphicProps): ReactNode {
  const content = SERVICE_CONTENT[kind];

  return (
    <section className={styles.frame} aria-labelledby={`service-source-${kind}-title`}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Remote data, explicit steps</p>
        <h2 className={styles.title} id={`service-source-${kind}-title`}>
          Discover once. Request only what the application needs.
        </h2>
        <p className={styles.lead}>
          Service sources keep endpoint metadata, request construction, and decoded results
          separate. That makes a remote dataset behave like a predictable part of the data path.
        </p>
      </header>

      <div className={styles.flow}>
        <div className={styles.stage}>
          <p className={styles.stageLabel}>01 · discover</p>
          <h3 className={styles.stageTitle}>{content.endpoint}</h3>
          <p className={styles.stageNote}>{content.endpointNote}</p>
          <div className={styles.tagGrid}>
            {content.endpointTags.map(tag => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.connector} aria-hidden="true">
          <span>plan</span>
          <b>→</b>
        </div>

        <div className={`${styles.stage} ${styles.active}`}>
          <p className={styles.stageLabel}>02 · request</p>
          <h3 className={styles.stageTitle}>{content.request}</h3>
          <p className={styles.stageNote}>{content.requestNote}</p>
          <div className={styles.tagGrid}>
            {content.requestTags.map(tag => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.connector} aria-hidden="true">
          <span>normalize</span>
          <b>→</b>
        </div>

        <Link className={styles.result} to={content.link}>
          <p className={styles.resultLabel}>03 · application result</p>
          <h3 className={styles.resultTitle}>{content.result}</h3>
          <p className={styles.resultNote}>{content.resultNote} ↗</p>
        </Link>
      </div>

      <p className={styles.caption}>
        The source owns protocol details; the application owns how returned features, pixels, tiles,
        or tables are used.
      </p>
    </section>
  );
}
