import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type GeoPackageDocsTab = {
  /** Stable tab identifier. */
  id: GeoPackageDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** GeoPackage documentation tab identifiers. */
export type GeoPackageDocsTabId = 'overview' | 'try-it' | 'format' | 'loader' | 'source';

const GEOPACKAGE_DOCS_TABS: GeoPackageDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/geospatial/geopackage'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/geopackage/formats/geopackage'},
  {id: 'format', label: 'Format', href: '/docs/modules/geopackage/format'},
  {id: 'loader', label: 'GeoPackageLoader', href: '/docs/modules/geopackage/api-reference/geopackage-loader'},
  {id: 'source', label: 'GeoPackageSource', href: '/docs/modules/geopackage/api-reference/geopackage-source'}
];

/**
 * Renders page links with the same visual treatment as tabs for GeoPackage documentation pages.
 */
export function GeoPackageDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: GeoPackageDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="GeoPackage documentation sections">
      {GEOPACKAGE_DOCS_TABS.map(tab => (
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
