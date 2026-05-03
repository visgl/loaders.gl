import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type DracoDocsTab = {
  /** Stable tab identifier. */
  id: DracoDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Draco documentation tab identifiers. */
export type DracoDocsTabId = 'overview' | 'try-it' | 'format' | 'dracoloader' | 'dracowriter';

const DRACO_DOCS_TABS: DracoDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/pointclouds/draco'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/draco/formats/draco'},
  {id: 'format', label: 'Format', href: '/docs/modules/draco/format'},
  {id: 'dracoloader', label: 'DracoLoader', href: '/docs/modules/draco/api-reference/draco-loader'},
  {id: 'dracowriter', label: 'DracoWriter', href: '/docs/modules/draco/api-reference/draco-writer'}
];

/**
 * Renders page links with the same visual treatment as tabs for Draco documentation pages.
 */
export function DracoDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: DracoDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Draco documentation sections">
      {DRACO_DOCS_TABS.map(tab => (
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
