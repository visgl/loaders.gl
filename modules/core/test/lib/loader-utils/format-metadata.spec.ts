// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {Tiles3DFormat, Tile3DSubtreeFormat, ThreeTZFormat} from '@loaders.gl/tiles-3d/3d-tiles';
import {ArrowLoader} from '@loaders.gl/tables/arrow/index';
import {ArrowFormat} from '@loaders.gl/tables/arrow/index';
import {BSONFormat} from '@loaders.gl/tables/bson/index';
import {COPCFormat} from '@loaders.gl/copc';
import {CSVFormat} from '@loaders.gl/tables/csv/index';
import {DracoFormat} from '@loaders.gl/draco';
import {ExcelFormat} from '@loaders.gl/tables/excel/index';
import {GeoPackageFormat} from '@loaders.gl/geospatial/geopackage/index';
import {GeoTIFFFormat, OMETiffFormat} from '@loaders.gl/raster';
import {GLBFormat, GLTFFormat} from '@loaders.gl/gltf';
import {
  ArcGISWebSceneFormat,
  I3SAttributeFormat,
  I3SBuildingSceneLayerFormat,
  I3SContentFormat,
  I3SFormat,
  I3SNodePageFormat,
  SLPKFormat
} from '@loaders.gl/tiles-3d/i3s';
import {ImageBitmapFormat, ImageFormat} from '@loaders.gl/images';
import {
  GeoJSONFormat,
  JSONFormat,
  NDGeoJSONFormat,
  NDJSONFormat
} from '@loaders.gl/tables/json/index';
import {GPXFormat, KMLFormat, KMZFormat, TCXFormat} from '@loaders.gl/geospatial/kml/index';
import {LASFormat} from '@loaders.gl/las';
import {LERCFormat} from '@loaders.gl/raster';
import {MLTFormat} from '@loaders.gl/tiles/mlt';
import {MapStyleFormat, MVTFormat, TileJSONFormat} from '@loaders.gl/tiles/mvt';
import {NetCDFFormat} from '@loaders.gl/scientific/netcdf';
import {MTLFormat, OBJFormat} from '@loaders.gl/obj';
import {ParquetFormat} from '@loaders.gl/tables/parquet/index';
import {PCDFormat} from '@loaders.gl/pcd';
import {PMTilesFormat} from '@loaders.gl/tiles/pmtiles';
import {PotreeBinFormat, PotreeFormat, PotreeHierarchyChunkFormat} from '@loaders.gl/potree';
import {DBFFormat, SHPFormat, ShapefileFormat} from '@loaders.gl/geospatial/shapefile/index';
import {QuantizedMeshFormat, TerrainFormat} from '@loaders.gl/raster';
import {
  BasisTextureFormat,
  CompressedTextureFormat,
  CrunchTextureFormat,
  DDSTextureFormat,
  KTX2BasisTextureFormat,
  NPYFormat,
  RadianceHDRFormat
} from '@loaders.gl/textures';
import {HexWKBFormat, TWKBFormat, WKBFormat, WKTCRSFormat, WKTFormat} from '@loaders.gl/wkt';
import {
  CSWCapabilitiesFormat,
  CSWDomainFormat,
  CSWRecordsFormat,
  GMLFormat,
  WCSCapabilitiesFormat,
  WFSCapabilitiesFormat,
  WMSCapabilitiesFormat,
  WMSErrorFormat,
  WMSFeatureInfoFormat,
  WMSLayerDescriptionFormat,
  WMTSCapabilitiesFormat
} from '@loaders.gl/ogc/wms';
import {HTMLFormat, XMLFormat} from '@loaders.gl/xml';
import {ZipFormat} from '@loaders.gl/zip';
import {FlatGeobufLoader} from '@loaders.gl/geospatial/flatgeobuf/index';
import {FlatGeobufFormat} from '@loaders.gl/geospatial/flatgeobuf/index';
import {MVTLoader, TileJSONLoader} from '@loaders.gl/tiles/mvt';
import {PLYLoader} from '@loaders.gl/ply';
import {PLYFormat} from '@loaders.gl/ply';
import {VideoFormat} from '../../../../video/src/video-format';

