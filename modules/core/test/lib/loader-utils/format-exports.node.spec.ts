// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const MODULES_DIRECTORY = join(process.cwd(), 'modules');

const FORMAT_EXPORTS = {
  'tiles-3d/3d-tiles': ['Tiles3DFormat', 'Tile3DSubtreeFormat', 'ThreeTZFormat'],
  'tables/arrow': ['ArrowFormat'],
  'tiles-3d/copc': ['COPCFormat'],
  'tables/csv': ['CSVFormat'],
  'tables/avro': ['AvroFormat'],
  'tables/lance': ['LanceFormat'],
  'tables/orc': ['ORCFormat'],
  'scene/draco': ['DracoFormat'],
  'scientific/adsb': ['ADSBFormat'],
  'scientific/ais': ['AISFormat'],
  'scientific/gtfs': ['GTFSFormat'],
  'scientific/gtfs-realtime': ['GTFSRealtimeFormat'],
  'geospatial/omm': ['OMMFormat'],
  'geospatial/tle': ['TLEFormat'],
  'geospatial/flatgeobuf': ['FlatGeobufFormat'],
  'geospatial/geopackage': ['GeoPackageFormat'],
  'raster/geotiff': ['GeoTIFFFormat', 'OMETiffFormat'],
  'raster/lerc': ['LERCFormat'],
  'raster/terrain': ['TerrainFormat', 'QuantizedMeshFormat'],
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
  'images/image': ['ImageFormat', 'ImageBitmapFormat'],
  'tables/json': ['JSONFormat', 'GeoJSONFormat', 'NDJSONFormat', 'NDGeoJSONFormat'],
  'geospatial/kml': ['KMLFormat', 'KMZFormat'],
  'geospatial/gpx': ['GPXFormat'],
  'geospatial/tcx': ['TCXFormat'],
  'geospatial/omm': ['OMMFormat'],
  'geospatial/tle': ['TLEFormat'],
  'pointclouds/las': ['LASFormat'],
  'tiles/mlt': ['MLTFormat'],
  'tiles/mvt': ['TileJSONFormat', 'MapStyleFormat', 'MVTFormat'],
  'scientific/netcdf': ['NetCDFFormat'],
  'scientific/npy': ['NPYFormat'],
  'scene/obj': ['OBJFormat', 'MTLFormat'],
  'tables/parquet': ['ParquetFormat'],
  'pointclouds/pcd': ['PCDFormat'],
  'pointclouds/ply': ['PLYFormat'],
  'tiles/pmtiles': ['PMTilesFormat'],
  'tiles-3d/potree': ['PotreeFormat', 'PotreeHierarchyChunkFormat', 'PotreeBinFormat'],
  'geospatial/shapefile': ['ShapefileFormat', 'SHPFormat', 'DBFFormat'],
  'images/texture': [
    'BasisTextureFormat',
    'CompressedTextureFormat',
    'CrunchTextureFormat',
    'RadianceHDRFormat',
    'DDSTextureFormat',
    'KTX2BasisTextureFormat'
  ],
  'images/video': ['VideoFormat'],
  'geospatial/wkt': ['WKTFormat', 'WKTCRSFormat'],
  'geospatial/wkb': ['WKBFormat', 'HexWKBFormat', 'TWKBFormat'],
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
  'documents/xml': ['XMLFormat'],
  'documents/html': ['HTMLFormat'],
  'documents/yaml': ['YAMLFormat'],
  'documents/toml': ['TOMLFormat'],
  'documents/bson': ['BSONFormat'],
  'documents/markdown': ['MarkdownFormat'],
  'archives/zip': ['ZipFormat'],
  'archives/tar': ['TarFormat']
} as const;

describe('Format exports', () => {
  for (const [moduleName, formatNames] of Object.entries(FORMAT_EXPORTS)) {
    test(`${moduleName} exports its Format objects`, () => {
      const [packageName, subpathName] = moduleName.split('/');
      const directory = join(MODULES_DIRECTORY, packageName);
      const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
      const entrypoint = manifest.exports[`./${subpathName}`].import;
      const sourcePath = entrypoint.replace('./dist/', 'src/').replace(/\.js$/, '.ts');
      const indexSource = readFileSync(join(directory, sourcePath), 'utf8');

      for (const formatName of formatNames) {
        expect(indexSource, formatName).toMatch(new RegExp(`\\b${formatName}\\b`));
      }
    });
  }
});
