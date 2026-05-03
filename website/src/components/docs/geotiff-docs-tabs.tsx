import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type GeoTiffDocsTab = {
  /** Stable tab identifier. */
  id: GeoTiffDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** GeoTIFF documentation tab identifiers. */
export type GeoTiffDocsTabId =
  | 'geotiff-example'
  | 'ometiff-example'
  | 'overview'
  | 'format'
  | 'geotiffloader'
  | 'geotiffsource'
  | 'ometiffsource';

const GEOTIFF_DOCS_TABS: GeoTiffDocsTab[] = [
  {id: 'geotiff-example', label: 'Try GeoTIFF', href: '/examples/geospatial/geotiff'},
  {id: 'ometiff-example', label: 'Try OME-TIFF', href: '/examples/bioimaging/ome-tiff'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/geotiff'},
  {id: 'format', label: 'Format', href: '/docs/modules/geotiff/formats/geotiff'},
  {
    id: 'geotiffloader',
    label: 'GeoTIFFLoader',
    href: '/docs/modules/geotiff/api-reference/geotiff-loader'
  },
  {
    id: 'geotiffsource',
    label: 'GeoTIFFSourceLoader',
    href: '/docs/modules/geotiff/api-reference/geotiff-source-loader'
  },
  {
    id: 'ometiffsource',
    label: 'OMETiffSourceLoader',
    href: '/docs/modules/geotiff/api-reference/ometiff-source-loader'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for GeoTIFF documentation pages.
 */
export function GeoTiffDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: GeoTiffDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="GeoTIFF documentation sections">
      {GEOTIFF_DOCS_TABS.map(tab => (
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
