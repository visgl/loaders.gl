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
export type JsonDocsTabId =
  | 'overview'
  | 'format'
  | 'jsonloader'
  | 'jsontableloader'
  | 'ndjsonloader'
  | 'geojsonloader'
  | 'ndgeojsonloader'
  | 'jsonwriter'
  | 'geojsonwriter'
  | 'try-it';

const JSON_DOCS_TABS: JsonDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/table/json'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/json/formats/json'},
  {id: 'format', label: 'Format', href: '/docs/modules/json/format'},
  {id: 'jsonloader', label: 'JSONLoader', href: '/docs/modules/json/api-reference/json-loader'},
  {
    id: 'jsontableloader',
    label: 'JSONTableLoader',
    href: '/docs/modules/json/api-reference/json-table-loader'
  },
  {id: 'ndjsonloader', label: 'NDJSONLoader', href: '/docs/modules/json/api-reference/ndjson-loader'},
  {id: 'geojsonloader', label: 'GeoJSONLoader', href: '/docs/modules/json/api-reference/geojson-loader'},
  {
    id: 'ndgeojsonloader',
    label: 'NDGeoJSONLoader',
    href: '/docs/modules/json/api-reference/ndgeojson-loader'
  },
  {id: 'jsonwriter', label: 'JSONWriter', href: '/docs/modules/json/api-reference/json-writer'},
  {
    id: 'geojsonwriter',
    label: 'GeoJSONWriter',
    href: '/docs/modules/json/api-reference/geojson-writer'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for JSON documentation pages.
 */
export function JsonDocsTabs({
  active,
  tryItHref = '/examples/table/json'
}: {
  /** Active tab identifier. */
  active: JsonDocsTabId;
  /** Example page URL for the active JSON-family format. */
  tryItHref?: string;
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
          to={tab.id === 'try-it' ? tryItHref : tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
