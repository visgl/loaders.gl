import React, {useState} from 'react';
import styled from 'styled-components';

const categoryTabs = [
  {
    id: 'mesh',
    label: 'Mesh',
    representations: {
      arrow: {
        data: 'Mesh Arrow table',
        detail: 'Arrow columns',
        loaders: [
          'DracoArrowLoader',
          'LASArrowLoader',
          'OBJArrowLoader',
          'PCDArrowLoader',
          'PLYArrowLoader',
          'QuantizedMeshArrowLoader',
          'TerrainArrowLoader'
        ],
        writers: [
          'DracoWriter',
          'LASWriter',
          'OBJWriter',
          'PCDWriter',
          'PLYWriter',
          'QuantizedMeshWriter'
        ]
      },
      plain: {
        data: 'Mesh category data',
        detail: 'Typed arrays',
        loaders: [
          'DracoLoader',
          'LASLoader',
          'OBJLoader',
          'PCDLoader',
          'PLYLoader',
          'QuantizedMeshLoader',
          'TerrainLoader'
        ],
        writers: [
          'DracoWriter',
          'LASWriter',
          'OBJWriter',
          'PCDWriter',
          'PLYWriter',
          'QuantizedMeshWriter'
        ]
      }
    }
  },
  {
    id: 'table',
    label: 'Table',
    representations: {
      arrow: {
        data: 'Arrow table data',
        detail: 'Columnar',
        loaders: [
          'ArrowLoader',
          'CSVArrowLoader',
          'ExcelArrowLoader',
          'NDJSONArrowLoader',
          'ParquetArrowLoader'
        ],
        writers: ['ArrowWriter', 'CSVArrowWriter', 'ParquetArrowWriter']
      },
      plain: {
        data: 'Table category data',
        detail: 'Rows / columns',
        loaders: ['CSVLoader', 'ExcelLoader', 'JSONLoader', 'NDJSONLoader', 'ParquetLoader'],
        writers: ['CSVWriter', 'JSONWriter']
      }
    }
  },
  {
    id: 'gis',
    label: 'GIS',
    representations: {
      arrow: {
        data: 'GeoArrow table data',
        detail: 'Geometry columns',
        loaders: ['GeoArrowLoader'],
        writers: ['GeoArrowWriter']
      },
      plain: {
        data: 'GIS category data',
        detail: 'Features / geometry',
        loaders: [
          'GeoJSONLoader',
          'FlatGeobufLoader',
          'GeoPackageLoader',
          'GPXLoader',
          'KMLLoader',
          'MVTLoader',
          'ShapefileLoader',
          'SHPLoader',
          'TCXLoader',
          'WKBLoader',
          'WKTLoader'
        ],
        writers: ['GeoJSONWriter', 'MVTWriter', 'WKBWriter', 'WKTWriter', 'TWKBWriter']
      }
    }
  },
  {
    id: 'image',
    label: 'Image',
    representations: {
      arrow: {
        data: 'No Arrow image category',
        detail: 'Use plain',
        loaders: [],
        writers: []
      },
      plain: {
        data: 'Image category data',
        detail: 'Pixels / textures',
        loaders: [
          'ImageLoader',
          'CompressedTextureLoader',
          'BasisLoader',
          'CrunchWorkerLoader',
          'RadianceHDRLoader',
          'TextureLoader',
          'TextureArrayLoader',
          'TextureCubeLoader'
        ],
        writers: ['ImageWriter', 'CompressedTextureWriter', 'KTX2BasisUniversalTextureWriter']
      }
    }
  },
  {
    id: 'json',
    label: 'JSON',
    representations: {
      arrow: {
        data: 'No Arrow JSON category',
        detail: 'Use table',
        loaders: [],
        writers: []
      },
      plain: {
        data: 'JSON-style data',
        detail: 'Objects / arrays',
        loaders: ['JSONLoader', 'BSONLoader', 'XMLLoader', 'HTMLLoader'],
        writers: ['JSONWriter', 'BSONWriter']
      }
    }
  },
  {
    id: 'scenegraph',
    label: 'Scenegraph',
    representations: {
      arrow: {
        data: 'No Arrow scenegraph category',
        detail: 'Use plain',
        loaders: [],
        writers: []
      },
      plain: {
        data: 'Scenegraph category data',
        detail: 'glTF assets',
        loaders: ['GLTFLoader', 'GLBLoader'],
        writers: ['GLTFWriter', 'GLBWriter']
      }
    }
  },
  {
    id: 'tiles',
    label: '3D Tiles',
    representations: {
      arrow: {
        data: 'No Arrow 3D Tiles category',
        detail: 'Use plain',
        loaders: [],
        writers: []
      },
      plain: {
        data: '3D Tiles category data',
        detail: 'Tilesets / tiles',
        loaders: ['Tiles3DLoader', 'CesiumIonLoader', 'I3SLoader', 'PotreeLoader'],
        writers: ['Tiles3DWriter']
      }
    }
  }
];

