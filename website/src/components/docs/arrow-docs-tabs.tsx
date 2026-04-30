import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ArrowDocsTab = {
  /** Stable tab identifier. */
  id: ArrowDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Arrow documentation tab identifiers. */
export type ArrowDocsTabId =
  | 'overview'
  | 'format'
  | 'arrowloader'
  | 'try-it'
  | 'arrowwriter'
  | 'geoarrow'
  | 'geoarrowloader';

const ARROW_DOCS_TABS: ArrowDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/table/arrow'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/arrow/formats/arrow'},
  {id: 'format', label: 'Format', href: '/docs/modules/arrow/format'},
  {id: 'arrowloader', label: 'ArrowLoader', href: '/docs/modules/arrow/api-reference/arrow-loader'},
  {id: 'arrowwriter', label: 'ArrowWriter', href: '/docs/modules/arrow/api-reference/arrow-writer'},
  {id: 'geoarrow', label: 'GeoArrow', href: '/docs/modules/arrow/formats/geoarrow'},
  {
    id: 'geoarrowloader',
    label: 'GeoArrowLoader',
    href: '/docs/modules/arrow/api-reference/geoarrow-loader'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for Arrow documentation pages.
 */
export function ArrowDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: ArrowDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Arrow documentation sections">
      {ARROW_DOCS_TABS.map(tab => (
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
