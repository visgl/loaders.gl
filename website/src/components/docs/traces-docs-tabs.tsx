import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type TracesDocsTab = {
  /** Stable tab identifier. */
  id: TracesDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Traces documentation tab identifiers. */
export type TracesDocsTabId = 'try-it' | 'overview' | 'chrome-trace' | 'chrometraceloader';

const TRACES_DOCS_TABS: TracesDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/traces/chrome-trace'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/traces'},
  {
    id: 'chrome-trace',
    label: 'Chrome Trace',
    href: '/docs/modules/traces/formats/chrome-trace'
  },
  {
    id: 'chrometraceloader',
    label: 'ChromeTraceLoader',
    href: '/docs/modules/traces/api-reference/chrome-trace-loader'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for Traces documentation pages.
 */
export function TracesDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: TracesDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Traces documentation sections">
      {TRACES_DOCS_TABS.map(tab => (
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
