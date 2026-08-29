import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type Tiles3DDocsTab = {
  /** Stable tab identifier. */
  id: Tiles3DDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** 3D Tiles documentation tab identifiers. */
export type Tiles3DDocsTabId =
  | 'module'
  | 'format'
  | 'loader'
  | 'runtime'
  | 'source';

const TILES_3D_DOCS_TABS: Tiles3DDocsTab[] = [
  {id: 'module', label: 'Module', href: '/docs/modules/3d-tiles'},
  {id: 'format', label: 'Format', href: '/docs/modules/3d-tiles/formats/3d-tiles'},
  {id: 'loader', label: 'Loader API', href: '/docs/modules/3d-tiles/api-reference/tiles-3d-loader'},
  {id: 'runtime', label: 'Runtime guides', href: '/docs/modules/3d-tiles/concepts'},
  {
    id: 'source',
    label: 'Source API',
    href: '/docs/modules/tiles/api-reference/tiles-3d-source'
  }
];

/** Renders the primary navigation for the 3D Tiles documentation. */
export function Tiles3DDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: Tiles3DDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="3D Tiles documentation sections">
      {TILES_3D_DOCS_TABS.map(tab => (
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
