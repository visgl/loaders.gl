import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const MODULES_DIRECTORY = join(process.cwd(), 'modules');

const FORMAT_EXPORTS = {
  '3d-tiles': ['Tiles3DFormat', 'Tile3DSubtreeFormat', 'ThreeTZFormat'],
  arrow: ['ArrowFormat'],
  bson: ['BSONFormat'],
  copc: ['COPCFormat'],
  csv: ['CSVFormat'],
  draco: ['DracoFormat'],
  excel: ['ExcelFormat'],
  flatgeobuf: ['FlatGeobufFormat'],
  geopackage: ['GeoPackageFormat'],
  geotiff: ['GeoTIFFFormat', 'OMETiffFormat'],
  gltf: ['GLTFFormat', 'GLBFormat'],
  i3s: [
    'ArcGISWebSceneFormat',
    'I3SAttributeFormat',
    'I3SBuildingSceneLayerFormat',
    'I3SContentFormat',
    'I3SFormat',
    'I3SNodePageFormat',
    'SLPKFormat'
  ],
  images: ['ImageFormat', 'ImageBitmapFormat'],
  json: ['JSONFormat', 'GeoJSONFormat', 'NDJSONFormat', 'NDGeoJSONFormat'],
  kml: ['KMLFormat', 'GPXFormat', 'TCXFormat'],
  las: ['LASFormat'],
  lerc: ['LERCFormat'],
  mlt: ['MLTFormat'],
  mvt: ['TileJSONFormat', 'MapStyleFormat', 'MVTFormat'],
  netcdf: ['NetCDFFormat'],
  obj: ['OBJFormat', 'MTLFormat'],
  parquet: ['ParquetFormat'],
  pcd: ['PCDFormat'],
  ply: ['PLYFormat'],
  pmtiles: ['PMTilesFormat'],
  potree: ['PotreeFormat', 'PotreeHierarchyChunkFormat', 'PotreeBinFormat'],
  shapefile: ['ShapefileFormat', 'SHPFormat', 'DBFFormat'],
  terrain: ['TerrainFormat', 'QuantizedMeshFormat'],
  textures: [
    'BasisTextureFormat',
    'CompressedTextureFormat',
    'CrunchTextureFormat',
    'RadianceHDRFormat',
    'NPYFormat',
    'DDSTextureFormat',
    'KTX2BasisTextureFormat'
  ],
  video: ['VideoFormat'],
  wkt: ['WKTFormat', 'WKBFormat', 'HexWKBFormat', 'TWKBFormat', 'WKTCRSFormat'],
  wms: [
    'GMLFormat',
    'WMSCapabilitiesFormat',
    'WFSCapabilitiesFormat',
    'WMSErrorFormat',
    'CSWCapabilitiesFormat',
    'CSWDomainFormat',
    'CSWRecordsFormat',
    'WCSCapabilitiesFormat',
    'WMTSCapabilitiesFormat',
    'WMSFeatureInfoFormat',
    'WMSLayerDescriptionFormat'
  ],
  xml: ['XMLFormat', 'HTMLFormat'],
  zip: ['ZipFormat']
} as const;

describe('Format exports', () => {
  for (const [moduleName, formatNames] of Object.entries(FORMAT_EXPORTS)) {
    test(`${moduleName} exports all Format objects from the root`, () => {
      const indexSource = readFileSync(join(MODULES_DIRECTORY, moduleName, 'src/index.ts'), 'utf8');

      for (const formatName of formatNames) {
        expect(indexSource, formatName).toMatch(new RegExp(`\\b${formatName}\\b`));
      }
    });
  }
});
