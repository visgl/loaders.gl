// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {expect, test} from 'vitest';

/** Canonical format and capability entrypoints that must cover each package's public root API. */
const canonicalEntrypoints: Record<string, string[]> = {
  arcgis: [
    '@loaders.gl/arcgis/authentication',
    '@loaders.gl/arcgis/discovery',
    '@loaders.gl/arcgis/feature-service',
    '@loaders.gl/arcgis/image-service',
    '@loaders.gl/arcgis/items',
    '@loaders.gl/arcgis/map-service',
    '@loaders.gl/arcgis/scene-aggregation',
    '@loaders.gl/arcgis/scene-service',
    '@loaders.gl/arcgis/vector-tile-service'
  ],
  archives: ['@loaders.gl/archives/tar', '@loaders.gl/archives/zip'],
  compression: [
    '@loaders.gl/compression/brotli',
    '@loaders.gl/compression/bzip2',
    '@loaders.gl/compression/codec',
    '@loaders.gl/compression/deflate',
    '@loaders.gl/compression/gzip',
    '@loaders.gl/compression/lz4',
    '@loaders.gl/compression/lzo',
    '@loaders.gl/compression/native-compression',
    '@loaders.gl/compression/none',
    '@loaders.gl/compression/snappy',
    '@loaders.gl/compression/worker',
    '@loaders.gl/compression/xz',
    '@loaders.gl/compression/zstd'
  ],
  crypto: [
    '@loaders.gl/crypto/crc32',
    '@loaders.gl/crypto/crc32c',
    '@loaders.gl/crypto/encoding',
    '@loaders.gl/crypto/hash',
    '@loaders.gl/crypto/md5',
    '@loaders.gl/crypto/node',
    '@loaders.gl/crypto/sha256',
    '@loaders.gl/crypto/webcrypto'
  ],
  documents: [
    '@loaders.gl/documents/bson',
    '@loaders.gl/documents/html',
    '@loaders.gl/documents/json',
    '@loaders.gl/documents/markdown',
    '@loaders.gl/documents/sax-parser',
    '@loaders.gl/documents/toml',
    '@loaders.gl/documents/xml',
    '@loaders.gl/documents/yaml'
  ],
  geospatial: [
    '@loaders.gl/geospatial/dbf',
    '@loaders.gl/geospatial/flatgeobuf',
    '@loaders.gl/geospatial/geopackage',
    '@loaders.gl/geospatial/gpx',
    '@loaders.gl/geospatial/kml',
    '@loaders.gl/geospatial/shapefile',
    '@loaders.gl/geospatial/shp',
    '@loaders.gl/geospatial/tcx',
    '@loaders.gl/geospatial/wkb',
    '@loaders.gl/geospatial/wkt'
  ],
  graphs: [
    '@loaders.gl/graphs/dot',
    '@loaders.gl/graphs/gexf',
    '@loaders.gl/graphs/graph',
    '@loaders.gl/graphs/graphml'
  ],
  images: [
    '@loaders.gl/images/basis',
    '@loaders.gl/images/color-lut',
    '@loaders.gl/images/crunch',
    '@loaders.gl/images/exr',
    '@loaders.gl/images/ies',
    '@loaders.gl/images/image',
    '@loaders.gl/images/radiance-hdr',
    '@loaders.gl/images/texture',
    '@loaders.gl/images/video'
  ],
  ogc: [
    '@loaders.gl/ogc/csw',
    '@loaders.gl/ogc/gml',
    '@loaders.gl/ogc/stac',
    '@loaders.gl/ogc/wfs',
    '@loaders.gl/ogc/wms',
    '@loaders.gl/ogc/wmts'
  ],
  pointclouds: [
    '@loaders.gl/pointclouds/las',
    '@loaders.gl/pointclouds/pcd',
    '@loaders.gl/pointclouds/ply'
  ],
  raster: ['@loaders.gl/raster/geotiff', '@loaders.gl/raster/lerc', '@loaders.gl/raster/terrain'],
  scene: [
    '@loaders.gl/scene/draco',
    '@loaders.gl/scene/glb',
    '@loaders.gl/scene/gltf',
    '@loaders.gl/scene/materialx',
    '@loaders.gl/scene/mtl',
    '@loaders.gl/scene/obj',
    '@loaders.gl/scene/stl',
    '@loaders.gl/scene/usd'
  ],
  scientific: [
    '@loaders.gl/scientific/netcdf',
    '@loaders.gl/scientific/npy',
    '@loaders.gl/scientific/nrrd',
    '@loaders.gl/scientific/pdb',
    '@loaders.gl/scientific/scientific-array',
    '@loaders.gl/scientific/vtk',
    '@loaders.gl/scientific/zarr'
  ],
  services: ['@loaders.gl/services/authentication'],
  splats: [
    '@loaders.gl/splats/ksplat',
    '@loaders.gl/splats/rad',
    '@loaders.gl/splats/splat',
    '@loaders.gl/splats/spz',
    '@loaders.gl/splats/types'
  ],
  sql: [
    '@loaders.gl/sql/adapter',
    '@loaders.gl/sql/arrow',
    '@loaders.gl/sql/duckdb',
    '@loaders.gl/sql/query',
    '@loaders.gl/sql/snowflake'
  ],
  tables: [
    '@loaders.gl/tables/arrow',
    '@loaders.gl/tables/avro',
    '@loaders.gl/tables/csv',
    '@loaders.gl/tables/geoarrow',
    '@loaders.gl/tables/json',
    '@loaders.gl/tables/lance',
    '@loaders.gl/tables/orc',
    '@loaders.gl/tables/parquet'
  ],
  tiles: [
    '@loaders.gl/tiles-3d/tileset',
    '@loaders.gl/tiles/image-set',
    '@loaders.gl/tiles/raster-set',
    '@loaders.gl/tiles/tileset-2d'
  ],
  'tiles-3d': [
    '@loaders.gl/tiles-3d/3d-tiles',
    '@loaders.gl/tiles-3d/i3s',
    '@loaders.gl/tiles-3d/point-cloud',
    '@loaders.gl/tiles-3d/spatial',
    '@loaders.gl/tiles-3d/tileset'
  ],
  traces: [
    '@loaders.gl/traces/chrome-trace',
    '@loaders.gl/traces/jaeger',
    '@loaders.gl/traces/otlp',
    '@loaders.gl/traces/perfetto',
    '@loaders.gl/traces/stream',
    '@loaders.gl/traces/zipkin'
  ]
};

