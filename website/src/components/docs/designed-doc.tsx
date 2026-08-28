import React from 'react';

import styles from './designed-doc.module.css';

/** Accent families shared with the loaders.gl capability cards. */
export type DocCapabilityTone =
  | 'blue'
  | 'cyan'
  | 'mint'
  | 'orange'
  | 'pink'
  | 'violet'
  | 'yellow';

/** A concise fact that helps readers orient themselves before the detailed documentation. */
export type DocOrientationItem = {
  /** Short category label. */
  label: string;
  /** Plain-language explanation of the category. */
  value: string;
};

/** Properties for the documentation orientation panel. */
export type DocOrientationProps = {
  /** Small uppercase label above the panel title. */
  eyebrow: string;
  /** Main reader-focused statement. */
  title: string;
  /** Short explanation of the capability. */
  description: string;
  /** Scannable facts shown below the introduction. */
  items: DocOrientationItem[];
  /** Capability accent family. */
  tone?: DocCapabilityTone;
};

/**
 * Introduces a capability in plain language before the detailed documentation begins.
 */
export function DocOrientation({
  eyebrow,
  title,
  description,
  items,
  tone = 'mint'
}: DocOrientationProps): React.ReactElement {
  return (
    <section
      className={styles.orientation}
      data-tone={tone}
      aria-labelledby="doc-orientation-title"
    >
      <div className={styles.orientationIntro}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.orientationTitle} id="doc-orientation-title">
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.factGrid}>
        {items.map((item, index) => (
          <article className={styles.fact} key={item.label}>
            <span className={styles.factNumber} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className={styles.factLabel}>{item.label}</p>
            <p className={styles.factValue}>{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Properties for the visual boundary between approachable guidance and detailed reference. */
export type ReferenceBoundaryProps = {
  /** Heading for the detailed section. */
  title: string;
  /** Explanation of what the reader will find below the boundary. */
  description: string;
  /** Capability accent family. */
  tone?: DocCapabilityTone;
};

/**
 * Marks the point where a capability guide moves from its introduction into technical reference.
 */
export function ReferenceBoundary({
  title,
  description,
  tone = 'mint'
}: ReferenceBoundaryProps): React.ReactElement {
  return (
    <div className={styles.referenceBoundary} data-tone={tone}>
      <span className={styles.referenceRule} aria-hidden="true" />
      <div>
        <p className={styles.eyebrow}>Detailed guide</p>
        <h2 className={styles.referenceTitle}>{title}</h2>
        <p className={styles.referenceDescription}>{description}</p>
      </div>
    </div>
  );
}
