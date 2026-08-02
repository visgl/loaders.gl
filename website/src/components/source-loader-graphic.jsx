import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import styled from 'styled-components';

const sourceTabs = [
  {
    id: 'vector-tile-source',
    label: 'Vector Tiles',
    sourceLoaders: [
      'PMTilesSourceLoader',
      'MVTSourceLoader',
      'MLTSourceLoader',
      'TableTileSourceLoader'
    ],
    dataSource: 'VectorTileDataSource',
    methods: ['getMetadata()', 'getTile()'],
    outputCategory: 'VectorTileTables',
    outputDetail: 'Tables<ArrowTable>',
    loadingManager: 'Tileset2D',
    deckLayers: ['Tile2DSourceLayer', 'MVTLayer', 'GeoJsonLayer']
  },
  {
    id: 'image-tile-source',
    label: 'Image Tiles',
    sourceLoaders: ['PMTilesSourceLoader', 'MVTSourceLoader'],
    dataSource: 'ImageTileDataSource',
    methods: ['getMetadata()', 'getImageTile()'],
    outputCategory: 'ImageTile',
    outputDetail: 'ImageType',
    loadingManager: 'Tileset2D',
    deckLayers: ['Tile2DSourceLayer', 'BitmapLayer']
  },
  {
    id: 'vector-source',
    label: 'Vector',
    sourceLoaders: [
      'FlatGeobufSourceLoader',
      'GeoPackageSourceLoader',
      'WFSSourceLoader',
      '_ArcGISFeatureServerSourceLoader'
    ],
    dataSource: 'VectorSource',
    methods: ['getMetadata()', 'getFeatures()'],
    outputCategory: 'VectorSourceData',
    outputDetail: 'GeoJSON / binary / Arrow',
    loadingManager: 'VectorSet',
    deckLayers: ['GeoJsonLayer']
  },
  {
    id: 'image-source',
    label: 'Images',
    sourceLoaders: ['WMSSourceLoader', 'OMETiffSourceLoader', '_ArcGISImageServerSourceLoader'],
    dataSource: 'ImageSource',
    methods: ['getMetadata()', 'getImage()'],
    outputCategory: 'ImageSourceData',
    outputDetail: 'Map images / image planes',
    loadingManager: 'ImageSet',
    deckLayers: ['BitmapLayer']
  },
  {
    id: 'raster-source',
    label: 'Raster',
    sourceLoaders: ['GeoTIFFSourceLoader'],
    dataSource: 'RasterSource',
    methods: ['getMetadata()', 'getRaster()'],
    outputCategory: 'RasterData',
    outputDetail: 'Typed arrays / multiband textures',
    loadingManager: 'RasterSet',
    deckLayers: ['BitmapLayer', 'Custom shaders']
  },
  {
    id: 'tile-source',
    label: '3D Tiles',
    sourceLoaders: ['COPCSourceLoader', 'PotreeSourceLoader', 'Tiles3DSource', 'I3SSource'],
    dataSource: 'TileSource / Tileset3DSource',
    methods: ['getMetadata()', 'getTile()'],
    outputCategory: 'PointTile',
    outputDetail: 'Point cloud tile',
    loadingManager: 'Tileset3D',
    deckLayers: ['Tile3DSourceLayer', 'PointCloudLayer', 'ScenegraphLayer']
  },
  {
    id: 'sql-source',
    label: 'SQL',
    sourceLoaders: ['DuckDBSQLSource', 'SnowflakeSQLSource'],
    dataSource: 'SQLDataSource',
    methods: ['listTables()', 'queryRows()', 'queryArrow()'],
    outputCategory: 'SQLSourceData',
    outputDetail: 'Rows / Arrow tables',
    loadingManager: 'Application',
    deckLayers: []
  },
  {
    id: 'catalog-source',
    label: 'Catalog',
    sourceLoaders: ['CSWSourceLoader'],
    dataSource: 'CatalogSource',
    methods: ['getRecords()', 'getMetadata()'],
    outputCategory: 'Catalog records',
    outputDetail: 'Service metadata',
    loadingManager: 'Application',
    deckLayers: []
  }
];

const sourceTags = {
  _ArcGISFeatureServerSourceLoader: 'Experimental',
  _ArcGISImageServerSourceLoader: 'Experimental',
  COPCSourceLoader: 'Cloud Archive',
  CSWSourceLoader: 'Web Service',
  DuckDBSQLSource: 'Database',
  FlatGeobufSourceLoader: 'Cloud Archive',
  GeoPackageSourceLoader: 'Archive',
  GeoTIFFSourceLoader: 'Cloud Archive',
  I3SSource: 'Tileset',
  MLTSourceLoader: 'Web Service',
  MVTSourceLoader: 'Cloud Archive',
  OMETiffSourceLoader: 'Image Pyramid',
  PMTilesSourceLoader: 'Cloud Archive',
  PotreeSourceLoader: 'Tileset',
  SnowflakeSQLSource: 'Database',
  TableTileSourceLoader: 'Generated',
  Tiles3DSource: 'Tileset',
  WFSSourceLoader: 'Web Service',
  WMSSourceLoader: 'Web Service'
};

