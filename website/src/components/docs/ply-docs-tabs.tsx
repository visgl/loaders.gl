import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type PlyDocsTab = {
  /** Stable tab identifier. */
  id: PlyDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** PLY documentation tab identifiers. */
export type PlyDocsTabId = 'overview' | 'try-it' | 'format' | 'plyloader' | 'plywriter';

const PLY_DOCS_TABS: PlyDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/pointclouds/ply'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/ply/formats/ply'},
  {id: 'format', label: 'Format', href: '/docs/modules/ply/format'},
  {id: 'plyloader', label: 'PLYLoader', href: '/docs/modules/ply/api-reference/ply-loader'},
  {id: 'plywriter', label: 'PLYWriter', href: '/docs/modules/ply/api-reference/ply-writer'}
];

/**
 * Renders page links with the same visual treatment as tabs for PLY documentation pages.
 */
export function PlyDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: PlyDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="PLY documentation sections">
      {PLY_DOCS_TABS.map(tab => (
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
