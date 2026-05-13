import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ShapefileDocsTab = {
  /** Stable tab identifier. */
  id: ShapefileDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Shapefile documentation tab identifiers. */
export type ShapefileDocsTabId =
  | 'overview'
  | 'try-it'
  | 'format'
  | 'loader'
  | 'shp'
  | 'dbf';

const SHAPEFILE_DOCS_TABS: ShapefileDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/geospatial/shapefile'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/shapefile/formats/shapefile'},
  {id: 'format', label: 'Format', href: '/docs/modules/shapefile/format'},
  {id: 'loader', label: 'ShapefileLoader', href: '/docs/modules/shapefile/api-reference/shapefile-loader'},
  {id: 'shp', label: 'SHPLoader', href: '/docs/modules/shapefile/api-reference/shp-loader'},
  {id: 'dbf', label: 'DBFLoader', href: '/docs/modules/shapefile/api-reference/dbf-loader'}
];

/**
 * Renders page links with the same visual treatment as tabs for Shapefile documentation pages.
 */
export function ShapefileDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: ShapefileDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Shapefile documentation sections">
      {SHAPEFILE_DOCS_TABS.map(tab => (
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