const sourceDocumentationLinks = {
  _ArcGISFeatureServerSourceLoader: '/docs/modules/wms/services/arcgis-feature-server',
  _ArcGISImageServerSourceLoader: '/docs/modules/wms/services/arcgis-image-server',
  COPCSourceLoader: '/docs/modules/copc/api-reference/copc-source-loader',
  CSWSourceLoader: '/docs/modules/wms/api-reference/csw-source-loader',
  DuckDBSQLSource: '/docs/modules/sql/api-reference/sql-source',
  FlatGeobufSourceLoader: '/docs/modules/flatgeobuf/api-reference/flatgeobuf-source-loader',
  GeoPackageSourceLoader: '/docs/modules/geopackage/api-reference/geopackage-source',
  GeoTIFFSourceLoader: '/docs/modules/geotiff/api-reference/geotiff-source-loader',
  I3SSource: '/docs/modules/tiles/api-reference/i3s-source',
  MLTSourceLoader: '/docs/modules/mlt/api-reference/mlt-source-loader',
  MVTSourceLoader: '/docs/modules/mvt/api-reference/mvt-source-loader',
  OMETiffSourceLoader: '/docs/modules/geotiff/api-reference/ometiff-source-loader',
  PMTilesSourceLoader: '/docs/modules/pmtiles/api-reference/pmtiles-source-loader',
  PotreeSourceLoader: '/docs/modules/potree/api-reference/potree-source-loader',
  SnowflakeSQLSource: '/docs/modules/sql/api-reference/sql-source',
  TableTileSourceLoader: '/docs/modules/mvt/api-reference/table-tile-source-loader',
  Tiles3DSource: '/docs/modules/tiles/api-reference/tiles-3d-source',
  WFSSourceLoader: '/docs/modules/wms/api-reference/wfs-source-loader',
  WMSSourceLoader: '/docs/modules/wms/api-reference/wms-source-loader'
};

const loadingManagerDocumentationLinks = {
  Tileset2D: '/docs/modules/tiles/api-reference/tileset-2d',
  Tileset3D: '/docs/modules/tiles/api-reference/tileset-3d'
};

const deckLayerDocumentationLinks = {
  BitmapLayer: 'https://deck.gl/docs/api-reference/layers/bitmap-layer',
  GeoJsonLayer: 'https://deck.gl/docs/api-reference/layers/geojson-layer',
  MVTLayer: 'https://deck.gl/docs/api-reference/geo-layers/mvt-layer',
  PointCloudLayer: 'https://deck.gl/docs/api-reference/layers/point-cloud-layer',
  ScenegraphLayer: 'https://deck.gl/docs/api-reference/mesh-layers/scenegraph-layer'
};

const GraphicFrame = styled.div`
  background: ${(props) => (props.$standalone ? 'rgba(255, 255, 255, 0.92)' : 'transparent')};
  border: ${(props) => (props.$standalone ? '1px solid var(--ifm-color-gray-400)' : '0')};
  border-radius: 8px;
  box-shadow: ${(props) =>
    props.$standalone ? '0 24px 70px rgba(43, 56, 72, 0.12)' : 'none'};
  margin: ${(props) => (props.$standalone ? '28px 0' : '0')};
  padding: ${(props) => (props.$standalone ? '24px' : '0')};
`;

const SourceFlow = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
`;

const TabList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const TabButton = styled.button`
  background: ${(props) =>
    props.$active ? 'rgba(0, 173, 230, 0.12)' : 'var(--ifm-color-white)'};
  border: 1px solid
    ${(props) => (props.$active ? 'rgba(0, 173, 230, 0.7)' : 'var(--ifm-color-gray-400)')};
  border-radius: 8px;
  color: ${(props) =>
    props.$active ? 'var(--ifm-color-primary-darkest)' : 'var(--ifm-color-gray-800)'};
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  padding: 12px 14px;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: var(--ifm-color-primary);
    color: var(--ifm-color-primary-darkest);
    transform: translateY(-1px);
  }
`;

const SourceStage = styled.div`
  display: grid;
  gap: 10px;
`;

const SourceInstruction = styled.p`
  color: var(--ifm-color-primary-darkest);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  margin: 6px 0 0;
  text-align: center;
  text-transform: uppercase;