const representationTabs = [
  {id: 'arrow', label: 'Arrow'},
  {id: 'plain', label: 'Plain'}
];

const sourceTabs = [
  {
    id: 'vector-tile-source',
    label: 'Vector Tiles',
    sources: ['PMTilesSource', 'MVTSource', 'MLTSource', 'TableTileSource'],
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
    sources: ['PMTilesSource', 'MVTSource'],
    dataSource: 'ImageTileDataSource',
    methods: ['getMetadata()', 'getImageTile()'],
    outputCategory: 'ImageTile',
    outputDetail: 'ImageType',
    loadingManager: 'Tileset2D',
    deckLayers: ['Tile2DSourceLayer', 'BitmapLayer']
  },
  {
    id: 'image-source',
    label: 'Images',
    sources: ['WMSSource'],
    dataSource: 'ImageDataSource',
    methods: ['getMetadata()', 'getImage()'],
    outputCategory: 'MapImage',
    outputDetail: 'ImageType',
    loadingManager: 'Image2D',
    deckLayers: ['BitmapLayer']
  },
  {
    id: 'raster-source',
    label: 'Raster',
    sources: ['GeoTIFFSource'],
    dataSource: 'RasterDataSource',
    methods: ['getMetadata()', 'getRaster()'],
    outputCategory: 'RasterData',
    outputDetail: 'Typed arrays / multiband textures',
    loadingManager: 'Viewport2D',
    deckLayers: ['BitmapLayer', 'Custom shaders']
  },
  {
    id: 'tile-source',
    label: '3D Tiles',
    sources: ['COPCSource', 'Tiles3DSource', 'I3SSource'],
    dataSource: 'TileDataSource',
    methods: ['getMetadata()', 'getTile()'],
    outputCategory: 'PointTile',
    outputDetail: 'Point cloud tile',
    loadingManager: 'Tileset3D',
    deckLayers: ['Tile3DSourceLayer', 'PointCloudLayer', 'ScenegraphLayer']
  }
];

const sourceTags = {
  COPCSource: 'Cloud Archive',
  GeoTIFFSource: 'Cloud Archive',
  I3SSource: 'Tileset',
  MLTSource: 'Web Service',
  MVTSource: 'Cloud Archive',
  PMTilesSource: 'Cloud Archive',
  TableTileSource: 'Generated',
  Tiles3DSource: 'Tileset',
  WMSSource: 'Web Service'
};

const subloaders = ['DracoLoader', 'ImageLoader', 'TextureLoader'];

const categoryDocumentationLinks = {
  mesh: '/docs/specifications/category-mesh',
  table: '/docs/specifications/category-table',
  gis: '/docs/specifications/category-gis',
  image: '/docs/specifications/category-image',
  json: '/docs/specifications/category-json',
  scenegraph: '/docs/specifications/category-scenegraph',
  tiles: '/docs/specifications/category-3d-tiles'
};

