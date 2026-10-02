// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {load} from '@loaders.gl/core';
import Tiles3DConverter from '../apps/tile-converter/src/v4/3d-tiles-converter/3d-tiles-converter';
import {
  loadFromArchive,
  openSLPK,
  getNodeCount
} from '../apps/tile-converter/src/v4/3d-tiles-converter/helpers/load-i3s';

import {validateI3SConversionSpatialReference} from '../apps/tile-converter/src/v4/3d-tiles-converter/helpers/validate-i3s-spatial-reference';

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

vi.mock('@loaders.gl/core', async importOriginal => ({
  ...(await importOriginal<typeof import('@loaders.gl/core')>()),
  load: vi.fn()
}));
vi.mock('../apps/tile-converter/src/v4/3d-tiles-converter/helpers/load-i3s', () => ({
  loadFromArchive: vi.fn(),
  openSLPK: vi.fn(),
  getNodeCount: vi.fn(),
  loadI3SContent: vi.fn()
}));

const WGS84_WKT =
  'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]]';
const WGS84_WKT2 =
  'GEOGCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563]],CS[ellipsoidal,2],AXIS["Longitude",east],AXIS["Latitude",north],ANGLEUNIT["degree",0.0174532925199433]]';

test.each([
  {},
  {spatialReference: {wkid: 4326}},
  {spatialReference: {wkt: WGS84_WKT}},
  {spatialReference: {wkt: WGS84_WKT2}},
  {fullExtent: {spatialReference: {wkid: 4326}}},
  {store: {indexCRS: 'EPSG:4326', vertexCRS: 'urn:ogc:def:crs:EPSG::4326'}},
  {spatialReference: {wkid: 102100, latestWkid: 4326}},
  {
    store: {
      indexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      vertexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326'
    }
  }
])('legacy I3S conversion accepts WGS-84 or undeclared CRS: %j', layer => {
  expect(() => validateI3SConversionSpatialReference(layer)).not.toThrow();
});

test.each([
  {spatialReference: {wkid: 3857}},
  {spatialReference: {wkid: 4326}, fullExtent: {spatialReference: {wkid: 3857}}},
  {spatialReference: {wkt: WGS84_WKT.replace('WGS_1984', 'NAD_1983')}},
  {spatialReference: {wkt: WGS84_WKT.replace('0.0174532925199433', '0.0157079632679489')}},
  {fullExtent: {spatialReference: {wkid: 3857}}},
  {spatialReference: {wkid: 4326, latestWkid: 3857}},
  {spatialReference: {wkt: 'PROJCS["custom"]'}},
  {store: {indexCRS: 'http://www.opengis.net/def/crs/EPSG/0/3857'}},
  {spatialReference: {wkid: 4326}, store: {vertexCRS: 'http://www.opengis.net/def/crs/EPSG/0/3857'}}
])('legacy I3S conversion rejects unsupported CRS with reprojection guidance: %j', layer => {
  expect(() => validateI3SConversionSpatialReference(layer)).toThrow(
    'Reproject the source I3S dataset to EPSG:4326 before conversion.'
  );
});

test.each([
  false,
  true
])('legacy converter rejects projected coordinates before output work and cleans up archives: %s', async useArchive => {
  vi.mocked(load).mockResolvedValue({});
  const destroyArchive = vi.fn().mockResolvedValue(undefined);
  const archive = useArchive ? {destroy: destroyArchive} : null;
  vi.mocked(openSLPK).mockResolvedValue(archive as unknown as Awaited<ReturnType<typeof openSLPK>>);
  vi.mocked(getNodeCount).mockResolvedValue(1);
  vi.mocked(loadFromArchive).mockResolvedValue({spatialReference: {wkid: 3857}});
  const converter = new Tiles3DConverter();
  const startMonitoring = vi.spyOn(converter.progress, 'startMonitoring');
  const createDump = vi.spyOn(converter.conversionDump, 'createDump');
  await expect(
    converter.convert({
      inputUrl: 'local-layer',
      outputPath: 'unused',
      tilesetName: 'unused',
      egmFilePath: 'unused'
    })
  ).rejects.toThrow('requires WGS-84 (EPSG:4326) input');
  expect(startMonitoring).not.toHaveBeenCalled();
  expect(createDump).not.toHaveBeenCalled();
  expect(destroyArchive).toHaveBeenCalledTimes(useArchive ? 1 : 0);
  expect(converter.slpkFilesystem).toBeNull();
});

test('waits for an archive close before rejecting projected input', async () => {
  const archiveClose = Promise.withResolvers<void>();
  const archive = {destroy: vi.fn(() => archiveClose.promise)};
  vi.mocked(load).mockResolvedValue({});
  vi.mocked(openSLPK).mockResolvedValue(archive as unknown as Awaited<ReturnType<typeof openSLPK>>);
  vi.mocked(getNodeCount).mockResolvedValue(1);
  vi.mocked(loadFromArchive).mockResolvedValue({spatialReference: {wkid: 3857}});
  const converter = new Tiles3DConverter();
  const conversion = converter.convert({
    inputUrl: 'archive.slpk',
    outputPath: 'unused',
    tilesetName: 'unused',
    egmFilePath: 'unused'
  });
  const rejection = expect(conversion).rejects.toThrow('requires WGS-84');
  await vi.waitFor(() => expect(archive.destroy).toHaveBeenCalledOnce());
  expect(converter.slpkFilesystem).toBe(archive);
  archiveClose.resolve();
  await rejection;
  expect(converter.slpkFilesystem).toBeNull();
});
