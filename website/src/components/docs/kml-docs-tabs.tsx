import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type KmlDocsTab = {
  /** Stable tab identifier. */
  id: KmlDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** KML module documentation tab identifiers. */
export type KmlDocsTabId =
  | 'overview'
  | 'try-it'
  | 'format'
  | 'gpx'
  | 'tcx'
  | 'kmlloader'
  | 'gpxloader'
  | 'tcxloader';

const KML_DOCS_TABS: KmlDocsTab[] = [
  {id: 'try-it', label: 'Try It', href: '/examples/geospatial/kml'},
  {id: 'overview', label: 'Overview', href: '/docs/modules/kml/formats/kml'},
  {id: 'format', label: 'Format', href: '/docs/modules/kml/format'},
  {id: 'gpx', label: 'GPX', href: '/docs/modules/kml/formats/gpx'},
  {id: 'tcx', label: 'TCX', href: '/docs/modules/kml/formats/tcx'},
  {id: 'kmlloader', label: 'KMLLoader', href: '/docs/modules/kml/api-reference/kml-loader'},
  {id: 'gpxloader', label: 'GPXLoader', href: '/docs/modules/kml/api-reference/gpx-loader'},
  {id: 'tcxloader', label: 'TCXLoader', href: '/docs/modules/kml/api-reference/tcx-loader'}
];

/**
 * Renders page links with the same visual treatment as tabs for KML module documentation pages.
 */
export function KmlDocsTabs({
  active,
  tryItHref = '/examples/geospatial/kml'
}: {
  /** Active tab identifier. */
  active: KmlDocsTabId;
  /** Example page URL for the active KML-family format. */
  tryItHref?: string;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="KML module documentation sections">
      {KML_DOCS_TABS.map(tab => (
        <Link
          key={tab.id}
          className={
            tab.id === active
              ? 'docs-page-tabs__tab docs-page-tabs__tab--active'
              : 'docs-page-tabs__tab'
          }
          to={tab.id === 'try-it' ? tryItHref : tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
