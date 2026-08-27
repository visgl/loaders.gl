import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styled from 'styled-components';

type FormatTag = 'tables' | 'geospatial' | 'services' | 'textures' | 'pointclouds' | 'meshes';
type FormatFilter = 'all' | FormatTag;

type FormatMetadata = {
  readonly label: string;
  readonly slug: string;
  readonly logo: string;
  readonly tags: readonly FormatTag[];
};

type SidebarCategory = {
  readonly label?: string;
  readonly type?: string;
  readonly items?: readonly string[];
};

const docsSidebar = require('../../../../docs/docs-sidebar.json') as readonly SidebarCategory[];

const FILTERS: ReadonlyArray<{readonly label: string; readonly value: FormatFilter}> = [
  {label: 'All', value: 'all'},
  {label: 'Tables', value: 'tables'},
  {label: 'Geospatial', value: 'geospatial'},
  {label: 'Services', value: 'services'},
  {label: 'Textures', value: 'textures'},
  {label: 'Pointclouds', value: 'pointclouds'},
  {label: 'Meshes', value: 'meshes'}
];

/** Metadata used to label, classify, and select an asset for every format and service in the gallery. */
const FORMAT_METADATA: ReadonlyArray<FormatMetadata> = [
  {slug: 'arrow', label: 'Arrow', logo: 'apache-arrow-logo.png', tags: ['tables']},
  {slug: 'basis', label: 'Basis', logo: 'format-logo.svg', tags: ['textures']},
  {slug: 'bson', label: 'BSON', logo: 'bson-logo.png', tags: []},
  {slug: 'chrome-trace', label: 'Chrome Trace', logo: 'format-logo.svg', tags: []},
  {slug: 'compressed-textures', label: 'Compressed Textures', logo: 'format-logo.svg', tags: ['textures']},
  {slug: 'copc', label: 'COPC', logo: 'format-logo.svg', tags: ['geospatial', 'pointclouds']},
  {slug: 'crunch', label: 'Crunch', logo: 'format-logo.svg', tags: ['textures']},
  {slug: 'csv', label: 'CSV', logo: 'format-logo.svg', tags: ['tables']},
  {slug: 'csw', label: 'CSW', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'dds', label: 'DDS', logo: 'format-logo.svg', tags: ['textures']},
  {slug: 'draco', label: 'Draco', logo: 'draco-logo.png', tags: ['pointclouds', 'meshes']},
  {slug: 'flatgeobuf', label: 'FlatGeobuf', logo: 'flatgeobuf-logo.png', tags: ['geospatial']},
  {slug: 'geoarrow', label: 'GeoArrow', logo: 'apache-arrow-logo.png', tags: ['tables', 'geospatial']},
  {slug: 'geojson', label: 'GeoJSON', logo: 'format-logo.svg', tags: ['geospatial']},
  {slug: 'geopackage', label: 'GeoPackage', logo: 'ogc-logo.png', tags: ['geospatial']},
  {slug: 'geoparquet', label: 'GeoParquet', logo: 'parquet-logo.png', tags: ['tables', 'geospatial']},
  {slug: 'geotiff', label: 'GeoTIFF', logo: 'ogc-logo.png', tags: ['geospatial']},
  {slug: 'glb', label: 'GLB', logo: 'gltf-logo.png', tags: ['meshes']},
  {slug: 'gltf', label: 'glTF', logo: 'gltf-logo.png', tags: ['meshes']},
  {slug: 'gml', label: 'GML', logo: 'ogc-logo.png', tags: ['geospatial']},
  {slug: 'gpx', label: 'GPX', logo: 'format-logo.svg', tags: ['geospatial']},
  {slug: 'hdr', label: 'Radiance HDR', logo: 'format-logo.svg', tags: ['textures']},
  {slug: 'html', label: 'HTML', logo: 'format-logo.svg', tags: []},
  {slug: 'json', label: 'JSON', logo: 'format-logo.svg', tags: ['tables']},
  {slug: 'kml', label: 'KML', logo: 'ogc-logo.png', tags: ['geospatial']},
  {slug: 'ktx', label: 'KTX / KTX2', logo: 'format-logo.svg', tags: ['textures']},
  {slug: 'las', label: 'LAS', logo: 'format-logo.svg', tags: ['geospatial', 'pointclouds']},
  {slug: 'lerc', label: 'LERC', logo: 'esri-logo.png', tags: ['geospatial']},
  {slug: 'map-style', label: 'Map Style', logo: 'format-logo.svg', tags: ['geospatial', 'services']},
  {slug: 'mlt', label: 'MapLibre Tile', logo: 'format-logo.svg', tags: ['geospatial']},
  {slug: 'mvt', label: 'MVT', logo: 'format-logo.svg', tags: ['geospatial']},
  {slug: 'obj', label: 'OBJ', logo: 'format-logo.svg', tags: ['meshes']},
  {slug: 'ogc-api', label: 'OGC API Services', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'ows-context', label: 'OWS Context', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'parquet', label: 'Parquet', logo: 'parquet-logo.png', tags: ['tables']},
  {slug: 'pcd', label: 'PCD', logo: 'format-logo.svg', tags: ['pointclouds']},
  {slug: 'perfetto-trace', label: 'Perfetto Trace', logo: 'format-logo.svg', tags: []},
  {slug: 'ply', label: 'PLY', logo: 'format-logo.svg', tags: ['pointclouds', 'meshes']},
  {slug: 'pmtiles', label: 'PMTiles', logo: 'format-logo.svg', tags: ['geospatial']},
  {slug: 'pvr', label: 'PVR', logo: 'format-logo.svg', tags: ['textures']},
  {slug: 'shapefile', label: 'Shapefile', logo: 'esri-logo.png', tags: ['geospatial']},
  {slug: 'tcx', label: 'TCX', logo: 'format-logo.svg', tags: ['geospatial']},
  {slug: 'tilejson', label: 'TileJSON', logo: 'format-logo.svg', tags: ['geospatial', 'services']},
  {slug: 'usd', label: 'OpenUSD', logo: 'format-logo.svg', tags: ['meshes']},
  {slug: 'wkb', label: 'WKB', logo: 'ogc-logo.png', tags: ['geospatial']},
  {slug: 'wkt', label: 'WKT', logo: 'ogc-logo.png', tags: ['geospatial']},
  {slug: 'wkt-crs', label: 'WKT-CRS', logo: 'ogc-logo.png', tags: ['geospatial']},
  {slug: 'xml', label: 'XML', logo: 'format-logo.svg', tags: []},
  {slug: 'zip', label: 'ZIP', logo: 'format-logo.svg', tags: []},
  {slug: 'wcs', label: 'WCS', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'wfs', label: 'WFS', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'wmc', label: 'WMC', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'wms', label: 'WMS', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'wmts', label: 'WMTS', logo: 'ogc-logo.png', tags: ['geospatial', 'services']},
  {slug: 'arcgis-image-server', label: 'ArcGIS Image Server', logo: 'arcgis-logo.svg', tags: ['geospatial', 'services']},
  {slug: 'arcgis-feature-server', label: 'ArcGIS Feature Server', logo: 'arcgis-logo.svg', tags: ['geospatial', 'services']},
  {slug: 'arcgis-map-server', label: 'ArcGIS MapServer', logo: 'arcgis-logo.svg', tags: ['geospatial', 'services']},
  {slug: 'arcgis-vector-tile-server', label: 'ArcGIS VectorTileServer', logo: 'arcgis-logo.svg', tags: ['geospatial', 'services']}
];

