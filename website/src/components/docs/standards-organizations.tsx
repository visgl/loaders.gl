import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './standards-organizations.module.css';

type StandardsLink = {
  /** Standard or implementation family displayed to readers. */
  label: string;
  /** Documentation or example destination. */
  to: string;
};

type StandardsGroup = {
  /** Short context for the group. */
  eyebrow: string;
  /** Organization or workload name. */
  title: string;
  /** Plain-language relationship to loaders.gl. */
  description: string;
  /** Implemented formats and services in this group. */
  links: readonly StandardsLink[];
};

const STANDARD_FAMILIES: readonly StandardsGroup[] = [
  {
    eyebrow: 'Scenes, meshes, textures',
    title: '3D and graphics',
    description: 'Portable scene, tiled-world, point-cloud, mesh-compression, and GPU texture formats.',
    links: [
      {label: 'glTF / GLB', to: '/docs/modules/gltf/formats/gltf'},
      {label: '3D Tiles', to: '/docs/modules/3d-tiles/formats/3d-tiles'},
      {label: 'I3S / SLPK', to: '/docs/modules/i3s/formats/i3s'},
      {label: 'Draco', to: '/docs/modules/draco/formats/draco'},
      {label: 'KTX / KTX2', to: '/docs/modules/textures/formats/ktx'},
      {label: 'Basis', to: '/docs/modules/textures/formats/basis'},
      {label: 'LAS / LAZ', to: '/docs/modules/las/formats/las'},
      {label: 'COPC', to: '/docs/modules/copc/formats/copc'},
      {label: 'OpenUSD', to: '/docs/modules/scene/formats/usd'}
    ]
  },
  {
    eyebrow: 'Typed data at scale',
    title: 'Columnar and analytical',
    description: 'Formats that preserve schemas, columns, batches, and cloud-selective layouts.',
    links: [
      {label: 'Apache Arrow', to: '/docs/modules/arrow/formats/arrow'},
      {label: 'GeoArrow', to: '/docs/modules/arrow/formats/geoarrow'},
      {label: 'Apache Parquet', to: '/docs/modules/parquet/formats/parquet'},
      {label: 'GeoParquet', to: '/docs/modules/parquet/formats/geoparquet'},
      {label: 'Apache Avro', to: '/examples/table/avro'},
      {label: 'Apache ORC', to: '/docs/modules/orc/formats/orc'},
      {label: 'Apache Iceberg', to: '/docs/modules/parquet/api-reference/iceberg-table-source'}
    ]
  },
  {
    eyebrow: 'Portable spatial data',
    title: 'Geospatial files',
    description: 'Interoperable feature, raster, catalog, geometry, and archive formats.',
    links: [
      {label: 'GeoJSON', to: '/docs/modules/json/formats/geojson'},
      {label: 'KML / KMZ', to: '/docs/modules/kml/formats/kml'},
      {label: 'GeoPackage', to: '/docs/modules/geopackage/formats/geopackage'},
      {label: 'GeoTIFF', to: '/docs/modules/geotiff/formats/geotiff'},
      {label: 'FlatGeobuf', to: '/docs/modules/flatgeobuf/formats/flatgeobuf'},
      {label: 'Shapefile', to: '/docs/modules/shapefile/formats/shapefile'},
      {label: 'WKT / WKB', to: '/docs/modules/wkt/formats/wkt'},
      {label: 'WKT-CRS', to: '/docs/modules/wkt/formats/wkt-crs'},
      {label: 'STAC', to: '/docs/modules/stac/formats/stac'}
    ]
  },
  {
    eyebrow: 'Metadata plus requests',
    title: 'Network services',
    description: 'Standards and vendor APIs where discovery is followed by bounded requests.',
    links: [
      {label: 'WMS', to: '/docs/modules/wms/formats/wms'},
      {label: 'WMTS', to: '/docs/modules/wms/formats/wmts'},
      {label: 'WFS', to: '/docs/modules/wms/formats/wfs'},
      {label: 'WCS', to: '/docs/modules/wms/formats/wcs'},
      {label: 'CSW', to: '/docs/modules/wms/formats/csw'},
      {label: 'OGC API', to: '/docs/modules/wms/services/ogc-api'},
      {label: 'ArcGIS REST', to: '/docs/modules/services'}
    ]
  }
];

