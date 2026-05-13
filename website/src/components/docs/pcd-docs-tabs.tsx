import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type PcdDocsTab = {
  /** Stable tab identifier. */
  id: PcdDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** PCD documentation tab identifiers. */
export type PcdDocsTabId = 'overview' | 'format' | 'pcdloader' | 'pcdwriter' | 'try-it';

const PCD_DOCS_TABS: PcdDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/pointclouds/pcd'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/pcd/formats/pcd'},
  {id: 'format', label: 'Format', href: '/docs/modules/pcd/format'},
  {id: 'pcdloader', label: 'PCDLoader', href: '/docs/modules/pcd/api-reference/pcd-loader'},
  {id: 'pcdwriter', label: 'PCDWriter', href: '/docs/modules/pcd/api-reference/pcd-writer'}
];

/**
 * Renders page links with the same visual treatment as tabs for PCD documentation pages.
 */
export function PcdDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: PcdDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="PCD documentation sections">
      {PCD_DOCS_TABS.map(tab => (
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
