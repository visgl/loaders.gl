import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ObjDocsTab = {
  /** Stable tab identifier. */
  id: ObjDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** OBJ documentation tab identifiers. */
export type ObjDocsTabId = 'overview' | 'try-it' | 'format' | 'objloader' | 'objwriter';

const OBJ_DOCS_TABS: ObjDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/pointclouds/obj'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/obj/formats/obj'},
  {id: 'format', label: 'Format', href: '/docs/modules/obj/format'},
  {id: 'objloader', label: 'OBJLoader', href: '/docs/modules/obj/api-reference/obj-loader'},
  {id: 'objwriter', label: 'OBJWriter', href: '/docs/modules/obj/api-reference/obj-writer'}
];

/**
 * Renders page links with the same visual treatment as tabs for OBJ documentation pages.
 */
export function ObjDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: ObjDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="OBJ documentation sections">
      {OBJ_DOCS_TABS.map(tab => (
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
