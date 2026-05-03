import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type LasDocsTab = {
  /** Stable tab identifier. */
  id: LasDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** LAS documentation tab identifiers. */
export type LasDocsTabId = 'overview' | 'try-it' | 'format' | 'lasloader' | 'laswriter';

const LAS_DOCS_TABS: LasDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/pointclouds/las'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/las/formats/las'},
  {id: 'format', label: 'Format', href: '/docs/modules/las/format'},
  {id: 'lasloader', label: 'LASLoader', href: '/docs/modules/las/api-reference/las-loader'},
  {id: 'laswriter', label: 'LASWriter', href: '/docs/modules/las/api-reference/las-writer'}
];

/**
 * Renders page links with the same visual treatment as tabs for LAS documentation pages.
 */
export function LasDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: LasDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="LAS documentation sections">
      {LAS_DOCS_TABS.map(tab => (
        <Link
          key={tab.id}
          className={
            tab.id === active
              ? 'docs-page-tabs__tab docs-page-tabs__tab--active'
              : 'docs-page-tabs__tab'
          }
          to={tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
