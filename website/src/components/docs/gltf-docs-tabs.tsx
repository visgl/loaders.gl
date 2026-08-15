import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type GltfDocsTab = {
  /** Stable tab identifier. */
  id: GltfDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** glTF documentation tab identifiers. */
export type GltfDocsTabId = 'overview' | 'format' | 'gltf-loader' | 'post-processing';

const GLTF_DOCS_TABS: GltfDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/modules/gltf'},
  {id: 'format', label: 'glTF Format', href: '/docs/modules/gltf/formats/gltf'},
  {id: 'gltf-loader', label: 'GLTFLoader', href: '/docs/modules/gltf/api-reference/gltf-loader'},
  {
    id: 'post-processing',
    label: 'Post-processing',
    href: '/docs/modules/gltf/api-reference/post-process-gltf'
  }
];

/** Renders links between the glTF pages that describe loading and mesh decompression. */
export function GltfDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: GltfDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="glTF documentation sections">
      {GLTF_DOCS_TABS.map(tab => (
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
