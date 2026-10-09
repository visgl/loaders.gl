import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import copcLogo from '../../../../docs/images/logos/copc-logo-80.png';
import styles from './format-logo-gallery.module.css';

export type FormatTag = 'tables' | 'geospatial' | 'services' | 'textures' | 'pointclouds' | 'meshes';

export type FormatMetadata = {
  readonly label: string;
  readonly slug: string;
  /** Official project asset, when available. */
  readonly logo?: string;
  /** Readable name or service suffix for assets without a legible wordmark. */
  readonly logoText?: string;
  /** Identifies a composite badge with the official OGC mark. */
  readonly ogc?: boolean;
  /** Optical size adjustment for assets with different intrinsic margins. */
  readonly logoScale?: number;
  /** Backing surface for an official asset supplied on a dark background. */
  readonly logoSurface?: 'dark';
  /** Short neutral mark used when no official or ecosystem logo is available. */
  readonly mark?: string;
  readonly tags: readonly FormatTag[];
};

/** Metadata used to label, classify, and select an asset for every format and service in the gallery. */
export const FORMAT_METADATA: ReadonlyArray<FormatMetadata> = [
  {slug: 'arrow', label: 'Arrow', logo: 'apache-arrow-logo.png', tags: ['tables']},
  {slug: 'basis', label: 'Basis', mark: 'BASIS', tags: ['textures']},
  {slug: 'bson', label: 'BSON', logo: 'bson-logo.png', tags: []},
  {slug: 'chrome-trace', label: 'Chrome Trace', logo: '/images/examples/traces/chrome.svg', logoText: 'Trace', tags: []},
  {slug: 'compressed-textures', label: 'Compressed Textures', mark: 'GPU', tags: ['textures']},
  {slug: 'copc', label: 'COPC', logo: copcLogo, tags: ['geospatial', 'pointclouds']},
  {slug: 'crunch', label: 'Crunch', mark: 'Crunch', tags: ['textures']},
  {slug: 'csv', label: 'CSV', mark: 'CSV', tags: ['tables']},
  {slug: 'csw', label: 'CSW', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'dds', label: 'DDS', mark: 'DDS', tags: ['textures']},
  {slug: 'draco', label: 'Draco', logo: 'draco-logo.svg', tags: ['pointclouds', 'meshes']},
  {slug: 'flatgeobuf', label: 'FlatGeobuf', logo: 'flatgeobuf-logo.png', tags: ['geospatial']},
  {slug: 'geoarrow', label: 'GeoArrow', logo: 'geoarrow-logo.png', logoText: 'GeoArrow', tags: ['tables', 'geospatial']},
  {slug: 'geojson', label: 'GeoJSON', mark: 'GeoJSON', tags: ['geospatial']},
  {slug: 'geopackage', label: 'GeoPackage', ogc: true, tags: ['geospatial']},
  {slug: 'geoparquet', label: 'GeoParquet', mark: 'GeoParquet', tags: ['tables', 'geospatial']},
  {slug: 'geotiff', label: 'GeoTIFF', ogc: true, tags: ['geospatial']},
  {slug: '3d-tiles', label: '3D Tiles', logo: '3d-tiles-logo.png', tags: ['geospatial', 'meshes']},
  {slug: 'glb', label: 'GLB', logo: 'gltf-logo.svg', logoText: 'GLB', tags: ['meshes']},
  {slug: 'gltf', label: 'glTF', logo: 'gltf-logo.svg', logoScale: 1.15, tags: ['meshes']},
  {slug: 'gml', label: 'GML', ogc: true, tags: ['geospatial']},
  {slug: 'gpx', label: 'GPX', mark: 'GPX', tags: ['geospatial']},
  {slug: 'hdr', label: 'Radiance HDR', mark: 'HDR', tags: ['textures']},
  {slug: 'html', label: 'HTML', mark: 'HTML', tags: []},
  {slug: 'i3s', label: 'I3S', ogc: true, tags: ['geospatial', 'meshes']},
  {slug: 'json', label: 'JSON', logo: 'json-logo.gif', logoText: 'JSON', tags: ['tables']},
  {slug: 'toml', label: 'TOML', logo: 'toml-logo.svg', tags: []},
  {slug: 'kml', label: 'KML', ogc: true, tags: ['geospatial']},
  {slug: 'ktx', label: 'KTX / KTX2', logo: 'ktx-logo.svg', tags: ['textures']},
  {slug: 'las', label: 'LAS', mark: 'LAS', tags: ['geospatial', 'pointclouds']},
  {slug: 'lerc', label: 'LERC', mark: 'LERC', tags: ['geospatial']},
  {slug: 'map-style', label: 'Map Style', mark: 'STYLE', tags: ['geospatial', 'services']},
  {slug: 'mlt', label: 'MapLibre Tile', mark: 'MLT', tags: ['geospatial']},
  {slug: 'mvt', label: 'MVT', mark: 'MVT', tags: ['geospatial']},
  {slug: 'netcdf', label: 'NetCDF', logo: 'netcdf-logo.png', logoText: 'NetCDF', logoScale: 1.15, tags: ['geospatial', 'tables']},
  {slug: 'obj', label: 'OBJ', mark: 'OBJ', tags: ['meshes']},
  {slug: 'ogc-api', label: 'OGC API Services', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'ows-context', label: 'OWS Context', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'orc', label: 'ORC', logo: 'orc-logo.png', tags: ['tables']},
  {slug: 'parquet', label: 'Parquet', logo: 'parquet-logo.png', tags: ['tables']},
  {slug: 'pcd', label: 'PCD', mark: 'PCD', tags: ['pointclouds']},
  {slug: 'perfetto-trace', label: 'Perfetto Trace', logo: 'perfetto-logo.png', logoText: 'Perfetto', tags: []},
  {slug: 'ply', label: 'PLY', mark: 'PLY', tags: ['pointclouds', 'meshes']},
  {slug: 'pmtiles', label: 'PMTiles', mark: 'PMTiles', tags: ['geospatial']},
  {slug: 'pvr', label: 'PVR', mark: 'PVR', tags: ['textures']},
  {slug: 'shapefile', label: 'Shapefile', mark: 'SHP', tags: ['geospatial']},
  {slug: 'stac', label: 'STAC', logo: 'stac-logo.png', logoScale: 1.15, tags: ['geospatial', 'services']},
  {slug: 'tcx', label: 'TCX', mark: 'TCX', tags: ['geospatial']},
  {slug: 'tilejson', label: 'TileJSON', mark: 'TileJSON', tags: ['geospatial', 'services']},
  {slug: 'usd', label: 'OpenUSD', logo: 'openusd-logo.svg', logoText: 'OpenUSD', tags: ['meshes']},
  {slug: 'wkb', label: 'WKB', ogc: true, tags: ['geospatial']},
  {slug: 'wkt', label: 'WKT', ogc: true, tags: ['geospatial']},
  {slug: 'wkt-crs', label: 'WKT-CRS', ogc: true, tags: ['geospatial']},
  {slug: 'xml', label: 'XML', mark: 'XML', tags: []},
  {slug: 'yaml', label: 'YAML', logo: 'yaml-logo.svg', tags: []},
  {slug: 'zarr', label: 'Zarr', logo: 'zarr-logo.svg', tags: ['geospatial', 'tables']},
  {slug: 'zip', label: 'ZIP', mark: 'ZIP', tags: []},
  {slug: 'wcs', label: 'WCS', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'wfs', label: 'WFS', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'wmc', label: 'WMC', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'wms', label: 'WMS', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'wmts', label: 'WMTS', ogc: true, tags: ['geospatial', 'services']},
  {slug: 'arcgis-image-server', logoText: 'Image', label: 'ArcGIS Image Server', logo: 'arcgis-logo.jpg', logoScale: 2.5, logoSurface: 'dark', tags: ['geospatial', 'services']},
  {slug: 'arcgis-feature-server', logoText: 'Feature', label: 'ArcGIS Feature Server', logo: 'arcgis-logo.jpg', logoScale: 2.5, logoSurface: 'dark', tags: ['geospatial', 'services']},
  {slug: 'arcgis-map-server', logoText: 'Map', label: 'ArcGIS MapServer', logo: 'arcgis-logo.jpg', logoScale: 2.5, logoSurface: 'dark', tags: ['geospatial', 'services']},
  {slug: 'arcgis-vector-tile-server', logoText: 'Vector Tile', label: 'ArcGIS VectorTileServer', logo: 'arcgis-logo.jpg', logoScale: 2.5, logoSurface: 'dark', tags: ['geospatial', 'services']},
  {slug: 'arcgis-scene-server', logoText: 'Scene', label: 'ArcGIS Scene Server', logo: 'arcgis-logo.jpg', logoScale: 2.5, logoSurface: 'dark', tags: ['geospatial', 'services']},
  {slug: 'arcgis', logoText: 'API', label: 'ArcGIS API Reference', logo: 'arcgis-logo.jpg', logoScale: 2.5, logoSurface: 'dark', tags: ['geospatial', 'services']}
];

