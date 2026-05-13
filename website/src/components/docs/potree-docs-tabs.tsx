import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type PotreeDocsTab = {
  /** Stable tab identifier. */
  id: PotreeDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Potree documentation tab identifiers. */
export type PotreeDocsTabId = 'overview' | 'loader' | 'source' | 'example';

const POTREE_DOCS_TABS: PotreeDocsTab[] = [
  {
    id: 'example',
    label: 'Try It',
    href: '/examples/pointclouds/potree-source'
  },
  {id: 'overview', label: 'Overview', href: '/docs/modules/potree'},
  {id: 'loader', label: 'PotreeLoader', href: '/docs/modules/potree/api-reference/potree-loader'},
  {
    id: 'source',
    label: 'PotreeSourceLoader',
    href: '/docs/modules/potree/api-reference/potree-source-loader'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for Potree documentation pages.
 */
export function PotreeDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: PotreeDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Potree documentation sections">
      {POTREE_DOCS_TABS.map(tab => (
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
