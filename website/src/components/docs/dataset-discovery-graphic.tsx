import React, {type ReactNode} from 'react';

import styles from './dataset-discovery-graphic.module.css';

/** The dataset-discovery story to render. */
export type DatasetDiscoveryGraphicKind = 'geopackage' | 'stac';

/** Properties for the dataset-discovery graphic. */
export type DatasetDiscoveryGraphicProps = {
  /** Select the metadata and data boundary shown in the graphic. */
  readonly kind: DatasetDiscoveryGraphicKind;
};

type DiscoveryStep = {
  /** Short stage label. */
  readonly label: string;
  /** Explanation of what is learned or selected at this stage. */
  readonly detail: string;
  /** Compact terms shown as visual tags. */
  readonly tags: readonly string[];
};

type DiscoveryContent = {
  /** Small label above the title. */
  readonly eyebrow: string;
  /** Friendly explanation of the discovery boundary. */
  readonly title: string;
  /** Short lead paragraph for the visual. */
  readonly lead: string;
  /** Ordered metadata and data stages. */
  readonly steps: readonly DiscoveryStep[];
  /** Closing explanation below the flow. */
  readonly caption: string;
};

const DISCOVERY_CONTENT: Record<DatasetDiscoveryGraphicKind, DiscoveryContent> = {
  geopackage: {
    eyebrow: 'Container discovery',
    title: 'Open the package. Choose the layer. Read the table.',
    lead: 'A GeoPackage can hold several feature tables in one SQLite file. Discovery keeps the container visible while the application selects one useful layer.',
    steps: [
      {label: 'GeoPackage file', detail: 'SQLite container', tags: ['tables', 'metadata']},
      {label: 'Layer catalog', detail: 'names · geometry · bounds', tags: ['discover', 'inspect']},
      {label: 'Selected feature table', detail: 'one layer for this task', tags: ['choose', 'filter']},
      {label: 'Arrow feature table', detail: 'geometry + typed attributes', tags: ['reuse', 'render']}
    ],
    caption: 'The package organizes the data; the application-facing table remains a focused, reusable result.'
  },
  stac: {
    eyebrow: 'Catalog discovery',
    title: 'Find the asset before opening the bytes.',
    lead: 'STAC narrows a dataset by space, time, collection, and links. Once an asset is selected, its native loaders.gl source can handle the actual data.',
    steps: [
      {label: 'Catalog or API', detail: 'collections · search', tags: ['space', 'time']},
      {label: 'STAC item', detail: 'one spatiotemporal record', tags: ['extent', 'context']},
      {label: 'Asset link', detail: 'role · media type · URL', tags: ['choose', 'inspect']},
      {label: 'Native loader', detail: 'Parquet · GeoTIFF · Zarr', tags: ['decode', 'scan']}
    ],
    caption: 'STAC describes where the data is and what it means; the format loader remains responsible for decoding it.'
  }
};

/** Renders the metadata-to-data path for a catalog or packaged dataset. */
export function DatasetDiscoveryGraphic({kind}: DatasetDiscoveryGraphicProps): ReactNode {
  const content = DISCOVERY_CONTENT[kind];

  return (
    <section className={styles.frame} data-kind={kind} aria-labelledby={`dataset-discovery-${kind}-title`}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h2 className={styles.title} id={`dataset-discovery-${kind}-title`}>
          {content.title}
        </h2>
        <p className={styles.lead}>{content.lead}</p>
      </header>

      <div className={styles.flow}>
        {content.steps.map((step, index) => (
          <React.Fragment key={step.label}>
            <article className={styles.step}>
              <p className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</p>
              <h3 className={styles.stepTitle}>{step.label}</h3>
              <p className={styles.stepDetail}>{step.detail}</p>
              <div className={styles.tags}>
                {step.tags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}
              </div>
            </article>
            {index < content.steps.length - 1 && (
              <div className={styles.connector} aria-hidden="true">
                <span>then</span>
                <b>→</b>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <p className={styles.caption}>{content.caption}</p>
    </section>
  );
}
