// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const MODULES_DIRECTORY = join(process.cwd(), 'modules');

const FORMAT_EXPORTS = {
  'tiles-3d/3d-tiles': ['Tiles3DFormat', 'Tile3DSubtreeFormat', 'ThreeTZFormat'],
  arrow: ['ArrowFormat'],
  bson: ['BSONFormat'],
  copc: ['COPCFormat'],
  csv: ['CSVFormat'],
  tables: [
    'CSVFormat',
    'AvroFormat',
    'BSONFormat',
    'ExcelFormat',
    'ArrowFormat',
    'JSONFormat',
    'GeoJSONFormat',
    'NDJSONFormat',
    'NDGeoJSONFormat',
    'LanceFormat',
    'ORCFormat',
    'ParquetFormat'
  ],
  geospatial: [
    'KMLFormat',
    'KMZFormat',
    'GPXFormat',
    'TCXFormat',
    'ShapefileFormat',
    'SHPFormat',
    'DBFFormat',
    'FlatGeobufFormat',
    'GeoPackageFormat'
  ],
  draco: ['DracoFormat'],
  excel: ['ExcelFormat'],
  flatgeobuf: ['FlatGeobufFormat'],
  geopackage: ['GeoPackageFormat'],
  raster: ['GeoTIFFFormat', 'OMETiffFormat', 'LERCFormat', 'TerrainFormat', 'QuantizedMeshFormat'],
  gltf: ['GLTFFormat', 'GLBFormat'],
  'tiles-3d/i3s': [
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
  kml: ['KMLFormat', 'KMZFormat', 'GPXFormat', 'TCXFormat'],
  las: ['LASFormat'],
  'tiles/mlt': ['MLTFormat'],
  'tiles/mvt': ['TileJSONFormat', 'MapStyleFormat', 'MVTFormat'],
  netcdf: ['NetCDFFormat'],
  obj: ['OBJFormat', 'MTLFormat'],
  parquet: ['ParquetFormat'],
  pcd: ['PCDFormat'],
  ply: ['PLYFormat'],
  'tiles/pmtiles': ['PMTilesFormat'],
  potree: ['PotreeFormat', 'PotreeHierarchyChunkFormat', 'PotreeBinFormat'],
  shapefile: ['ShapefileFormat', 'SHPFormat', 'DBFFormat'],
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
      const [packageName, subpathName] = moduleName.split('/');
      const indexSource = readFileSync(
        join(MODULES_DIRECTORY, packageName, 'src', subpathName || '', 'index.ts'),
        'utf8'
      );

      for (const formatName of formatNames) {
        expect(indexSource, formatName).toMatch(new RegExp(`\\b${formatName}\\b`));
      }
    });
  }
});
