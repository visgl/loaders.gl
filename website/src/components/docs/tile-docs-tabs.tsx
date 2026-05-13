import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type TileDocsTab = {
  /** Stable tab identifier. */
  id: TileDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation or example page URL. */
  href: string;
};

/** Geospatial tile documentation tab identifiers. */
export type TileDocsTabId =
  | 'mvt-example'
  | 'pmtiles-example'
  | 'table-tiler-example'
  | 'mlt-example'
  | 'mvt'
  | 'pmtiles'
  | 'table-tile-source-loader'
  | 'mlt';

const TILE_DOCS_TABS: TileDocsTab[] = [
  {id: 'mvt-example', label: 'Try MVT', href: '/examples/tiles/mvt'},
  {id: 'pmtiles-example', label: 'Try PMTiles', href: '/examples/tiles/pmtiles'},
  {id: 'table-tiler-example', label: 'Try Table Tiler', href: '/examples/tiles/table-tiler'},
  {id: 'mlt-example', label: 'Try MLT', href: '/examples/tiles/mlt'},
  {id: 'mvt', label: 'MVT', href: '/docs/modules/mvt/formats/mvt'},
  {id: 'pmtiles', label: 'PMTiles', href: '/docs/modules/pmtiles/formats/pmtiles'},
  {
    id: 'table-tile-source-loader',
    label: 'TableTileSourceLoader',
    href: '/docs/modules/mvt/api-reference/table-tile-source-loader'
  },
  {id: 'mlt', label: 'MLT', href: '/docs/modules/mlt/formats/mlt'}
];

/**
 * Renders page links with the same visual treatment as tabs for geospatial tile pages.
 */
export function TileDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: TileDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Geospatial tile documentation sections">
      {TILE_DOCS_TABS.map(tab => (
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
