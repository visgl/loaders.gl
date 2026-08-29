import React, {useEffect, useRef, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

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
  /** Optional release or compatibility note shown in the orientation card. */
  notice?: ReactNode;
  /** Optional status and version badges moved out of the long-form reference content. */
  badges?: readonly ReactNode[];
  /** Render the document identifier as the sole title, omitting the prose title line. */
  hideTitle?: boolean;
};

/** Renders the small amount of inline code commonly used in page descriptions. */
function renderDescription(description: string): ReactNode {
  return description.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

/**
 * Renders a concise orientation panel before detailed module, format, category, or API content.
 */
export function DocPageHeader({
  eyebrow,
  title,
  description,
  tone = 'cyan',
  links = [],
  notice,
  badges = [],
  hideTitle = false
}: DocPageHeaderProps): ReactNode {
  const {metadata} = useDoc();
  const headerReference = useRef<HTMLElement>(null);

  useEffect(() => {
    const headerElement = headerReference.current;
    const markdownElement = headerElement?.closest('.theme-doc-markdown');
    const badgeTarget = headerElement?.querySelector('[data-doc-page-header-badges]');

    if (!markdownElement || !badgeTarget) {
      return;
    }

    const badgeParagraphs = Array.from(markdownElement.children).filter(
      element => element instanceof HTMLElement && element.classList.contains('badges')
    );

    for (const badgeParagraph of badgeParagraphs) {
      badgeTarget.append(...Array.from(badgeParagraph.childNodes));
      badgeParagraph.remove();
    }
  }, []);

  return (
    <section
      className={styles.header}
      data-doc-page-header
      data-tone={tone}
      ref={headerReference}
      aria-labelledby="doc-page-header-title"
    >
      <div className={styles.copy}>
        <div className={styles.topline}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <div className={styles.badges} data-doc-page-header-badges aria-label="Page status">
            {badges}
          </div>
        </div>
        {hideTitle ? (
          <h1 className={styles.identity} id="doc-page-header-title">
            {metadata.title}
          </h1>
        ) : (
          <>
            <p className={styles.identity}>{metadata.title}</p>
            <h1 className={styles.title} id="doc-page-header-title">
              {title}
            </h1>
          </>
        )}
        <p className={styles.description}>{renderDescription(description)}</p>
        {notice ? <div className={styles.notice}>{notice}</div> : null}
      </div>
      {links.length > 0 && (
        <div className={styles.footer}>
          <nav className={styles.links} aria-label="Related documentation">
            {links.map(link => (
              <Link className={styles.link} key={link.to} to={link.to}>
                {link.label} <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </section>
  );
}
