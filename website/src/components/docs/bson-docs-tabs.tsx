import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type BsonDocsTab = {
  /** Stable tab identifier. */
  id: BsonDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** BSON documentation tab identifiers. */
export type BsonDocsTabId = 'try-it' | 'overview' | 'format' | 'bsonloader' | 'bsonwriter';

const BSON_DOCS_TABS: BsonDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/table/bson'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/bson/formats/bson'},
  {id: 'format', label: 'Format', href: '/docs/modules/bson/format'},
  {id: 'bsonloader', label: 'BSONLoader', href: '/docs/modules/bson/api-reference/bson-loader'},
  {id: 'bsonwriter', label: 'BSONWriter', href: '/docs/modules/bson/api-reference/bson-writer'}
];

/**
 * Renders page links with the same visual treatment as tabs for BSON documentation pages.
 */
export function BsonDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: BsonDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="BSON documentation sections">
      {BSON_DOCS_TABS.map(tab => (
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
