import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './raster-window-graphic.module.css';

/** The raster family used to tailor the storage and selection labels. */
export type RasterWindowGraphicKind = 'geotiff' | 'zarr';

/** Properties for the raster window flow graphic. */
export type RasterWindowGraphicProps = {
  /** Select the storage vocabulary shown in the flow. */
  kind: RasterWindowGraphicKind;
};

const RASTER_CONTENT = {
  geotiff: {
    source: 'GeoTIFF / Cloud Optimized GeoTIFF',
    sourceNote: 'TIFF pages and tiles carry georeferencing, bands, and overview metadata.',
    sourceTags: ['bounds', 'bands', 'overviews'],
    select: 'Select a raster window',
    selectNote: 'Use the coordinate system and resolution that match the request.',
    selectTags: ['bbox', 'overview', 'band'],
    output: 'Typed raster result',
    outputNote: 'Pixels, dimensions, transform, and CRS stay available to the application.',
    outputTags: ['pixels', 'transform', 'CRS'],
    link: '/docs/modules/geotiff/api-reference/geotiff-source-loader'
  },
  zarr: {
    source: 'Zarr / GeoZarr / OME-Zarr',
    sourceNote: 'Arrays, dimensions, scales, and conventions describe independently addressable chunks.',
    sourceTags: ['dimensions', 'chunks', 'scales'],
    select: 'Select a named window',
    selectNote: 'Choose variables, channels, levels, time, or spatial slices before reading chunks.',
    selectTags: ['window', 'variable', 'level'],
    output: 'Typed array result',
    outputNote: 'Values return with dimension metadata and coordinate meaning intact.',
    outputTags: ['values', 'dimensions', 'metadata'],
    link: '/docs/modules/zarr/api-reference/geo-zarr-source-loader'
  }
} as const;

/**
 * Shows how raster metadata becomes a focused window request and a typed application result.
 */
export function RasterWindowGraphic({kind}: RasterWindowGraphicProps): ReactNode {
  const content = RASTER_CONTENT[kind];

  return (
    <section className={styles.frame} aria-labelledby={`raster-window-${kind}-title`}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Windowed raster access</p>
        <h2 className={styles.title} id={`raster-window-${kind}-title`}>
          Read the window that answers the question.
        </h2>
        <p className={styles.lead}>
          Raster sources use metadata before pixels: discover the layout, choose the useful window,
          and decode only the ranges or chunks that cover it.
        </p>
      </header>

      <div className={styles.flow}>
        <div className={styles.stage}>
          <p className={styles.stageLabel}>01 · discover</p>
          <h3 className={styles.stageTitle}>{content.source}</h3>
          <p className={styles.stageNote}>{content.sourceNote}</p>
          <div className={styles.tagGrid}>
            {content.sourceTags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}
          </div>
        </div>

        <div className={styles.connector} aria-hidden="true">
          <span>plan</span>
          <b>→</b>
        </div>

        <div className={styles.stage} data-active="true">
          <p className={styles.stageLabel}>02 · select</p>
          <h3 className={styles.stageTitle}>{content.select}</h3>
          <p className={styles.stageNote}>{content.selectNote}</p>
          <div className={styles.tagGrid}>
            {content.selectTags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}
          </div>
        </div>

        <div className={styles.connector} aria-hidden="true">
          <span>read</span>
          <b>→</b>
        </div>

        <Link className={styles.output} to={content.link}>
          <p className={styles.outputLabel}>03 · application result</p>
          <h3 className={styles.outputTitle}>{content.output}</h3>
          <p className={styles.outputNote}>{content.outputNote} ↗</p>
          <div className={styles.outputTags}>
            {content.outputTags.map(tag => <span className={styles.outputTag} key={tag}>{tag}</span>)}
          </div>
        </Link>
      </div>

      <p className={styles.caption}>
        A local file may use direct offsets; a cloud source may use HTTP ranges or object-store
        chunks. The application-facing selection remains the same.
      </p>
    </section>
  );
}