const loaderDocumentationLinks = {
  ArrowLoader: '/docs/modules/arrow/api-reference/arrow-loader',
  BasisLoader: '/docs/modules/textures/api-reference/basis-loader',
  BSONLoader: '/docs/modules/bson/api-reference/bson-loader',
  CesiumIonLoader: '/docs/modules/3d-tiles/api-reference/cesium-ion-loader',
  CompressedTextureLoader: '/docs/modules/textures/api-reference/compressed-texture-loader',
  CrunchWorkerLoader: '/docs/modules/textures/api-reference/crunch-loader',
  CSVArrowLoader: '/docs/modules/csv/api-reference/csv-loader',
  CSVLoader: '/docs/modules/csv/api-reference/csv-loader',
  DracoArrowLoader: '/docs/modules/draco/api-reference/draco-loader',
  DracoLoader: '/docs/modules/draco/api-reference/draco-loader',
  ExcelArrowLoader: '/docs/modules/excel/api-reference/excel-arrow-loader',
  ExcelLoader: '/docs/modules/excel/api-reference/excel-loader',
  FlatGeobufLoader: '/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader',
  GeoArrowLoader: '/docs/modules/arrow/api-reference/geoarrow-loader',
  GeoJSONLoader: '/docs/modules/json/api-reference/geojson-loader',
  GeoPackageLoader: '/docs/modules/geopackage/api-reference/geopackage-loader',
  GLBLoader: '/docs/modules/gltf/api-reference/glb-loader',
  GLTFLoader: '/docs/modules/gltf/api-reference/gltf-loader',
  GPXLoader: '/docs/modules/kml/api-reference/gpx-loader',
  HTMLLoader: '/docs/modules/xml/api-reference/html-loader',
  I3SLoader: '/docs/modules/i3s/api-reference/i3s-loader',
  ImageLoader: '/docs/modules/images/api-reference/image-loader',
  JSONLoader: '/docs/modules/json/api-reference/json-loader',
  KMLLoader: '/docs/modules/kml/api-reference/kml-loader',
  LASArrowLoader: '/docs/modules/las/api-reference/las-loader',
  LASLoader: '/docs/modules/las/api-reference/las-loader',
  MVTLoader: '/docs/modules/mvt/api-reference/mvt-loader',
  NDJSONArrowLoader: '/docs/modules/json/api-reference/ndjson-arrow-loader',
  NDJSONLoader: '/docs/modules/json/api-reference/ndjson-loader',
  OBJArrowLoader: '/docs/modules/obj/api-reference/obj-loader',
  OBJLoader: '/docs/modules/obj/api-reference/obj-loader',
  ParquetArrowLoader: '/docs/modules/parquet/api-reference/parquet-loader',
  ParquetLoader: '/docs/modules/parquet/api-reference/parquet-loader',
  PCDArrowLoader: '/docs/modules/pcd/api-reference/pcd-loader',
  PCDLoader: '/docs/modules/pcd/api-reference/pcd-loader',
  PLYArrowLoader: '/docs/modules/ply/api-reference/ply-loader',
  PLYLoader: '/docs/modules/ply/api-reference/ply-loader',
  PotreeLoader: '/docs/modules/potree/api-reference/potree-loader',
  QuantizedMeshArrowLoader: '/docs/modules/terrain/api-reference/quantized-mesh-loader',
  QuantizedMeshLoader: '/docs/modules/terrain/api-reference/quantized-mesh-loader',
  RadianceHDRLoader: '/docs/modules/textures/api-reference/radiance-hdr-loader',
  ShapefileLoader: '/docs/modules/shapefile/api-reference/shapefile-loader',
  SHPLoader: '/docs/modules/shapefile/api-reference/shp-loader',
  TCXLoader: '/docs/modules/kml/api-reference/tcx-loader',
  TerrainArrowLoader: '/docs/modules/terrain/api-reference/terrain-loader',
  TerrainLoader: '/docs/modules/terrain/api-reference/terrain-loader',
  TextureArrayLoader: '/docs/modules/textures/api-reference/texture-array-loader',
  TextureCubeLoader: '/docs/modules/textures/api-reference/texture-cube-loader',
  TextureLoader: '/docs/modules/textures/api-reference/texture-loader',
  Tiles3DLoader: '/docs/modules/3d-tiles/api-reference/tiles-3d-loader',
  WKBLoader: '/docs/modules/wkt/api-reference/wkb-loader',
  WKTLoader: '/docs/modules/wkt/api-reference/wkt-loader',
  XMLLoader: '/docs/modules/xml/api-reference/xml-loader'
};

