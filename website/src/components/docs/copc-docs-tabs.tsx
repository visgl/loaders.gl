import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type CopcDocsTab = {
  /** Stable tab identifier. */
  id: CopcDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** COPC documentation tab identifiers. */
export type CopcDocsTabId = 'overview' | 'format' | 'source';

const COPC_DOCS_TABS: CopcDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/modules/copc'},
  {id: 'format', label: 'Format', href: '/docs/modules/copc/formats/copc'},
  {id: 'source', label: 'COPCSourceLoader', href: '/docs/modules/copc/api-reference/copc-source-loader'}
];

/**
 * Renders page links with the same visual treatment as tabs for COPC documentation pages.
 */
export function CopcDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: CopcDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="COPC documentation sections">
      {COPC_DOCS_TABS.map(tab => (
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
