import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type JsonDocsTab = {
  /** Stable tab identifier. */
  id: JsonDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** JSON documentation tab identifiers. */
export type JsonDocsTabId = 'overview' | 'format' | 'jsonloader' | 'jsonwriter' | 'try-it';

const JSON_DOCS_TABS: JsonDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/table/json'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/json/formats/json'},
  {id: 'format', label: 'Format', href: '/docs/modules/json/format'},
  {id: 'jsonloader', label: 'JSONLoader', href: '/docs/modules/json/api-reference/json-loader'},
  {id: 'jsonwriter', label: 'JSONWriter', href: '/docs/modules/json/api-reference/json-writer'}
];

/**
 * Renders page links with the same visual treatment as tabs for JSON documentation pages.
 */
export function JsonDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: JsonDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="JSON documentation sections">
      {JSON_DOCS_TABS.map(tab => (
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