const writerDocumentationLinks = {
  ArrowWriter: '/docs/modules/arrow/api-reference/arrow-writer',
  BSONWriter: '/docs/modules/bson/api-reference/bson-writer',
  CompressedTextureWriter: '/docs/modules/textures/api-reference/compressed-texture-writer',
  CSVArrowWriter: '/docs/modules/csv/api-reference/csv-writer',
  CSVWriter: '/docs/modules/csv/api-reference/csv-writer',
  DracoWriter: '/docs/modules/draco/api-reference/draco-writer',
  GeoArrowWriter: '/docs/modules/arrow/formats/geoarrow',
  GeoJSONWriter: '/docs/modules/json/api-reference/geojson-writer',
  GLBWriter: '/docs/modules/gltf/api-reference/glb-writer',
  GLTFWriter: '/docs/modules/gltf/api-reference/gltf-writer',
  ImageWriter: '/docs/modules/images/api-reference/image-writer',
  JSONWriter: '/docs/modules/json/api-reference/json-writer',
  KTX2BasisUniversalTextureWriter: '/docs/modules/textures/api-reference/ktx2-basis-texture-writer',
  LASWriter: '/docs/modules/las/api-reference/las-writer',
  MVTWriter: '/docs/modules/mvt/api-reference/mvt-writer',
  OBJWriter: '/docs/modules/obj/api-reference/obj-writer',
  ParquetArrowWriter: '/docs/modules/parquet/api-reference/parquet-writer',
  PCDWriter: '/docs/modules/pcd/api-reference/pcd-writer',
  PLYWriter: '/docs/modules/ply/api-reference/ply-writer',
  QuantizedMeshWriter: '/docs/modules/terrain/api-reference/quantized-mesh-writer',
  Tiles3DWriter: '/docs/modules/3d-tiles/api-reference/tile-3d-writer',
  TWKBWriter: '/docs/modules/wkt/api-reference/twkb-writer',
  WKBWriter: '/docs/modules/wkt/api-reference/wkb-writer',
  WKTWriter: '/docs/modules/wkt/api-reference/wkt-writer'
};

