import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type FlatGeobufDocsTab = {
  /** Stable tab identifier. */
  id: FlatGeobufDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** FlatGeobuf documentation tab identifiers. */
export type FlatGeobufDocsTabId = 'overview' | 'try-it' | 'format' | 'loader' | 'source';

const FLATGEOBUF_DOCS_TABS: FlatGeobufDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/geospatial/flatgeobuf'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/flatgeobuf/formats/flatgeobuf'},
  {id: 'format', label: 'Format', href: '/docs/modules/flatgeobuf/format'},
  {id: 'loader', label: 'FlatGeobufLoader', href: '/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader'},
  {
    id: 'source',
    label: 'FlatGeobufSourceLoader',
    href: '/docs/modules/flatgeobuf/api-reference/flatgeobuf-source-loader'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for FlatGeobuf documentation pages.
 */
export function FlatGeobufDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: FlatGeobufDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="FlatGeobuf documentation sections">
      {FLATGEOBUF_DOCS_TABS.map(tab => (
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
