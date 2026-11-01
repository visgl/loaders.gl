// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const MODULES_DIRECTORY = join(process.cwd(), 'modules');

const FORMAT_EXPORTS = {
  'tiles-3d/3d-tiles': ['Tiles3DFormat', 'Tile3DSubtreeFormat', 'ThreeTZFormat'],
  'tables/arrow': ['ArrowFormat'],
  'tiles-3d/copc': ['COPCFormat'],
  'tables/csv': ['CSVFormat'],
  tables: [
    'CSVFormat',
    'AvroFormat',
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
  scene: ['DracoFormat'],
  'geospatial/flatgeobuf': ['FlatGeobufFormat'],
  'geospatial/geopackage': ['GeoPackageFormat'],
  raster: ['GeoTIFFFormat', 'OMETiffFormat', 'LERCFormat', 'TerrainFormat', 'QuantizedMeshFormat'],
  'scene/gltf': ['GLTFFormat', 'GLBFormat'],
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
  'tables/json': ['JSONFormat', 'GeoJSONFormat', 'NDJSONFormat', 'NDGeoJSONFormat'],
  'geospatial/kml': ['KMLFormat', 'KMZFormat', 'GPXFormat', 'TCXFormat'],
  'pointclouds/las': ['LASFormat'],
  'tiles/mlt': ['MLTFormat'],
  'tiles/mvt': ['TileJSONFormat', 'MapStyleFormat', 'MVTFormat'],
  scientific: ['NetCDFFormat', 'NPYFormat'],
  'scene/obj': ['OBJFormat', 'MTLFormat'],
  'tables/parquet': ['ParquetFormat'],
  'pointclouds/pcd': ['PCDFormat'],
  'pointclouds/ply': ['PLYFormat'],
  'tiles/pmtiles': ['PMTilesFormat'],
  'tiles-3d/potree': ['PotreeFormat', 'PotreeHierarchyChunkFormat', 'PotreeBinFormat'],
  'geospatial/shapefile': ['ShapefileFormat', 'SHPFormat', 'DBFFormat'],
  'images/texture-format': [
    'BasisTextureFormat',
    'CompressedTextureFormat',
    'CrunchTextureFormat',
    'RadianceHDRFormat',
    'DDSTextureFormat',
    'KTX2BasisTextureFormat'
  ],
  'images/video-format': ['VideoFormat'],
  'geospatial/wkt': ['WKTFormat', 'WKBFormat', 'HexWKBFormat', 'TWKBFormat', 'WKTCRSFormat'],
  'ogc/wms': [
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
  documents: [
    'JSONFormat',
    'XMLFormat',
    'HTMLFormat',
    'YAMLFormat',
    'TOMLFormat',
    'BSONFormat',
    'MarkdownFormat'
  ],
  archives: ['ZipFormat', 'TarFormat'],
  'archives/zip': ['ZipFormat'],
  'archives/tar': ['TarFormat']
} as const;

describe('Format exports', () => {
  for (const [moduleName, formatNames] of Object.entries(FORMAT_EXPORTS)) {
    test(`${moduleName} exports its Format objects`, () => {
      const [packageName, subpathName] = moduleName.split('/');
      const indexPath = join(MODULES_DIRECTORY, packageName, 'src', subpathName || '', 'index.ts');
      const sourcePath = existsSync(indexPath)
        ? indexPath
        : join(MODULES_DIRECTORY, packageName, 'src', `${subpathName}.ts`);
      const indexSource = readFileSync(sourcePath, 'utf8');

      for (const formatName of formatNames) {
        expect(indexSource, formatName).toMatch(new RegExp(`\\b${formatName}\\b`));
      }
    });
  }
});