const sourceDocumentationLinks = {
  COPCSource: '/docs/modules/copc/api-reference/copc-source',
  GeoTIFFSource: '/docs/modules/geotiff',
  I3SSource: '/docs/modules/tiles/api-reference/i3s-source',
  MLTSource: '/docs/modules/mlt/api-reference/mlt-source',
  MVTSource: '/docs/modules/mvt/api-reference/mvt-source',
  PMTilesSource: '/docs/modules/pmtiles/api-reference/pmtiles-source',
  TableTileSource: '/docs/modules/mvt/api-reference/table-tile-source',
  Tiles3DSource: '/docs/modules/tiles/api-reference/tiles-3d-source',
  WMSSource: '/docs/modules/wms/api-reference/wms-source'
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

const streamingLoaders = ['CSVLoader', 'JSONLoader', 'GeoJSONLoader', 'ParquetLoader'];

const streamingProcessingBlocks = ['loadInBatches()', 'parseInBatches()', 'transforms', 'batchSize'];

const streamingOutputs = ['Table batches', 'GeoJSON batches', 'Arrow batches'];

const ConceptsSection = styled.section`
  background:
    linear-gradient(180deg, var(--ifm-color-white) 0%, var(--ifm-color-gray-200) 100%),
    var(--ifm-color-gray-200);
  color: var(--ifm-color-gray-900);
  padding: 88px 64px 96px;

  @media screen and (max-width: 996px) {
    padding: 72px 32px 80px;
  }

  @media screen and (max-width: 640px) {
    padding: 56px 20px 64px;
  }
`;

const Content = styled.div`
  margin: 0 auto;
  max-width: 1180px;
`;

const Intro = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(280px, 1.2fr);
  gap: 40px;
  align-items: end;
  margin-bottom: 40px;

  @media screen and (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const Eyebrow = styled.p`
  color: var(--ifm-color-primary-darkest);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 14px;
  text-transform: uppercase;
`;

const Title = styled.h2`
  color: var(--ifm-color-black);
  font-size: 42px;
  font-weight: 800;
  line-height: 1.08;
  margin: 0;

  @media screen and (max-width: 640px) {
    font-size: 32px;
  }
`;

const Lead = styled.p`
  color: var(--ifm-color-gray-800);
  font-size: 18px;
  line-height: 1.65;
  margin: 0;
`;

const LinkBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 36px;
`;

const GuideLink = styled.a`
  align-items: center;
  background: var(--ifm-color-white);
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  color: var(--ifm-color-gray-900);
  display: inline-flex;
  font-size: 13px;
  font-weight: 700;
  gap: 8px;
  line-height: 1;
  padding: 11px 14px;
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
`;

const PanelGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 22px;

  @media screen and (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.article`
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(43, 56, 72, 0.14);
  overflow: hidden;
`;

const WidePanel = styled(Panel)`
  grid-column: 1 / -1;
`;

const PanelHeader = styled.div`
  border-bottom: 1px solid var(--ifm-color-gray-300);
  display: grid;
  gap: 8px;
  padding: 24px 26px 18px;
`;

const PanelLabel = styled.p`
  color: ${(props) => props.$color || 'var(--ifm-color-primary-darkest)'};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.2;
  margin: 0;
  text-transform: uppercase;
`;

const PanelTitle = styled.h3`
  color: var(--ifm-color-black);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
`;

const PanelText = styled.p`
  color: var(--ifm-color-gray-800);
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
`;

const Diagram = styled.div`
  display: grid;
  gap: 18px;
  padding: 26px;
`;

const TabList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const TabRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
`;

const RepresentationTabs = styled(TabList)`
  justify-content: flex-end;
`;

const TabButton = styled.button`
  background: ${(props) =>
    props.$active ? 'rgba(0, 173, 230, 0.12)' : 'var(--ifm-color-white)'};
  border: 1px solid
    ${(props) => (props.$active ? 'rgba(0, 173, 230, 0.7)' : 'var(--ifm-color-gray-400)')};
  border-radius: 8px;
  color: ${(props) => (props.$active ? 'var(--ifm-color-primary-darkest)' : 'var(--ifm-color-gray-800)')};
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

const Flow = styled.div`
  align-items: stretch;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(180px, 1fr) auto minmax(180px, 0.85fr) auto minmax(150px, 0.7fr);

  @media screen and (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

const SourceFlow = styled(Flow)`
  grid-template-columns: 1fr;
`;

const StreamingFlow = styled(Flow)`
  grid-template-columns: minmax(180px, 1fr) auto minmax(210px, 0.9fr) auto minmax(170px, 0.8fr);

  @media screen and (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

const CompactFlow = styled(Flow)`
  grid-template-columns: 1fr;
  padding-top: 14px;
`;

const Stack = styled.div`
  display: grid;
  gap: 8px;
`;

const WriterStack = styled(Stack)`
  align-content: start;
  align-self: start;
`;

const ConceptColumn = styled.div`
  align-self: stretch;
  display: grid;
  gap: 10px;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
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

const LoaderGrid = styled.div`
  align-content: start;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media screen and (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SourceGrid = styled(LoaderGrid)`
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

const LinkedNode = styled(Node).attrs({as: 'a'})`
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

const CompactNode = styled(Node)`
  font-size: ${(props) => (props.$compactText ? '11px' : '12px')};
  min-height: 34px;
  padding: 8px 10px;
`;

const LinkedCompactNode = styled(CompactNode).attrs({as: 'a'})`
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

const EmptyNode = styled(Node)`
  background: var(--ifm-color-gray-200);
  border-style: dashed;
  color: var(--ifm-color-gray-700);
`;

const CategoryNode = styled(Node)`
  background: ${(props) => props.$background};
  border-color: ${(props) => props.$border};
  color: var(--ifm-color-black);
  font-weight: 800;
`;

const LinkedCategoryNode = styled(CategoryNode).attrs({as: 'a'})`
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

const DataCategoryNode = styled(LinkedCategoryNode)`
  height: 100%;
  min-height: 100%;
`;

const DataSourceNode = styled(CategoryNode)`
  align-items: stretch;
  display: grid;
  gap: 12px;
  justify-content: stretch;
`;

const CenteredDataSourceNode = styled(CategoryNode)`
  justify-content: center;
  text-align: center;
`;

const LabelOnlyNode = styled(CategoryNode)`
  justify-content: flex-start;
`;

const CenteredNodeContent = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const MethodGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media screen and (max-width: 420px) {
    grid-template-columns: 1fr;
  }
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

const Connector = styled.div`
  align-items: center;
  color: var(--ifm-color-primary-darkest);
  display: flex;
  font-size: 18px;
  font-weight: 800;
  justify-content: center;
  min-width: 34px;

  &::before {
    border-bottom: 9px solid transparent;
    border-left: 15px solid var(--ifm-color-primary-darkest);
    border-top: 9px solid transparent;
    content: '';
    height: 0;
    width: 0;
  }

  @media screen and (max-width: 840px) {
    min-height: 18px;

    &::before {
      border: 0;
      content: 'down';
      font-size: 11px;
      height: auto;
      letter-spacing: 0;
      text-transform: uppercase;
      width: auto;
    }
  }
`;

const VerticalConnector = styled(Connector)`
  align-items: flex-end;
  min-height: 28px;
  padding-bottom: 2px;

  &::before {
    border: 0;
    content: '${(props) => props.$label || 'then'}';
    font-size: 11px;
    height: auto;
    letter-spacing: 0;
    text-transform: uppercase;
    width: auto;
  }
`;

const SplitPanel = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

  @media screen and (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Note = styled.div`
  background: var(--ifm-color-gray-200);
  border-left: 4px solid ${(props) => props.$color || 'var(--ifm-color-primary)'};
  border-radius: 8px;
  color: var(--ifm-color-gray-800);
  font-size: 14px;
  line-height: 1.55;
  padding: 14px 16px;
`;

/** Renders the homepage section that explains loaders.gl concept flows. */
export default function Concepts() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryTabs[0].id);
  const [selectedRepresentationId, setSelectedRepresentationId] = useState(representationTabs[0].id);
  const [selectedSourceTabId, setSelectedSourceTabId] = useState(sourceTabs[0].id);
  const selectedCategory = categoryTabs.find((category) => category.id === selectedCategoryId);
  const selectedRepresentation = selectedCategory.representations[selectedRepresentationId];
  const selectedSourceTab = sourceTabs.find((sourceTab) => sourceTab.id === selectedSourceTabId);
  const previewLayer =
    selectedSourceTab.deckLayers.find((layer) => !deckLayerDocumentationLinks[layer]) || null;
  const renderedDeckLayers = previewLayer
    ? selectedSourceTab.deckLayers.filter((layer) => layer !== previewLayer)
    : selectedSourceTab.deckLayers;

  return (
    <ConceptsSection>
      <Content>
        <Intro>
          <div>
            <Eyebrow>How loaders.gl fits together</Eyebrow>
            <Title>Different formats. Common data shapes. Portable pipelines.</Title>
          </div>
          <Lead>
            Loaders decode files and services into category data that applications can use
            consistently. Writers encode compatible data back out. Sources handle datasets that need
            metadata, tiles, or repeated requests.
          </Lead>
        </Intro>

        <LinkBar aria-label="Concept guide links">
          <GuideLink href="/docs/developer-guide/loader-categories">Loader categories</GuideLink>
          <GuideLink href="/docs/developer-guide/using-loaders">Using loaders</GuideLink>
          <GuideLink href="/docs/developer-guide/using-writers">Using writers</GuideLink>
          <GuideLink href="/docs/developer-guide/using-sources">Using sources</GuideLink>
          <GuideLink href="/docs/developer-guide/composite-loaders">Composite loaders</GuideLink>
        </LinkBar>

        <PanelGrid>
          <WidePanel>
            <PanelHeader>
              <PanelLabel>Category data</PanelLabel>
              <PanelTitle>Load many formats into one application path.</PanelTitle>
              <PanelText>
                Category data lets related loaders return compatible structures, so rendering,
                analysis, and export code can be shared.
              </PanelText>
            </PanelHeader>
            <Diagram>
              <TabRow>
                <TabList role="tablist" aria-label="Loader category tabs">
                  {categoryTabs.map((category) => (
                    <TabButton
                      key={category.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedCategory.id === category.id}
                      $active={selectedCategory.id === category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      {category.label}
                    </TabButton>
                  ))}
                </TabList>
                <RepresentationTabs role="tablist" aria-label="Data representation tabs">
                  {representationTabs.map((representation) => (
                    <TabButton
                      key={representation.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedRepresentationId === representation.id}
                      $active={selectedRepresentationId === representation.id}
                      onClick={() => setSelectedRepresentationId(representation.id)}
                    >
                      {representation.label}
                    </TabButton>
                  ))}
                </RepresentationTabs>
              </TabRow>
              <Flow>
                <ConceptColumn>
                  <StageLabel>Decode</StageLabel>
                  <LoaderGrid>
                    {selectedRepresentation.loaders.length > 0 ? (
                      selectedRepresentation.loaders.map((loader) => (
                        <LinkedNode
                          key={loader}
                          href={loaderDocumentationLinks[loader]}
                          $compactText={loader.length > 20}
                        >
                          <span>{loader}</span>
                          <LinkMark aria-hidden="true">↗</LinkMark>
                        </LinkedNode>
                      ))
                    ) : (
                      <EmptyNode>No {selectedRepresentationId === 'arrow' ? 'Arrow' : 'plain'} loaders</EmptyNode>
                    )}
                  </LoaderGrid>
                </ConceptColumn>
                <Connector />
                <ConceptColumn>
                  <StageLabel>Data</StageLabel>
                  <DataCategoryNode
                    href={categoryDocumentationLinks[selectedCategory.id]}
                    $background="rgba(0, 173, 230, 0.12)"
                    $border="rgba(0, 173, 230, 0.55)"
                  >
                    <span>{selectedRepresentation.data}</span>
                    <NodeMeta>
                      <TinyLabel>{selectedRepresentation.detail}</TinyLabel>
                      <LinkMark aria-hidden="true">↗</LinkMark>
                    </NodeMeta>
                  </DataCategoryNode>
                </ConceptColumn>
                <Connector />
                <ConceptColumn>
                  <StageLabel>Encode</StageLabel>
                  <WriterStack>
                    {selectedRepresentation.writers.length > 0 ? (
                      selectedRepresentation.writers.map((writer) => (
                        <LinkedCategoryNode
                          key={writer}
                          href={writerDocumentationLinks[writer]}
                          $compactText={writer.length > 20}
                          $background="rgba(53, 173, 107, 0.12)"
                          $border="rgba(53, 173, 107, 0.55)"
                        >
                          <span>{writer}</span>
                          <LinkMark aria-hidden="true">↗</LinkMark>
                        </LinkedCategoryNode>
                      ))
                    ) : (
                      <EmptyNode>No {selectedRepresentationId === 'arrow' ? 'Arrow' : 'plain'} writers</EmptyNode>
                    )}
                  </WriterStack>
                </ConceptColumn>
              </Flow>
            </Diagram>
          </WidePanel>

          <Panel>
            <PanelHeader>
              <PanelLabel $color="#287A4B">Data sources</PanelLabel>
              <PanelTitle>Load incrementally from tiles or services.</PanelTitle>
              <PanelText>
                Sources encapsulate incremental data loading from cloud archives and web services.
              </PanelText>
            </PanelHeader>
            <Diagram>
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
                    <SourceInstruction>Sources</SourceInstruction>
                    <SourceGrid>
                      {selectedSourceTab.sources.map((source) => (
                        <LinkedCompactNode
                          key={source}
                          href={sourceDocumentationLinks[source]}
                          $compactText={source.length > 20}
                        >
                          <span>{source}</span>
                          <NodeMeta>
                            <SourceTag>{sourceTags[source]}</SourceTag>
                            <LinkMark aria-hidden="true">↗</LinkMark>
                          </NodeMeta>
                        </LinkedCompactNode>
                      ))}
                    </SourceGrid>
                  </SourceBox>
                </SourceStage>
                <VerticalConnector $label="Create a Data Source" />
                <CenteredDataSourceNode
                  $background="rgba(53, 173, 107, 0.12)"
                  $border="rgba(53, 173, 107, 0.55)"
                >
                  <span>createDataSource()</span>
                </CenteredDataSourceNode>
                <VerticalConnector $label="Incrementally Load Data" />
                <DataSourceNode $background="rgba(53, 173, 107, 0.1)" $border="rgba(53, 173, 107, 0.45)">
                  {selectedSourceTab.dataSource}
                  <MethodGrid>
                    {selectedSourceTab.methods.map((method) => (
                      <CompactNode key={method}>{method}</CompactNode>
                    ))}
                  </MethodGrid>
                </DataSourceNode>
                <StageLabel>Manage loading</StageLabel>
                <CategoryNode $background="rgba(255, 196, 57, 0.2)" $border="rgba(184, 122, 0, 0.42)">
                  <CenteredNodeContent>
                    {loadingManagerDocumentationLinks[selectedSourceTab.loadingManager] ? (
                      <LinkedCompactNode href={loadingManagerDocumentationLinks[selectedSourceTab.loadingManager]}>
                        <span>{selectedSourceTab.loadingManager}</span>
                        <LinkMark aria-hidden="true">↗</LinkMark>
                      </LinkedCompactNode>
                    ) : (
                      selectedSourceTab.loadingManager
                    )}
                  </CenteredNodeContent>
                </CategoryNode>
                <StageLabel>Loaded data</StageLabel>
                <CategoryNode $background="rgba(0, 173, 230, 0.1)" $border="rgba(0, 173, 230, 0.45)">
                  <span>{selectedSourceTab.outputCategory}</span>
                  <TinyLabel>{selectedSourceTab.outputDetail}</TinyLabel>
                </CategoryNode>
                <StageLabel>Render with deck.gl (optional)</StageLabel>
                <CategoryNode $background="rgba(0, 173, 230, 0.08)" $border="rgba(0, 173, 230, 0.32)">
                  <CenteredNodeContent>
                    {previewLayer ? (
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
                              <LinkedCompactNode key={layer} href={deckLayerDocumentationLinks[layer]}>
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
                          <LinkedCompactNode key={layer} href={deckLayerDocumentationLinks[layer]}>
                            <span>{layer}</span>
                            <LinkMark aria-hidden="true">↗</LinkMark>
                          </LinkedCompactNode>
                        ))}
                      </MethodGrid>
                    )}
                  </CenteredNodeContent>
                </CategoryNode>
              </SourceFlow>
            </Diagram>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelLabel $color="#B54F49">Composite loading</PanelLabel>
              <PanelTitle>Complex formats invoke sub loaders.</PanelTitle>
              <PanelText>
                Composite loaders resolve linked assets and delegate embedded content without
                pushing that work into application code.
              </PanelText>
            </PanelHeader>
            <Diagram>
              <SplitPanel>
                <CompactFlow>
                  <Stack>
                    <LinkedNode href={loaderDocumentationLinks.GLTFLoader}>
                      <span>GLTFLoader</span>
                      <LinkMark aria-hidden="true">↗</LinkMark>
                    </LinkedNode>
                    <LinkedNode href={loaderDocumentationLinks.Tiles3DLoader}>
                      <span>Tiles3DLoader</span>
                      <LinkMark aria-hidden="true">↗</LinkMark>
                    </LinkedNode>
                  </Stack>
                  <VerticalConnector $label="calls" />
                  <Stack>
                    {subloaders.map((subloader) => (
                      <LinkedNode
                        key={subloader}
                        href={loaderDocumentationLinks[subloader]}
                        $compactText={subloader.length > 20}
                      >
                        <span>{subloader}</span>
                        <LinkMark aria-hidden="true">↗</LinkMark>
                      </LinkedNode>
                    ))}
                  </Stack>
                  <VerticalConnector $label="returns" />
                  <LabelOnlyNode $background="rgba(181, 79, 73, 0.1)" $border="rgba(181, 79, 73, 0.5)">
                    <span>glTF data</span>
                  </LabelOnlyNode>
                </CompactFlow>
                <Note $color="#B54F49">
                  A single top-level load can fetch linked buffers, images, compressed meshes, and
                  tile content while preserving the same loaders.gl API surface.
                </Note>
              </SplitPanel>
            </Diagram>
          </Panel>

          <WidePanel>
            <PanelHeader>
              <PanelLabel>Streaming loaders</PanelLabel>
              <PanelTitle>Stream data in batches.</PanelTitle>
              <PanelText>
                Batched loaders let applications process results as bytes arrive, without holding a
                large file in one string or ArrayBuffer.
              </PanelText>
            </PanelHeader>
            <Diagram>
              <StreamingFlow>
                <ConceptColumn>
                  <StageLabel>Streaming loaders</StageLabel>
                  <LoaderGrid>
                    {streamingLoaders.map((loader) => (
                      <LinkedNode key={loader} href={loaderDocumentationLinks[loader]}>
                        <span>{loader}</span>
                        <LinkMark aria-hidden="true">↗</LinkMark>
                      </LinkedNode>
                    ))}
                  </LoaderGrid>
                </ConceptColumn>
                <Connector />
                <ConceptColumn>
                  <StageLabel>Incremental processing</StageLabel>
                  <DataSourceNode $background="rgba(0, 173, 230, 0.1)" $border="rgba(0, 173, 230, 0.45)">
                    <span>Process while loading</span>
                    <MethodGrid>
                      {streamingProcessingBlocks.map((block) => (
                        <CompactNode key={block}>{block}</CompactNode>
                      ))}
                    </MethodGrid>
                  </DataSourceNode>
                </ConceptColumn>
                <Connector />
                <ConceptColumn>
                  <StageLabel>Batches</StageLabel>
                  <Stack>
                    {streamingOutputs.map((output) => (
                      <CategoryNode
                        key={output}
                        $background="rgba(53, 173, 107, 0.12)"
                        $border="rgba(53, 173, 107, 0.55)"
                      >
                        {output}
                      </CategoryNode>
                    ))}
                  </Stack>
                </ConceptColumn>
              </StreamingFlow>
            </Diagram>
          </WidePanel>
        </PanelGrid>
      </Content>
    </ConceptsSection>
  );
}
