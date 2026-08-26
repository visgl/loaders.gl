import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type WmsDocsTab = {
  /** Stable tab identifier. */
  id: WmsDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** WMS service documentation tab identifiers. */
export type WmsDocsTabId =
  | 'wms-example'
  | 'wfs-example'
  | 'wmts-example'
  | 'arcgis-image-server-example'
  | 'arcgis-feature-server-example'
  | 'arcgis-map-server-example'
  | 'wcs'
  | 'wfs'
  | 'wmc'
  | 'wms'
  | 'wmts'
  | 'arcgis-image-server'
  | 'arcgis-feature-server'
  | 'arcgis-map-server';

const WMS_TAB_GROUPS: Record<string, WmsDocsTab[]> = {
  wms: [
    {id: 'wms-example', label: 'Try WMS', href: '/examples/tiles/wms'},
    {id: 'wms', label: 'WMS', href: '/docs/modules/wms/formats/wms'}
  ],
  wfs: [
    {id: 'wfs-example', label: 'Try WFS', href: '/examples/tiles/wfs'},
    {id: 'wfs', label: 'WFS', href: '/docs/modules/wms/formats/wfs'}
  ],
  arcgisImageServer: [
    {
      id: 'arcgis-image-server-example',
      label: 'Try ArcGIS Image',
      href: '/examples/tiles/arcgis-image-server'
    },
    {
      id: 'arcgis-image-server',
      label: 'ArcGIS Image Server',
      href: '/docs/modules/wms/services/arcgis-image-server'
    }
  ],
  arcgisFeatureServer: [
    {
      id: 'arcgis-feature-server-example',
      label: 'Try ArcGIS Feature',
      href: '/examples/tiles/arcgis-feature-server'
    },
    {
      id: 'arcgis-feature-server',
      label: 'ArcGIS Feature Server',
      href: '/docs/modules/wms/services/arcgis-feature-server'
    }
  ],
  arcgisMapServer: [
    {
      id: 'arcgis-map-server-example',
      label: 'Try ArcGIS Map',
      href: '/examples/tiles/arcgis-map-server'
    },
    {
      id: 'arcgis-map-server',
      label: 'ArcGIS MapServer',
      href: '/docs/modules/wms/services/arcgis-map-server'
    }
  ],
  wcs: [{id: 'wcs', label: 'WCS', href: '/docs/modules/wms/formats/wcs'}],
  wmc: [{id: 'wmc', label: 'WMC', href: '/docs/modules/wms/formats/wmc'}],
  wmts: [
    {id: 'wmts-example', label: 'Try WMTS', href: '/examples/tiles/wmts'},
    {id: 'wmts', label: 'WMTS', href: '/docs/modules/wms/formats/wmts'}
  ]
};

function getWmsTabs(active: WmsDocsTabId): WmsDocsTab[] {
  if (active === 'wms-example' || active === 'wms') {
    return WMS_TAB_GROUPS.wms;
  }
  if (active === 'wfs-example' || active === 'wfs') {
    return WMS_TAB_GROUPS.wfs;
  }
  if (active === 'arcgis-image-server-example' || active === 'arcgis-image-server') {
    return WMS_TAB_GROUPS.arcgisImageServer;
  }
  if (active === 'arcgis-feature-server-example' || active === 'arcgis-feature-server') {
    return WMS_TAB_GROUPS.arcgisFeatureServer;
  }
  if (active === 'arcgis-map-server-example' || active === 'arcgis-map-server') {
    return WMS_TAB_GROUPS.arcgisMapServer;
  }
  if (active === 'wmts-example' || active === 'wmts') {
    return WMS_TAB_GROUPS.wmts;
  }
  return WMS_TAB_GROUPS[active];
}

/**
 * Renders page links with the same visual treatment as tabs for WMS service documentation pages.
 */
export function WmsDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: WmsDocsTabId;
}): ReactNode {
  const tabs = getWmsTabs(active);

  return (
    <nav className="docs-page-tabs" aria-label="WMS service documentation sections">
      {tabs.map(tab => (
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