const FORMAT_EXPORTS = [
  ['Tiles3DFormat', Tiles3DFormat, 'binary'],
  ['Tile3DSubtreeFormat', Tile3DSubtreeFormat, 'binary'],
  ['ThreeTZFormat', ThreeTZFormat, 'zip'],
  ['ArrowFormat', ArrowFormat, 'arrow'],
  ['BSONFormat', BSONFormat, 'binary'],
  ['COPCFormat', COPCFormat, 'binary'],
  ['CSVFormat', CSVFormat, 'csv'],
  ['DracoFormat', DracoFormat, 'binary'],
  ['ExcelFormat', ExcelFormat, 'zip'],
  ['FlatGeobufFormat', FlatGeobufFormat, 'flatbuffers'],
  ['GeoPackageFormat', GeoPackageFormat, 'sqlite'],
  ['GeoTIFFFormat', GeoTIFFFormat, 'image'],
  ['OMETiffFormat', OMETiffFormat, 'image'],
  ['GLBFormat', GLBFormat, 'binary'],
  ['GLTFFormat', GLTFFormat, 'binary'],
  ['I3SFormat', I3SFormat, 'binary'],
  ['I3SContentFormat', I3SContentFormat, 'binary'],
  ['I3SAttributeFormat', I3SAttributeFormat, 'binary'],
  ['I3SNodePageFormat', I3SNodePageFormat, 'json'],
  ['SLPKFormat', SLPKFormat, 'zip'],
  ['ArcGISWebSceneFormat', ArcGISWebSceneFormat, 'json'],
  ['I3SBuildingSceneLayerFormat', I3SBuildingSceneLayerFormat, 'json'],
  ['ImageFormat', ImageFormat, 'image'],
  ['ImageBitmapFormat', ImageBitmapFormat, 'image'],
  ['JSONFormat', JSONFormat, 'json'],
  ['GeoJSONFormat', GeoJSONFormat, 'json'],
  ['NDJSONFormat', NDJSONFormat, 'json'],
  ['NDGeoJSONFormat', NDGeoJSONFormat, 'json'],
  ['KMLFormat', KMLFormat, 'xml'],
  ['KMZFormat', KMZFormat, 'zip'],
  ['GPXFormat', GPXFormat, 'xml'],
  ['TCXFormat', TCXFormat, 'xml'],
  ['LASFormat', LASFormat, 'binary'],
  ['LERCFormat', LERCFormat, 'binary'],
  ['MLTFormat', MLTFormat, 'binary'],
  ['TileJSONFormat', TileJSONFormat, 'json'],
  ['MapStyleFormat', MapStyleFormat, 'json'],
  ['MVTFormat', MVTFormat, 'protobuf'],
  ['NetCDFFormat', NetCDFFormat, 'binary'],
  ['OBJFormat', OBJFormat, 'text'],
  ['MTLFormat', MTLFormat, 'text'],
  ['ParquetFormat', ParquetFormat, 'parquet'],
  ['PCDFormat', PCDFormat, 'text'],
  ['PLYFormat', PLYFormat, 'text'],
  ['PMTilesFormat', PMTilesFormat, 'binary'],
  ['PotreeFormat', PotreeFormat, 'json'],
  ['PotreeHierarchyChunkFormat', PotreeHierarchyChunkFormat, 'binary'],
  ['PotreeBinFormat', PotreeBinFormat, 'binary'],
  ['ShapefileFormat', ShapefileFormat, 'binary'],
  ['SHPFormat', SHPFormat, 'binary'],
  ['DBFFormat', DBFFormat, 'binary'],
  ['TerrainFormat', TerrainFormat, 'image'],
  ['QuantizedMeshFormat', QuantizedMeshFormat, 'binary'],
  ['BasisTextureFormat', BasisTextureFormat, 'image'],
  ['CompressedTextureFormat', CompressedTextureFormat, 'image'],
  ['CrunchTextureFormat', CrunchTextureFormat, 'image'],
  ['RadianceHDRFormat', RadianceHDRFormat, 'image'],
  ['NPYFormat', NPYFormat, 'binary'],
  ['DDSTextureFormat', DDSTextureFormat, 'image'],
  ['KTX2BasisTextureFormat', KTX2BasisTextureFormat, 'image'],
  ['VideoFormat', VideoFormat, 'video'],
  ['WKTFormat', WKTFormat, 'text'],
  ['WKBFormat', WKBFormat, 'binary'],
  ['HexWKBFormat', HexWKBFormat, 'text'],
  ['TWKBFormat', TWKBFormat, 'binary'],
  ['WKTCRSFormat', WKTCRSFormat, 'text'],
  ['GMLFormat', GMLFormat, 'xml'],
  ['WMSCapabilitiesFormat', WMSCapabilitiesFormat, 'xml'],
  ['WFSCapabilitiesFormat', WFSCapabilitiesFormat, 'xml'],
  ['WMSErrorFormat', WMSErrorFormat, 'xml'],
  ['CSWCapabilitiesFormat', CSWCapabilitiesFormat, 'xml'],
  ['CSWDomainFormat', CSWDomainFormat, 'xml'],
  ['CSWRecordsFormat', CSWRecordsFormat, 'xml'],
  ['WCSCapabilitiesFormat', WCSCapabilitiesFormat, 'xml'],
  ['WMTSCapabilitiesFormat', WMTSCapabilitiesFormat, 'xml'],
  ['WMSFeatureInfoFormat', WMSFeatureInfoFormat, 'xml'],
  ['WMSLayerDescriptionFormat', WMSLayerDescriptionFormat, 'xml'],
  ['XMLFormat', XMLFormat, 'xml'],
  ['HTMLFormat', HTMLFormat, 'text'],
  ['ZipFormat', ZipFormat, 'zip']
] as const;

test('public Format exports include physical encoding', () => {
  for (const [name, format, encoding] of FORMAT_EXPORTS) {
    expect(format, name).toBeDefined();
    if (!format) {
      continue;
    }
    expect(format.encoding, name).toBe(encoding);
    expect(format.format, name).toBeTruthy();
  }
});

test('loader format metadata includes physical encoding and logical format', () => {
  expect(TileJSONLoader.encoding).toBe('json');
  expect(TileJSONLoader.format).toBe('tilejson');

  expect(MVTLoader.encoding).toBe('protobuf');
  expect(MVTLoader.format).toBe('mvt');

  expect(FlatGeobufLoader.encoding).toBe('flatbuffers');
  expect(FlatGeobufLoader.format).toBe('flatgeobuf');

  expect(ArrowLoader.encoding).toBe('arrow');
  expect(ArrowLoader.format).toBe('arrow');
});

test('hybrid format metadata preserves compatibility flags', () => {
  expect(PLYLoader.encoding).toBe('text');
  expect(PLYLoader.format).toBe('ply');
  expect(PLYLoader.text).toBe(true);
  expect(PLYLoader.binary).toBe(true);
});
