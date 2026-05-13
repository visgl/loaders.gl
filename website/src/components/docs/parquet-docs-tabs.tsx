import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ParquetDocsTab = {
  /** Stable tab identifier. */
  id: ParquetDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Parquet documentation tab identifiers. */
export type ParquetDocsTabId =
  | 'overview'
  | 'try-it'
  | 'format'
  | 'geoparquet'
  | 'parquetloader'
  | 'geoparquetloader'
  | 'parquetwriter'
  | 'parquetjsloader'
  | 'parquetjswriter';

const PARQUET_DOCS_TABS: ParquetDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/geospatial/geoparquet'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/parquet/formats/parquet'},
  {id: 'format', label: 'Format', href: '/docs/modules/parquet/format'},
  {id: 'geoparquet', label: 'GeoParquet', href: '/docs/modules/parquet/formats/geoparquet'},
  {
    id: 'parquetloader',
    label: 'ParquetLoader',
    href: '/docs/modules/parquet/api-reference/parquet-loader'
  },
  {
    id: 'geoparquetloader',
    label: 'GeoParquetLoader',
    href: '/docs/modules/parquet/api-reference/geoparquet-loader'
  },
  {
    id: 'parquetwriter',
    label: 'ParquetWriter',
    href: '/docs/modules/parquet/api-reference/parquet-writer'
  },
  {
    id: 'parquetjsloader',
    label: 'ParquetJSLoader',
    href: '/docs/modules/parquet/api-reference/parquet-js-loader'
  },
  {
    id: 'parquetjswriter',
    label: 'ParquetJSWriter',
    href: '/docs/modules/parquet/api-reference/parquet-js-writer'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for Parquet documentation pages.
 */
export function ParquetDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: ParquetDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Parquet documentation sections">
      {PARQUET_DOCS_TABS.map(tab => (
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
