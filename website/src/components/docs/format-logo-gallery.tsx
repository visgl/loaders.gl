import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styled from 'styled-components';

type DocsSidebarCategory = {
  type?: string;
  label?: string;
  items?: string[];
};

type FormatLogoManifestEntry = {
  asset: string;
  provenance: string;
  source: string;
};

type FormatGalleryItem = {
  label: string;
  path: string;
  slug: string;
  logoAsset: string;
  tags: FormatCategoryTag[];
};

type FormatCategoryTag =
  | 'tables'
  | 'geospatial'
  | 'services'
  | 'textures'
  | 'pointclouds'
  | 'meshes';

type FormatFilterTab = 'all' | FormatCategoryTag;

type FormatMetadataRow = {
  label: string;
  slug: string;
  path?: string;
  tags: FormatCategoryTag[];
};

const docsSidebar = require('../../../../docs/docs-sidebar.json') as DocsSidebarCategory[];
const formatLogos = require('../../../../docs/images/logos/format-logos.json') as Record<
  string,
  FormatLogoManifestEntry
>;

const GallerySection = styled.section`
  margin: 2rem 0 2.5rem;
`;

const Intro = styled.p`
  margin: 0 0 1rem;
  max-width: 52rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 0.9rem;
`;

const TabBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0 0 1rem;
`;

const TabButton = styled.button<{$active: boolean}>`
  appearance: none;
  background: ${(props) => (props.$active ? 'var(--ifm-color-primary)' : 'var(--ifm-background-surface-color)')};
  border: 1px solid ${(props) => (props.$active ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)')};
  border-radius: 999px;
  color: ${(props) => (props.$active ? 'var(--ifm-color-white)' : 'var(--ifm-font-color-base)')};
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.72rem 0.95rem;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;

  &:hover {
    border-color: var(--ifm-color-primary);
    transform: translateY(-1px);
  }
`;

const Card = styled(Link)`
  align-items: center;
  background: var(--ifm-card-background-color, var(--ifm-background-surface-color));
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
  color: inherit;
  display: grid;
  gap: 0.65rem;
  grid-template-rows: 88px auto;
  min-height: 144px;
  padding: 0.9rem 0.8rem 0.85rem;
  text-decoration: none;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;

  &:hover {
    border-color: var(--ifm-color-primary);
    box-shadow: 0 8px 24px rgb(15 23 42 / 0.08);
    text-decoration: none;
    transform: translateY(-2px);
  }
`;

const LogoFrame = styled.div`
  align-items: center;
  background:
    radial-gradient(circle at top left, rgb(255 255 255 / 0.9), rgb(248 250 252 / 0.92)),
    linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  min-height: 88px;
  overflow: hidden;
  padding: 0.7rem;
`;

const LogoImage = styled.img`
  display: block;
  height: 100%;
  max-height: 56px;
  max-width: 100%;
  object-fit: contain;
  width: auto;
`;

const FormatLabel = styled.span`
  color: var(--ifm-font-color-base);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.25;
  text-align: center;
`;

const FILTER_TABS: Array<{id: FormatFilterTab; label: string}> = [
  {id: 'all', label: 'All'},
  {id: 'tables', label: 'Tables'},
  {id: 'geospatial', label: 'Geospatial'},
  {id: 'services', label: 'Services'},
  {id: 'textures', label: 'Textures'},
  {id: 'pointclouds', label: 'Pointclouds'},
  {id: 'meshes', label: 'Meshes'}
];

const FORMAT_METADATA_TABLE: FormatMetadataRow[] = [
  {slug: 'arrow', label: 'Arrow', tags: ['tables']},
  {slug: 'geoarrow', label: 'GeoArrow', tags: ['tables', 'geospatial']},
  {slug: 'bson', label: 'BSON', tags: []},
  {slug: 'csv', label: 'CSV', tags: ['tables']},
  {slug: 'draco', label: 'Draco', tags: ['pointclouds', 'meshes']},
  {slug: 'pcd', label: 'PCD', tags: ['pointclouds']},
  {slug: 'ply', label: 'PLY', tags: ['pointclouds', 'meshes']},
  {slug: 'flatgeobuf', label: 'FlatGeobuf', tags: ['geospatial']},
  {slug: 'geojson', label: 'GeoJSON', tags: ['geospatial']},
  {slug: 'geojson-geometry', label: 'GeoJSON Geometry', tags: ['geospatial']},
  {slug: 'glb', label: 'GLB', tags: ['meshes']},
  {slug: 'gltf', label: 'glTF', tags: ['meshes']},
  {slug: 'geopackage', label: 'GeoPackage', tags: ['geospatial']},
  {slug: 'geotiff', label: 'GeoTIFF', tags: ['geospatial']},
  {slug: 'kml', label: 'KML', tags: ['geospatial']},
  {slug: 'gpx', label: 'GPX', tags: ['geospatial']},
  {slug: 'tcx', label: 'TCX', tags: ['geospatial']},
  {slug: 'las', label: 'LAS', tags: ['geospatial', 'pointclouds']},
  {slug: 'mlt', label: 'MapLibre Tile', tags: ['geospatial']},
  {slug: 'mvt', label: 'MVT', tags: ['geospatial']},
  {slug: 'tilejson', label: 'TileJSON', tags: ['geospatial', 'services']},
  {slug: 'parquet', label: 'Parquet', tags: ['tables']},
  {slug: 'geoparquet', label: 'GeoParquet', tags: ['tables', 'geospatial']},
  {slug: 'pmtiles', label: 'PMTiles', tags: ['geospatial']},
  {slug: 'shapefile', label: 'Shapefile', tags: ['geospatial']},
  {slug: 'basis', label: 'Basis', tags: ['textures']},
  {slug: 'compressed-textures', label: 'Compressed Textures', tags: ['textures']},
  {slug: 'crunch', label: 'Crunch', tags: ['textures']},
  {slug: 'dds', label: 'DDS', tags: ['textures']},
  {slug: 'hdr', label: 'HDR', tags: ['textures']},
  {slug: 'ktx', label: 'KTX / KTX2', tags: ['textures']},
  {slug: 'pvr', label: 'PVR', tags: ['textures']},
  {slug: 'csw', label: 'CSW', tags: ['geospatial', 'services']},
  {slug: 'wms', label: 'WMS', tags: ['geospatial', 'services']},
  {slug: 'wmts', label: 'WMTS', tags: ['geospatial', 'services']},
  {slug: 'wfs', label: 'WFS', tags: ['geospatial', 'services']},
  {slug: 'gml', label: 'GML', tags: ['geospatial']},
  {slug: 'lerc', label: 'LERC', tags: ['geospatial']},
  {slug: 'wkt', label: 'WKT', tags: ['geospatial']},
  {slug: 'wkb', label: 'WKB', tags: ['geospatial']},
  {slug: 'wkt-crs', label: 'WKT-CRS', tags: ['geospatial']},
  {slug: 'xml', label: 'XML', tags: []},
  {slug: 'zip', label: 'ZIP', tags: []},
  {
    slug: 'arcgis-server',
    label: 'ArcGIS Services',
    path: 'modules/wms/api-reference/arcgis',
    tags: ['geospatial', 'services']
  }
];

const FORMAT_METADATA_BY_SLUG = Object.fromEntries(
  FORMAT_METADATA_TABLE.map(row => [row.slug, row])
) as Record<string, FormatMetadataRow>;

/**
 * Returns the format entries shown in the docs sidebar in display order.
 */
function getFormatGalleryItems(): FormatGalleryItem[] {
  const formatsCategory = docsSidebar.find(item => item.type === 'category' && item.label === 'Formats');

  const formatPaths = (formatsCategory?.items ?? []).filter(item => item !== 'formats/README');
  const sidebarSlugs = new Set(formatPaths.map(path => path.split('/').pop() ?? path));

  const itemsFromSidebar = formatPaths.flatMap(path => {
    const slug = path.split('/').pop() ?? path;
    const manifestEntry = formatLogos[slug];
    const metadataRow = FORMAT_METADATA_BY_SLUG[slug];

    if (!manifestEntry || !metadataRow) {
      return [];
    }

    return [
      {
        label: metadataRow.label,
        path,
        slug,
        logoAsset: manifestEntry.asset,
        tags: metadataRow.tags
      }
    ];
  });

  const extraItems = FORMAT_METADATA_TABLE.flatMap(metadataRow => {
    if (!metadataRow.path || sidebarSlugs.has(metadataRow.slug)) {
      return [];
    }

    const manifestEntry = formatLogos[metadataRow.slug];

    if (!manifestEntry) {
      return [];
    }

    return [
      {
        label: metadataRow.label,
        path: metadataRow.path,
        slug: metadataRow.slug,
        logoAsset: manifestEntry.asset,
        tags: metadataRow.tags
      }
    ];
  });

  return [...itemsFromSidebar, ...extraItems];
}

const FORMAT_GALLERY_ITEMS = getFormatGalleryItems();

/**
 * Renders a linked logo gallery for all file formats documented on the docs home page.
 */
export function FormatLogoGallery() {
  const [activeTab, setActiveTab] = useState<FormatFilterTab>('all');
  const logoBaseUrl = useBaseUrl('/images/format-logos');
  const visibleItems =
    activeTab === 'all'
      ? FORMAT_GALLERY_ITEMS
      : FORMAT_GALLERY_ITEMS.filter(item => item.tags.includes(activeTab));

  return (
    <GallerySection>
      <Intro>
        loaders.gl supports tabular, geospatial, 3D, texture, archive, and interchange formats.
        Browse the supported format docs directly from the logo gallery below.
      </Intro>
      <TabBar aria-label="Format filters" role="tablist">
        {FILTER_TABS.map(tab => (
          <TabButton
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabBar>
      <Grid>
        {visibleItems.map(item => (
          <Card key={item.slug} to={`/docs/${item.path}`} title={item.label}>
            <LogoFrame>
              <LogoImage
                alt={`${item.label} logo`}
                src={`${logoBaseUrl}/${item.logoAsset}`}
                loading="lazy"
              />
            </LogoFrame>
            <FormatLabel>{item.label}</FormatLabel>
          </Card>
        ))}
      </Grid>
    </GallerySection>
  );
}
