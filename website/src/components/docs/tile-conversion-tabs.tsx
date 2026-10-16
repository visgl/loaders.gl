import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

/** Switches between the two inline browser conversion applications. */
export function TileConversionTabs({
  active
}: {
  /** Application currently displayed. */
  active: 'pmtiles' | '3d-tiles';
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Tile conversion examples">
      <Link
        className={
          'docs-page-tabs__tab' + (active === 'pmtiles' ? ' docs-page-tabs__tab--active' : '')
        }
        aria-current={active === 'pmtiles' ? 'page' : undefined}
        to="/examples/tiles/pmtiles-authoring"
      >
        Create PMTiles
      </Link>
      <Link
        className={
          'docs-page-tabs__tab' + (active === '3d-tiles' ? ' docs-page-tabs__tab--active' : '')
        }
        aria-current={active === '3d-tiles' ? 'page' : undefined}
        to="/examples/tiles/3d-tiles-conversion"
      >
        Convert 3D tiles
      </Link>
    </nav>
  );
}