const Gallery = styled.section`
  margin: 2rem 0 2.5rem;
`;

const TabList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0 0 1rem;
`;

const Tab = styled.button<{$selected: boolean}>`
  background: ${props => (props.$selected ? 'var(--ifm-color-primary)' : 'var(--ifm-background-surface-color)')};
  border: 1px solid ${props => (props.$selected ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)')};
  border-radius: 999px;
  color: ${props => (props.$selected ? 'var(--ifm-color-white)' : 'var(--ifm-font-color-base)')};
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0.7rem 0.95rem;
`;

const Grid = styled.div`
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
`;

const Card = styled(Link)`
  align-items: center;
  background: var(--ifm-background-surface-color);
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: 14px;
  color: inherit;
  display: grid;
  gap: 0.65rem;
  grid-template-rows: 88px auto;
  min-height: 144px;
  padding: 0.85rem;
  text-decoration: none;

  &:hover {
    border-color: var(--ifm-color-primary);
    text-decoration: none;
    transform: translateY(-2px);
  }
`;

const Logo = styled.img`
  height: 56px;
  justify-self: center;
  max-width: 100%;
  object-fit: contain;
`;

const Label = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
`;

/** Returns the gallery entries in the sidebar's Formats and Services order. */
function getFormatGallery(): Array<FormatMetadata & {path: string}> {
  const metadataBySlug = new Map(FORMAT_METADATA.map(format => [format.slug, format]));
  const categories = docsSidebar.filter(
    category => category.type === 'category' && (category.label === 'Formats' || category.label === 'Services')
  );

  return categories.flatMap(category =>
    (category.items ?? []).flatMap(path => {
      const slug = path.split('/').pop() ?? path;
      const metadata = metadataBySlug.get(slug);
      return metadata ? [{...metadata, path}] : [];
    })
  );
}

const FORMAT_GALLERY = getFormatGallery();

/** Renders the filterable format logo gallery on the documentation home page. */
export function FormatLogoGallery() {
  const [selectedFilter, setSelectedFilter] = useState<FormatFilter>('all');
  const logoBaseUrl = useBaseUrl('/images/format-logos');
  const visibleFormats = FORMAT_GALLERY.filter(
    format => selectedFilter === 'all' || format.tags.includes(selectedFilter)
  );

  return (
    <Gallery>
      <p>loaders.gl supports tabular, geospatial, 3D, texture, archive, and interchange formats.</p>
      <TabList aria-label="Format filters" role="tablist">
        {FILTERS.map(filter => (
          <Tab
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={selectedFilter === filter.value}
            $selected={selectedFilter === filter.value}
            onClick={() => setSelectedFilter(filter.value)}
          >
            {filter.label}
          </Tab>
        ))}
      </TabList>
      <Grid>
        {visibleFormats.map(format => (
          <Card key={format.slug} to={`/docs/${format.path}`} title={format.label}>
            <Logo alt={`${format.label} logo`} loading="lazy" src={`${logoBaseUrl}/${format.logo}`} />
            <Label>{format.label}</Label>
          </Card>
        ))}
      </Grid>
    </Gallery>
  );
}
