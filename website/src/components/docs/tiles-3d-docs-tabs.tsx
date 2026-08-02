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
  | 'runtime'
  | 'resources'
  | 'hierarchy'
  | 'implicit'
  | 'sse-lod'
  | 'requests'
  | 'cache'
  | 'diagnostics';

const TILES_3D_DOCS_TABS: Tiles3DDocsTab[] = [
  {id: 'module', label: 'Module', href: '/docs/modules/3d-tiles'},
  {id: 'runtime', label: 'Runtime', href: '/docs/modules/3d-tiles/concepts'},
  {
    id: 'resources',
    label: 'Resources',
    href: '/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection'
  },
  {
    id: 'hierarchy',
    label: 'Hierarchy',
    href: '/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement'
  },
  {
    id: 'implicit',
    label: 'Implicit',
    href: '/docs/modules/3d-tiles/concepts/implicit-tiling-and-subtrees'
  },
  {
    id: 'sse-lod',
    label: 'SSE / LOD',
    href: '/docs/modules/3d-tiles/concepts/screen-space-error-and-lod'
  },
  {
    id: 'requests',
    label: 'Requests',
    href: '/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities'
  },
  {
    id: 'cache',
    label: 'Cache',
    href: '/docs/modules/3d-tiles/concepts/caching-and-memory'
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    href: '/docs/modules/3d-tiles/concepts/runtime-tuning-and-diagnostics'
  }
];

/** Renders links between the 3D Tiles module and runtime-concepts documentation pages. */
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