/** Resolves a gallery logo from either the static gallery directory or a bundled asset import. */
function getLogoUrl(logo: string, logoBaseUrl: string): string {
  return logo.startsWith('/') || logo.startsWith('data:') || logo.includes('://')
    ? logo
    : `${logoBaseUrl}/${logo}`;
}

/** Draws a simple category symbol for a format without an official logo. */
function FormatSymbol({format}: {format: FormatMetadata}) {
  let drawing: React.ReactNode;
  if (format.tags.includes('tables')) {
    drawing = <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 9v11M15 9v11" /></>;
  } else if (format.tags.includes('textures')) {
    drawing = <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /><path d="M3 3h6v6H3zM9 9h6v6H9zM15 15h6v6h-6z" fill="currentColor" stroke="none" /></>;
  } else if (format.tags.includes('pointclouds')) {
    drawing = <>{[[5,7],[12,4],[19,8],[8,13],[16,15],[5,20],[12,21],[21,20]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor" stroke="none" />)}</>;
  } else if (format.tags.includes('meshes')) {
    drawing = <path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M12 2v10M3 17l9-5 9 5" />;
  } else if (format.tags.includes('geospatial')) {
    drawing = <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16" />;
  } else {
    drawing = <path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 4l-4 16" />;
  }
  return <svg className={styles.badgeSymbol} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawing}</svg>;
}

/** Renders official logos and simple format badges within the same visual area. */
function FormatVisual({
  format,
  logoBaseUrl
}: {
  format: FormatMetadata;
  logoBaseUrl: string;
}) {
  const visualClass = `${styles.visual} ${format.logoSurface === 'dark' ? styles.darkVisual : ''}`;

  if (format.ogc) {
    return (
      <span
        className={`${visualClass} ${styles.ogcBadge}`}
        role="img"
        aria-label={`${format.label.startsWith('OGC') ? format.label : `OGC ${format.label}`} format badge`}
      >
        <span className={styles.ogcIdentity} aria-hidden="true">
          <img className={styles.ogcLogo} src={getLogoUrl('ogc-mark.svg', logoBaseUrl)} alt="" loading="lazy" />
          <span>OGC</span>
        </span>
        <span className={styles.badgeName} aria-hidden="true">
          {format.label === 'OGC API Services' ? 'API' : format.label}
        </span>
      </span>
    );
  }

  if (!format.logo) {
    return (
      <span
        className={`${visualClass} ${styles.formatBadge}`}
        data-category={format.tags[0] ?? 'other'}
        role="img"
        aria-label={`${format.label} format badge`}
      >
        <FormatSymbol format={format} />
        <span className={styles.badgeName} aria-hidden="true">
          {format.mark ?? format.label}
        </span>
      </span>
    );
  }

  if (format.logoText) {
    return <span className={`${visualClass} ${styles.compositeLogo}`} role="img" aria-label={`${format.label} logo`}>
      <span className={format.logoSurface === 'dark' ? styles.arcgisLogo : styles.smallLogo}>
        <img alt="" loading="lazy" src={getLogoUrl(format.logo, logoBaseUrl)} />
      </span>
      <span className={styles.badgeName} aria-hidden="true">{format.logoText}</span>
    </span>;
  }
  return (
    <span className={visualClass} role="img" aria-label={`${format.label} logo`}>
      <img
        className={styles.logo}
        alt=""
        loading="lazy"
        src={getLogoUrl(format.logo, logoBaseUrl)}
        style={{transform: `scale(${format.logoScale ?? 1})`}}
      />
    </span>
  );
}

/** Displays the canonical logo or badge for a format throughout the documentation. */
export function FormatLogo({slug}: {
  /** Stable format or service identifier from the gallery registry. */
  slug: string;
}) {
  const logoBaseUrl = useBaseUrl('/images/format-logos');
  const format = FORMAT_METADATA.find(entry => entry.slug === slug);
  if (!format) {
    throw new Error(`Unknown documentation format logo: ${slug}`);
  }
  return <span className={styles.logoContainer} data-format-logo={slug}><FormatVisual format={format} logoBaseUrl={logoBaseUrl} /></span>;
}