`;

const SourceBox = styled.div`
  background: var(--ifm-color-white);
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  padding: 14px;
`;

const SourceGrid = styled.div`
  align-content: start;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media screen and (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const Node = styled.div`
  align-items: center;
  background: ${(props) => props.$background || 'var(--ifm-color-white)'};
  border: 1px solid ${(props) => props.$border || 'var(--ifm-color-gray-400)'};
  border-radius: 8px;
  color: var(--ifm-color-gray-900);
  display: flex;
  font-size: ${(props) => (props.$compactText ? '12px' : '14px')};
  font-weight: 750;
  justify-content: space-between;
  line-height: 1.25;
  min-height: 44px;
  overflow-wrap: anywhere;
  padding: 12px 14px;
  position: relative;
`;

const CompactNode = styled(Node)`
  font-size: ${(props) => (props.$compactText ? '11px' : '12px')};
  min-height: 34px;
  padding: 8px 10px;
`;

const LinkedCompactNode = styled(CompactNode).attrs({as: Link})`
  text-decoration: none;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: var(--ifm-color-primary);
    color: var(--ifm-color-primary-darkest);
    text-decoration: none;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--ifm-color-primary);
    outline-offset: 2px;
  }
`;

const VerticalConnector = styled.div`
  align-items: flex-end;
  color: var(--ifm-color-primary-darkest);
  display: flex;
  justify-content: center;
  min-height: 28px;
  padding-bottom: 2px;

  &::before {
    content: '${(props) => props.$label || 'then'}';
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1;
    text-transform: uppercase;
  }
`;

const CategoryNode = styled(Node)`
  background: ${(props) => props.$background};
  border-color: ${(props) => props.$border};
  color: var(--ifm-color-black);
  font-weight: 800;
`;

const CenteredDataSourceNode = styled(CategoryNode)`
  justify-content: center;
  text-align: center;
`;

const DataSourceNode = styled(CategoryNode)`
  align-items: stretch;
  display: grid;
  gap: 12px;
  justify-content: stretch;
`;

const MethodGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media screen and (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const CenteredNodeContent = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const TinyLabel = styled.span`
  color: var(--ifm-color-gray-700);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
`;

const NodeMeta = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 8px;
`;

const SourceTag = styled.span`
  background: transparent;
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 999px;
  color: var(--ifm-color-gray-700);
  flex: 0 0 auto;
  font-size: 8px;
  font-weight: 500;
  line-height: 1;
  padding: 3px 6px;
  text-transform: uppercase;
`;

const LinkMark = styled.span`
  color: var(--ifm-color-primary-darkest);
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
`;

const StageLabel = styled.p`
  color: var(--ifm-color-primary-darkest);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  margin: 8px 0 -2px;
  text-align: center;
  text-transform: uppercase;
`;

const LayerPreviewStack = styled.div`
  display: grid;
  gap: 8px;
  width: 100%;
`;

const LayerPreviewNode = styled(CompactNode)`
  max-width: min(100%, 560px);
  width: fit-content;
`;

const LayerPreviewParentRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const LayerPreviewConnectorRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const LayerPreviewChildren = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  width: min(100%, 420px);

  @media screen and (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const LayerPreviewChildrenRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const LayerPreviewConnector = styled.div`
  height: 10px;
  position: relative;
  width: 18px;

  &::before {
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 10px solid var(--ifm-color-primary-darkest);
    content: '';
    display: block;
    height: 0;
    width: 0;
  }
`;

/**
 * Interactive diagram showing how source loaders create runtime data source objects.
 */
export default function SourceLoaderGraphic({standalone = false}) {
  const [selectedSourceTabId, setSelectedSourceTabId] = useState('raster-source');
  const selectedSourceTab = sourceTabs.find((sourceTab) => sourceTab.id === selectedSourceTabId);
  const hasDeckLayers = selectedSourceTab.deckLayers.length > 0;
  const previewLayer = hasDeckLayers
    ? selectedSourceTab.deckLayers.find((layer) => !deckLayerDocumentationLinks[layer]) || null
    : null;
  const renderedDeckLayers = previewLayer
    ? selectedSourceTab.deckLayers.filter((layer) => layer !== previewLayer)
    : selectedSourceTab.deckLayers;

  return (
    <GraphicFrame $standalone={standalone}>
      <SourceFlow>
        <SourceStage>
          <TabList role="tablist" aria-label="Data source type tabs">
            {sourceTabs.map((sourceTab) => (
              <TabButton
                key={sourceTab.id}
                type="button"
                role="tab"
                aria-selected={selectedSourceTab.id === sourceTab.id}
                $active={selectedSourceTab.id === sourceTab.id}
                onClick={() => setSelectedSourceTabId(sourceTab.id)}
              >
                {sourceTab.label}
              </TabButton>
            ))}
          </TabList>
          <SourceBox>
            <SourceInstruction>SourceLoaders</SourceInstruction>
            <SourceGrid>
              {selectedSourceTab.sourceLoaders.map((sourceLoader) => (
                <LinkedCompactNode
                  key={sourceLoader}
                  to={sourceDocumentationLinks[sourceLoader]}
                  $compactText={sourceLoader.length > 20}
                >
                  <span>{sourceLoader}</span>
                  <NodeMeta>
                    <SourceTag>{sourceTags[sourceLoader]}</SourceTag>
                    <LinkMark aria-hidden="true">↗</LinkMark>
                  </NodeMeta>
                </LinkedCompactNode>
              ))}
            </SourceGrid>
          </SourceBox>
        </SourceStage>
        <VerticalConnector $label="load() or createDataSource()" />
        <CenteredDataSourceNode
          $background="rgba(53, 173, 107, 0.12)"
          $border="rgba(53, 173, 107, 0.55)"
        >
          <span>{selectedSourceTab.dataSource}</span>
        </CenteredDataSourceNode>
        <StageLabel>Runtime API</StageLabel>
        <DataSourceNode
          $background="rgba(53, 173, 107, 0.1)"
          $border="rgba(53, 173, 107, 0.45)"
        >
          <span>Metadata and incremental reads</span>
          <MethodGrid>
            {selectedSourceTab.methods.map((method) => (
              <CompactNode key={method}>{method}</CompactNode>
            ))}
          </MethodGrid>
        </DataSourceNode>
        <StageLabel>Manage loading</StageLabel>
        <CategoryNode
          $background="rgba(255, 196, 57, 0.2)"
          $border="rgba(184, 122, 0, 0.42)"
        >
          <CenteredNodeContent>
            {loadingManagerDocumentationLinks[selectedSourceTab.loadingManager] ? (
              <LinkedCompactNode to={loadingManagerDocumentationLinks[selectedSourceTab.loadingManager]}>
                <span>{selectedSourceTab.loadingManager}</span>
                <LinkMark aria-hidden="true">↗</LinkMark>
              </LinkedCompactNode>
            ) : (
              selectedSourceTab.loadingManager
            )}
          </CenteredNodeContent>
        </CategoryNode>
        <StageLabel>Loaded data</StageLabel>
        <CategoryNode
          $background="rgba(0, 173, 230, 0.1)"
          $border="rgba(0, 173, 230, 0.45)"
        >
          <span>{selectedSourceTab.outputCategory}</span>
          <TinyLabel>{selectedSourceTab.outputDetail}</TinyLabel>
        </CategoryNode>
        <StageLabel>{hasDeckLayers ? 'Render with deck.gl (optional)' : 'Use in application code'}</StageLabel>
        <CategoryNode
          $background="rgba(0, 173, 230, 0.08)"
          $border="rgba(0, 173, 230, 0.32)"
        >
          <CenteredNodeContent>
            {!hasDeckLayers ? (
              <LayerPreviewNode>
                <span>Application code</span>
                <NodeMeta>
                  <SourceTag>Custom</SourceTag>
                </NodeMeta>
              </LayerPreviewNode>
            ) : previewLayer ? (
              <LayerPreviewStack>
                <LayerPreviewParentRow>
                  <LayerPreviewNode>
                    <span>{previewLayer}</span>
                    <NodeMeta>
                      <SourceTag>Preview</SourceTag>
                    </NodeMeta>
                  </LayerPreviewNode>
                </LayerPreviewParentRow>
                <LayerPreviewConnectorRow>
                  <LayerPreviewConnector />
                </LayerPreviewConnectorRow>
                <LayerPreviewChildrenRow>
                  <LayerPreviewChildren>
                    {renderedDeckLayers.map((layer) => (
                      <LinkedCompactNode key={layer} to={deckLayerDocumentationLinks[layer]}>
                        <span>{layer}</span>
                        <LinkMark aria-hidden="true">↗</LinkMark>
                      </LinkedCompactNode>
                    ))}
                  </LayerPreviewChildren>
                </LayerPreviewChildrenRow>
              </LayerPreviewStack>
            ) : (
              <MethodGrid>
                {renderedDeckLayers.map((layer) => (
                  <LinkedCompactNode key={layer} to={deckLayerDocumentationLinks[layer]}>
                    <span>{layer}</span>
                    <LinkMark aria-hidden="true">↗</LinkMark>
                  </LinkedCompactNode>
                ))}
              </MethodGrid>
            )}
          </CenteredNodeContent>
        </CategoryNode>
      </SourceFlow>
    </GraphicFrame>
  );
}
