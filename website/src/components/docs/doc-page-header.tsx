import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './doc-page-header.module.css';

/** Accent families available to compact documentation page headers. */
export type DocPageHeaderTone =
  | 'blue'
  | 'cyan'
  | 'mint'
  | 'orange'
  | 'pink'
  | 'violet'
  | 'yellow';

/** A related destination shown as a small action in a documentation page header. */
export type DocPageHeaderLink = {
  /** Link label. */
  label: string;
  /** Docusaurus route or external URL. */
  to: string;
};

/** Properties for the compact page header used on non-tentpole documentation pages. */
export type DocPageHeaderProps = {
  /** Short context label above the page title. */
  eyebrow: string;
  /** Main page title. */
  title: string;
  /** Plain-language explanation of what the page is for. */
  description: string;
  /** Accent family used for the header border and label. */
  tone?: DocPageHeaderTone;
  /** Optional implementation details shown as compact metadata. */
  meta?: readonly string[];
  /** Optional related destinations. */
  links?: readonly DocPageHeaderLink[];
};

/**
 * Renders a concise orientation panel before detailed module, format, category, or API content.
 */
export function DocPageHeader({
  eyebrow,
  title,
  description,
  tone = 'cyan',
  meta = [],
  links = []
}: DocPageHeaderProps): ReactNode {
  return (
    <section className={styles.header} data-tone={tone} aria-labelledby="doc-page-header-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title} id="doc-page-header-title">
          {title}
        </h1>
        <p className={styles.description}>{description}</p>
      </div>
      {(meta.length > 0 || links.length > 0) && (
        <div className={styles.footer}>
          {meta.length > 0 && (
            <ul className={styles.meta} aria-label="Page details">
              {meta.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {links.length > 0 && (
            <nav className={styles.links} aria-label="Related documentation">
              {links.map(link => (
                <Link className={styles.link} key={link.to} to={link.to}>
                  {link.label} <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
