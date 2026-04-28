import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type CsvDocsTab = {
  /** Stable tab identifier. */
  id: CsvDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** CSV documentation tab identifiers. */
export type CsvDocsTabId =
  | 'overview'
  | 'format'
  | 'csvloader'
  | 'csvwriter'
  | 'try-it'
  | 'benchmarks';

const CSV_DOCS_TABS: CsvDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/geospatial/csv'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/csv/formats/csv'},
  {id: 'format', label: 'Format', href: '/docs/modules/csv/format'},
  {id: 'csvloader', label: 'CSVLoader', href: '/docs/modules/csv/api-reference/csv-loader'},
  {id: 'csvwriter', label: 'CSVWriter', href: '/docs/modules/csv/api-reference/csv-writer'},
  {id: 'benchmarks', label: 'Benchmarks', href: '/docs/modules/csv/benchmarks'}
];

/**
 * Renders page links with the same visual treatment as tabs for CSV documentation pages.
 */
export function CsvDocsTabs({active}: {/** Active tab identifier. */ active: CsvDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="CSV documentation sections">
      {CSV_DOCS_TABS.map(tab => (
        <Link
          key={tab.id}
          className={tab.id === active ? 'docs-page-tabs__tab docs-page-tabs__tab--active' : 'docs-page-tabs__tab'}
          to={tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
