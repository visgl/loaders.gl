import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type XmlDocsTab = {
  /** Stable tab identifier. */
  id: XmlDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** XML documentation tab identifiers. */
export type XmlDocsTabId = 'overview' | 'try-it' | 'format' | 'xmlloader' | 'html' | 'htmlloader';

const XML_DOCS_TABS: XmlDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/table/xml'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/xml/formats/xml'},
  {id: 'format', label: 'Format', href: '/docs/modules/xml/format'},
  {id: 'xmlloader', label: 'XMLLoader', href: '/docs/modules/xml/api-reference/xml-loader'},
  {id: 'html', label: 'HTML', href: '/docs/modules/xml/formats/html'},
  {id: 'htmlloader', label: 'HTMLLoader', href: '/docs/modules/xml/api-reference/html-loader'}
];

/**
 * Renders page links with the same visual treatment as tabs for XML documentation pages.
 */
export function XmlDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: XmlDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="XML documentation sections">
      {XML_DOCS_TABS.map(tab => (
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