/** Resolves a published declaration target to its owning source entrypoint. */
function getSourceEntrypoint(packageName: string, entrypoint = '.') {
  const directory = path.resolve('modules', packageName.split('/')[1]);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const target = manifest.exports[entrypoint]?.types;
  expect(target, packageName + entrypoint).toBeTypeOf('string');
  return path.join(directory, target.replace('./dist/', './src/').replace(/\.d\.ts$/, '.ts'));
}

test('format and capability entrypoints cover the public root declarations', () => {
  const roots = Object.keys(canonicalEntrypoints).map(owner =>
    getSourceEntrypoint('@loaders.gl/' + owner)
  );
  const destinations = Object.values(canonicalEntrypoints)
    .flat()
    .map(entrypoint => {
      const [scope, owner, ...subpath] = entrypoint.split('/');
      return getSourceEntrypoint(scope + '/' + owner, './' + subpath.join('/'));
    });
  const program = ts.createProgram([...roots, ...destinations], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true
  });
  const checker = program.getTypeChecker();
  /** Lists public declaration names, including types and indirect reexports. */
  function getExports(filename: string) {
    const source = program.getSourceFile(filename)!;
    const symbol = checker.getSymbolAtLocation(source)!;
    return checker.getExportsOfModule(symbol).map(exported => exported.name);
  }
  for (const [owner, entrypoints] of Object.entries(canonicalEntrypoints)) {
    const exports = new Set(
      entrypoints.flatMap(entrypoint => {
        const [scope, packageOwner, ...subpath] = entrypoint.split('/');
        return getExports(
          getSourceEntrypoint(scope + '/' + packageOwner, './' + subpath.join('/'))
        );
      })
    );
    const missing = getExports(getSourceEntrypoint('@loaders.gl/' + owner)).filter(
      name => !exports.has(name)
    );
    expect(missing, owner).toEqual([]);
  }
});

test('canonical entrypoints publish real declarations, ESM, and CommonJS files', () => {
  for (const entrypoint of new Set(Object.values(canonicalEntrypoints).flat())) {
    const [scope, owner, ...subpath] = entrypoint.split('/');
    const directory = path.resolve('modules', owner);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    const conditions = manifest.exports['./' + subpath.join('/')];
    for (const condition of ['types', 'import']) {
      expect(
        fs.existsSync(path.join(directory, conditions[condition])),
        entrypoint + ' ' + condition
      ).toBe(true);
    }
    if (conditions.require)
      expect(fs.existsSync(path.join(directory, conditions.require)), entrypoint + ' require').toBe(
        true
      );
  }
});

test('representative capability APIs are available through ESM and CommonJS entrypoints', async () => {
  const require = createRequire(import.meta.url);
  for (const [entrypoint, name] of [
    ['@loaders.gl/crypto/sha256', 'SHA256Hash'],
    ['@loaders.gl/sql/adapter', 'SQLDataSource'],
    ['@loaders.gl/graphs/graphml', 'GraphMLLoader'],
    ['@loaders.gl/arcgis/image-service', 'ArcGISImageSource'],
    ['@loaders.gl/traces/chrome-trace', 'ChromeTraceLoader'],
    ['@loaders.gl/tiles/tileset-2d', 'Tileset2D']
  ]) {
    const esm = await import(entrypoint);
    const commonjs = require(entrypoint);
    expect(typeof esm[name], entrypoint).toBe(typeof commonjs[name]);
    expect(esm[name], entrypoint).toBeDefined();
    expect(commonjs[name], entrypoint).toBeDefined();
  }
});