const ORGANIZATIONS: readonly StandardsGroup[] = [
  {
    eyebrow: 'Open data systems',
    title: 'Apache',
    description: 'Binary table, storage, serialization, and table-catalog projects used by large-data pipelines.',
    links: [
      {label: 'Arrow', to: '/docs/modules/arrow/formats/arrow'},
      {label: 'Parquet', to: '/docs/modules/parquet/formats/parquet'},
      {label: 'Avro', to: '/examples/table/avro'},
      {label: 'ORC', to: '/docs/modules/orc/formats/orc'},
      {label: 'Iceberg', to: '/docs/modules/parquet/api-reference/iceberg-table-source'}
    ]
  },
  {
    eyebrow: 'Portable 3D and GPU assets',
    title: 'Khronos',
    description: 'Scene and texture standards designed to move renderable assets between tools and runtimes.',
    links: [
      {label: 'glTF', to: '/docs/modules/gltf/formats/gltf'},
      {label: 'GLB', to: '/docs/modules/gltf/formats/glb'},
      {label: 'KTX / KTX2', to: '/docs/modules/textures/formats/ktx'},
      {label: 'Basis in glTF', to: '/docs/modules/gltf/formats/gltf#khr_texture_basisu'}
    ]
  },
  {
    eyebrow: 'Open geospatial interoperability',
    title: 'OGC',
    description: 'File formats, geometry models, coordinate descriptions, tiled scenes, and web-service protocols.',
    links: [
      {label: '3D Tiles', to: '/docs/modules/3d-tiles/formats/3d-tiles'},
      {label: 'I3S', to: '/docs/modules/i3s/formats/i3s'},
      {label: 'GeoPackage', to: '/docs/modules/geopackage/formats/geopackage'},
      {label: 'GeoTIFF', to: '/docs/modules/geotiff/formats/geotiff'},
      {label: 'KML', to: '/docs/modules/kml/formats/kml'},
      {label: 'GML', to: '/docs/modules/wms/formats/gml'},
      {label: 'WKT / WKB', to: '/docs/modules/wkt/formats/wkt'},
      {label: 'Web services', to: '/docs/modules/wms'}
    ]
  },
  {
    eyebrow: 'Scene and mapping services',
    title: 'Esri / ArcGIS',
    description: 'Scene layers, raster compression, and ArcGIS REST services connected to common loaders.gl sources.',
    links: [
      {label: 'I3S / SLPK', to: '/docs/modules/i3s/formats/i3s'},
      {label: 'LERC', to: '/docs/modules/lerc/formats/lerc'},
      {label: 'FeatureServer', to: '/docs/modules/services/arcgis-feature-server'},
      {label: 'MapServer', to: '/docs/modules/services/arcgis-map-server'},
      {label: 'ImageServer', to: '/docs/modules/services/arcgis-image-server'},
      {label: 'VectorTileServer', to: '/docs/modules/services/arcgis-vector-tile-server'},
      {label: 'SceneServer', to: '/docs/modules/services/arcgis-scene-server'}
    ]
  },
  {
    eyebrow: 'Internet and point-cloud standards',
    title: 'IETF, ASPRS, Cesium, AOUSD',
    description: 'Important specifications stewarded outside the four largest format families.',
    links: [
      {label: 'IETF GeoJSON', to: '/docs/modules/json/formats/geojson'},
      {label: 'ASPRS LAS / LAZ', to: '/docs/modules/las/formats/las'},
      {label: 'Cesium 3D Tiles', to: '/docs/modules/3d-tiles/formats/3d-tiles'},
      {label: 'AOUSD OpenUSD', to: '/docs/modules/scene/formats/usd'},
      {label: 'COPC', to: '/docs/modules/copc/formats/copc'}
    ]
  }
];

/** Renders implemented standards first, then the organizations that steward them. */
export function StandardsOrganizations(): ReactNode {
  return (
    <div className={styles.catalog}>
      <StandardsSection
        eyebrow="Implemented catalog"
        title="Standards by workload"
        description="Start with the kind of data you have. Every link lands on the loaders.gl page that records the real implementation boundary."
        groups={STANDARD_FAMILIES}
      />
      <StandardsSection
        eyebrow="Ecosystem map"
        title="Organizations"
        description="The same catalog grouped by the communities and standards bodies that define or steward it."
        groups={ORGANIZATIONS}
      />
    </div>
  );
}

function StandardsSection({eyebrow, title, description, groups}: {
  /** Short section label. */
  eyebrow: string;
  /** Section title. */
  title: string;
  /** Section introduction. */
  description: string;
  /** Cards rendered in the section. */
  groups: readonly StandardsGroup[];
}): ReactNode {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        <span>{description}</span>
      </header>
      <div className={styles.grid}>
        {groups.map(group => (
          <article className={styles.card} key={group.title}>
            <p className={styles.eyebrow}>{group.eyebrow}</p>
            <h3>{group.title}</h3>
            <p className={styles.description}>{group.description}</p>
            <div className={styles.links}>
              {group.links.map(link => (
                <Link key={link.to} to={link.to}>
                  {link.label} <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
