// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {GetTileParameters, TileGrid} from '@loaders.gl/core/loader-utils';
import {getTileGridValidation} from '@loaders.gl/core/loader-utils/tile-grid';
import {createDataSourceSync} from '@loaders.gl/core';
import {OGCAPITilesLoader, WMTSLoader} from '@loaders.gl/ogc/wms/bundled';
import type {WMTSImageTileSource} from '@loaders.gl/ogc/wms/bundled';

/**
 * Wire values of levels 0 and 1 of the OGC WorldCRS84Quad (OGC 17-083r4, Annex D). The matrix
 * IDs are deliberately not zoom numbers.
 */
const REFERENCE_MATRICES: readonly ScenarioMatrix[] = [
  {
    id: 'coarse',
    scaleDenominator: 279541132.0143589,
    cellSize: 0.703125,
    origin: [-180, 90],
    tileSize: [256, 256],
    matrixSize: [2, 1]
  },
  {
    id: 'detail',
    scaleDenominator: 139770566.00717944,
    cellSize: 0.3515625,
    origin: [-180, 90],
    tileSize: [256, 256],
    matrixSize: [4, 2]
  }
];

/**
 * Independent oracle for the normalized geometry, from GDAL 3.10.2 (InspireCRS84Quad has the
 * same levels):
 *
 * ```sh
 * gdal_create -of GTiff -outsize 512 256 -bands 1 -a_srs EPSG:4326 -a_ullr -180 90 180 -90 src.tif
 * gdal_translate -of COG -co TILING_SCHEME=InspireCRS84Quad -co ZOOM_LEVEL=0 src.tif z0.tif
 * gdalinfo z0.tif  # Size is 512, 256; Origin = (-180, 90); Pixel Size = (0.703125, -0.703125)
 * gdal_translate -of COG -co TILING_SCHEME=InspireCRS84Quad -co ZOOM_LEVEL=1 src.tif z1.tif
 * gdalinfo z1.tif  # Size is 1024, 512; Origin = (-180, 90); Pixel Size = (0.3515625, -0.3515625)
 * ```
 *
 * Block=256x256 in both files, so the sizes give 2×1 and 4×2 matrices.
 */
const GDAL_REFERENCE = [
  {resolution: 0.703125, origin: [-180, 90], tileSize: [256, 256], matrixSize: [2, 1]},
  {resolution: 0.3515625, origin: [-180, 90], tileSize: [256, 256], matrixSize: [4, 2]}
];
const CRS84 = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';
const API_URL = 'https://example.com/ogcapi';
const WMTS_URL = 'https://example.com/wmts';
/** A valid 1×1 PNG, so that WMTS image decoding succeeds for an available tile. */
const PNG_BYTES = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  ),
  character => character.charCodeAt(0)
);

/** One level of a protocol-neutral test grid. */
type ScenarioMatrix = {
  /** Native matrix identifier. */
  id: string;
  /** OGC scale denominator. */
  scaleDenominator: number;
  /** Coordinate units per pixel; omitted to leave the resolution unknown. */
  cellSize?: number;
  /** Top-left origin in X/Y order. */
  origin: readonly [number, number];
  /** Tile width and height in pixels. */
  tileSize: readonly [number, number];
  /** Matrix width and height in tiles; omitted to leave the dimensions unknown. */
  matrixSize?: readonly [number, number];
};

/** Inclusive coverage of one matrix, as advertised. */
type ScenarioLimit = {
  /** Native matrix identifier. */
  tileMatrix: string;
  /** First covered column. */
  minTileColumn: number;
  /** Last covered column. */
  maxTileColumn: number;
  /** First covered row. */
  minTileRow: number;
  /** Last covered row. */
  maxTileRow: number;
};

/** A protocol-neutral grid that each adapter encodes in its own wire format. */
type Scenario = {
  /** CRS identifier of the matrix set. */
  crs: string;
  /** Advertised levels. */
  matrices: readonly ScenarioMatrix[];
  /** Advertised coverage; undefined means unrestricted. */
  limits?: readonly ScenarioLimit[];
};

/** The common contract that the conformance cases exercise. */
type AdapterSource = {
  /** Loads and returns the normalized grid. */
  getTileGrid(): Promise<TileGrid | undefined>;
  /** Requests one tile through the source's public tile API. */
  getTile(parameters: GetTileParameters): Promise<unknown>;
  /** Tile URLs that the source fetched. */
  tileRequests: string[];
};

/** One protocol under test. */
type Adapter = {
  /** Protocol name for test titles. */
  name: string;
  /** Builds a source that serves the scenario. */
  createSource(scenario: Scenario): AdapterSource;
};

const COVERAGE: readonly ScenarioLimit[] = [
  {tileMatrix: 'coarse', minTileColumn: 0, maxTileColumn: 1, minTileRow: 0, maxTileRow: 0},
  {tileMatrix: 'detail', minTileColumn: 2, maxTileColumn: 3, minTileRow: 1, maxTileRow: 1}
];
const REFERENCE: Scenario = {crs: CRS84, matrices: REFERENCE_MATRICES, limits: COVERAGE};

/** Encodes the scenario as WMTS 1.0 capabilities, loaded by URL like a live service. */
function createWMTSSource(scenario: Scenario): AdapterSource {
  const limits = scenario.limits
    ? `<TileMatrixSetLimits>${scenario.limits
        .map(
          limit =>
            `<TileMatrixLimits><TileMatrix>${limit.tileMatrix}</TileMatrix>` +
            `<MinTileRow>${limit.minTileRow}</MinTileRow><MaxTileRow>${limit.maxTileRow}</MaxTileRow>` +
            `<MinTileCol>${limit.minTileColumn}</MinTileCol><MaxTileCol>${limit.maxTileColumn}</MaxTileCol>` +
            '</TileMatrixLimits>'
        )
        .join('')}</TileMatrixSetLimits>`
    : '';
  const matrices = scenario.matrices
    .map(
      matrix =>
        `<TileMatrix><ows:Identifier>${matrix.id}</ows:Identifier>` +
        `<ScaleDenominator>${matrix.scaleDenominator}</ScaleDenominator>` +
        // CRS84 is longitude first on the wire, so the X/Y origin is written unchanged.
        `<TopLeftCorner>${matrix.origin[0]} ${matrix.origin[1]}</TopLeftCorner>` +
        `<TileWidth>${matrix.tileSize[0]}</TileWidth><TileHeight>${matrix.tileSize[1]}</TileHeight>` +
        (matrix.matrixSize
          ? `<MatrixWidth>${matrix.matrixSize[0]}</MatrixWidth><MatrixHeight>${matrix.matrixSize[1]}</MatrixHeight>`
          : '') +
        '</TileMatrix>'
    )
    .join('');
  const capabilities =
    '<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1"><Contents>' +
    '<Layer><ows:Identifier>layer</ows:Identifier>' +
    // Content extent smaller than the grid: it must never define matrix dimensions.
    '<ows:WGS84BoundingBox><ows:LowerCorner>0 0</ows:LowerCorner><ows:UpperCorner>90 45</ows:UpperCorner></ows:WGS84BoundingBox>' +
    '<Format>image/png</Format>' +
    `<TileMatrixSetLink><TileMatrixSet>grid</TileMatrixSet>${limits}</TileMatrixSetLink>` +
    `<ResourceURL format="image/png" resourceType="tile" template="${WMTS_URL}/tiles/{TileMatrix}/{TileRow}/{TileCol}.png"/>` +
    '</Layer>' +
    `<TileMatrixSet><ows:Identifier>grid</ows:Identifier><ows:SupportedCRS>${scenario.crs}</ows:SupportedCRS>${matrices}</TileMatrixSet>` +
    '</Contents></Capabilities>';
  const tileRequests: string[] = [];
  const source = createDataSourceSync(WMTS_URL, [WMTSLoader], {
    wmts: {capabilitiesUrl: `${WMTS_URL}/capabilities`}
  }) as WMTSImageTileSource;
  source.fetch = async url => {
    if (url === `${WMTS_URL}/capabilities`) return new Response(capabilities);
    if (url.startsWith(`${WMTS_URL}/tiles/`)) {
      tileRequests.push(url);
      return new Response(PNG_BYTES);
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  return {
    tileRequests,
    getTileGrid: async () => (await source.getMetadata()).tileGrid,
    getTile: parameters => source.getTile(parameters)
  };
}

/** Encodes the scenario as an OGC TileMatrixSet 2.0 JSON document. */
function createTileMatrixSetDocument(scenario: Scenario) {
  return {
    id: 'grid',
    crs: scenario.crs,
    tileMatrices: scenario.matrices.map(matrix => ({
      id: matrix.id,
      scaleDenominator: matrix.scaleDenominator,
      ...(matrix.cellSize !== undefined ? {cellSize: matrix.cellSize} : {}),
      cornerOfOrigin: 'topLeft',
      pointOfOrigin: [matrix.origin[0], matrix.origin[1]],
      tileWidth: matrix.tileSize[0],
      tileHeight: matrix.tileSize[1],
      ...(matrix.matrixSize
        ? {matrixWidth: matrix.matrixSize[0], matrixHeight: matrix.matrixSize[1]}
        : {})
    }))
  };
}

/** Encodes scenario limits with the OGC `TileCol` spelling. */
function createOGCLimits(scenario: Scenario) {
  return scenario.limits?.map(limit => ({
    tileMatrix: limit.tileMatrix,
    minTileCol: limit.minTileColumn,
    maxTileCol: limit.maxTileColumn,
    minTileRow: limit.minTileRow,
    maxTileRow: limit.maxTileRow
  }));
}

/**
 * Builds an OGC API Tiles source. `discover` follows the tileset's tiling-scheme link and its
 * advertised limits; otherwise the TileMatrixSet 2.0 document and limits are configured directly.
 */
function createOGCSource(scenario: Scenario, discover: boolean): AdapterSource {
  const tilesetUrl = `${API_URL}/collections/data/tiles/grid`;
  const matrixSetUrl = `${API_URL}/tileMatrixSets/grid`;
  const tileRequests: string[] = [];
  const source = OGCAPITilesLoader.createDataSourceSync(API_URL, {
    'ogc-api': {
      tileTemplate: `${tilesetUrl}/{tileMatrix}/{tileRow}/{tileCol}`,
      ...(discover
        ? {}
        : {tileMatrixSet: matrixSetUrl, tileMatrixSetLimits: createOGCLimits(scenario)})
    }
  });
  source.fetch = async url => {
    if (url === API_URL) return Response.json({title: 'Grid conformance'});
    if (url === matrixSetUrl) return Response.json(createTileMatrixSetDocument(scenario));
    if (url === tilesetUrl)
      return Response.json({
        // Content extent smaller than the grid: it must never define matrix dimensions.
        boundingBox: {lowerLeft: [0, 0], upperRight: [90, 45], crs: CRS84},
        tileMatrixSetLimits: createOGCLimits(scenario),
        links: [{rel: 'http://www.opengis.net/def/rel/ogc/1.0/tiling-scheme', href: matrixSetUrl}]
      });
    if (url.startsWith(`${tilesetUrl}/`)) {
      tileRequests.push(url);
      return new Response(new Uint8Array([1]));
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  return {
    tileRequests,
    getTileGrid: async () => (await source.getMetadata()).tileGrid,
    getTile: parameters => source.getTile(parameters)
  };
}

const ADAPTERS: Adapter[] = [
  {name: 'WMTS 1.0', createSource: createWMTSSource},
  {name: 'TMS 2.0 JSON', createSource: scenario => createOGCSource(scenario, false)},
  {name: 'OGC API - Tiles discovery', createSource: scenario => createOGCSource(scenario, true)}
];

/** Returns the reference scenario with the given changes. */
function withChanges(changes: Partial<Scenario>): Scenario {
  return {...REFERENCE, ...changes};
}

/** Ambiguous matrix identity or malformed coverage: metadata and requests both reject. */
const INVALID_SCENARIOS: {name: string; scenario: Scenario; error: RegExp}[] = [
  {
    name: 'duplicate matrix IDs',
    scenario: withChanges({
      matrices: [REFERENCE_MATRICES[0], {...REFERENCE_MATRICES[1], id: 'coarse'}],
      limits: undefined
    }),
    error: /unique/i
  },
  {
    name: 'limits for an unknown matrix',
    scenario: withChanges({limits: [{...COVERAGE[1], tileMatrix: 'missing'}]}),
    error: /unknown matrix/i
  },
  {
    name: 'duplicate limits',
    scenario: withChanges({limits: [COVERAGE[1], COVERAGE[1]]}),
    error: /limits.*unique/i
  },
  {
    name: 'reversed limits',
    scenario: withChanges({limits: [{...COVERAGE[1], minTileColumn: 3, maxTileColumn: 2}]}),
    error: /limits.*reversed/i
  },
  {
    name: 'negative limits',
    scenario: withChanges({limits: [{...COVERAGE[1], minTileRow: -1}]}),
    error: /limits.*nonnegative safe integers/i
  },
  {
    name: 'limits beyond the matrix',
    scenario: withChanges({limits: [{...COVERAGE[1], maxTileColumn: 4}]}),
    error: /exceed matrix dimensions/i
  }
];

describe.each(ADAPTERS)('$name grid conformance', adapter => {
  test('complete reference geometry, coverage and native requests', async () => {
    const source = adapter.createSource(REFERENCE);
    const tileGrid = await source.getTileGrid();
    expect(getTileGridValidation(tileGrid!)).toEqual({status: 'complete', issues: []});
    const matrices = tileGrid!.tileMatrixSet!.matrices;
    expect(matrices.map(matrix => matrix.id)).toEqual(['coarse', 'detail']);
    for (const [index, matrix] of matrices.entries()) {
      const reference = GDAL_REFERENCE[index];
      // WMTS derives the cell size from the scale denominator; TMS 2.0 states it.
      expect(matrix.resolution).toBeCloseTo(reference.resolution, 12);
      expect(matrix.origin).toEqual(reference.origin);
      expect(matrix.cornerOfOrigin).toBe('topLeft');
      expect(matrix.tileSize).toEqual(reference.tileSize);
      expect(matrix.matrixSize).toEqual(reference.matrixSize);
    }
    expect(tileGrid!.limits).toEqual(COVERAGE);

    expect(await source.getTile({x: 3, y: 1, z: 1, tileMatrix: 'detail'})).not.toBeNull();
    expect(source.tileRequests).toHaveLength(1);
    expect(source.tileRequests[0]).toMatch(/\/detail\/1\/3(\.png)?$/);
    // Sparse coverage, an index outside the matrix and a missing level are empty, not errors.
    for (const parameters of [
      {x: 1, y: 1, z: 1, tileMatrix: 'detail'},
      {x: 4, y: 1, z: 1, tileMatrix: 'detail'},
      {x: 0, y: 0, z: 2}
    ]) {
      expect(await source.getTile(parameters)).toBeNull();
    }
    expect(source.tileRequests).toHaveLength(1);
  });

  test('an unknown explicit matrix ID rejects; it is not an empty tile', async () => {
    const source = adapter.createSource(REFERENCE);
    await source.getTileGrid();
    await expect(source.getTile({x: 0, y: 0, z: 0, tileMatrix: 'missing'})).rejects.toThrow(
      RangeError
    );
    await expect(source.getTile({x: 0, y: 0, z: 0, tileMatrix: 'missing'})).rejects.toThrow(
      'Unknown tile matrix "missing"'
    );
    expect(source.tileRequests).toEqual([]);
  });

  test.each(INVALID_SCENARIOS)('rejects $name before any tile request', async testCase => {
    const source = adapter.createSource(testCase.scenario);
    await expect(source.getTileGrid()).rejects.toThrow(testCase.error);
    await expect(source.getTile({x: 2, y: 1, z: 1, tileMatrix: 'detail'})).rejects.toThrow(
      testCase.error
    );
    expect(source.tileRequests).toEqual([]);
  });

  test('malformed level geometry stays inspectable, is reported invalid and blocks requests', async () => {
    const source = adapter.createSource(
      withChanges({
        matrices: [REFERENCE_MATRICES[0], {...REFERENCE_MATRICES[1], tileSize: [0, 256]}]
      })
    );
    const tileGrid = await source.getTileGrid();
    expect(tileGrid!.tileMatrixSet).toBeUndefined();
    expect(tileGrid!.matrices![1].tileSize).toEqual([0, 256]);
    expect(getTileGridValidation(tileGrid!)).toEqual({
      status: 'invalid',
      issues: [
        {code: 'missing-geometry', message: 'Tile grid has no complete tile matrix set.'},
        {
          code: 'invalid-matrix',
          tileMatrix: 'detail',
          message: 'Matrix and tile dimensions require two positive safe integers.'
        }
      ]
    });
    // A valid level of the same set is not served from an invalid grid either.
    for (const parameters of [
      {x: 3, y: 1, z: 1, tileMatrix: 'detail'},
      {x: 0, y: 0, z: 0, tileMatrix: 'coarse'}
    ]) {
      await expect(source.getTile(parameters)).rejects.toThrow('positive safe integers');
    }
    expect(source.tileRequests).toEqual([]);
  });

  test('empty coverage is a valid grid with no available tiles', async () => {
    const source = adapter.createSource(withChanges({limits: []}));
    const tileGrid = await source.getTileGrid();
    expect(tileGrid!.limits).toEqual([]);
    expect(getTileGridValidation(tileGrid!).status).toBe('complete');
    expect(await source.getTile({x: 2, y: 1, z: 1, tileMatrix: 'detail'})).toBeNull();
    expect(source.tileRequests).toEqual([]);
  });

  test('an unknown CRS unit keeps partial metadata and reports the missing resolution', async () => {
    // UTM zone 31N: the unit is not built in and no metersPerUnit is configured.
    const matrices = REFERENCE_MATRICES.map(({cellSize, ...matrix}) => matrix);
    const source = adapter.createSource(withChanges({crs: 'EPSG:32631', matrices}));
    const tileGrid = await source.getTileGrid();
    expect(tileGrid!.tileMatrixSet).toBeUndefined();
    expect(tileGrid!.matrices!.map(matrix => [matrix.id, matrix.matrixSize])).toEqual([
      ['coarse', [2, 1]],
      ['detail', [4, 2]]
    ]);
    expect(tileGrid!.limits).toEqual(COVERAGE);
    const validation = getTileGridValidation(tileGrid!);
    expect(validation.status).toBe('partial');
    expect(validation.issues).toEqual([
      {code: 'missing-geometry', message: 'Tile grid has no complete tile matrix set.'},
      {
        code: 'missing-geometry',
        tileMatrix: 'coarse',
        message: 'Incomplete tile matrix geometry: missing resolution.'
      },
      {
        code: 'missing-geometry',
        tileMatrix: 'detail',
        message: 'Incomplete tile matrix geometry: missing resolution.'
      }
    ]);
    // Partial metadata still addresses native matrices and enforces coverage.
    expect(await source.getTile({x: 3, y: 1, z: 1, tileMatrix: 'detail'})).not.toBeNull();
    expect(await source.getTile({x: 1, y: 1, z: 1, tileMatrix: 'detail'})).toBeNull();
    expect(source.tileRequests).toHaveLength(1);
  });

  test('matrix dimensions are never inferred from the content extent', async () => {
    const matrices = REFERENCE_MATRICES.map(({matrixSize, ...matrix}) => matrix);
    const source = adapter.createSource(withChanges({matrices, limits: undefined}));
    const tileGrid = await source.getTileGrid();
    expect(tileGrid!.tileMatrixSet).toBeUndefined();
    expect(tileGrid!.matrixSizes).toBeUndefined();
    expect(tileGrid!.matrices!.every(matrix => matrix.matrixSize === undefined)).toBe(true);
    expect(getTileGridValidation(tileGrid!).issues.slice(1)).toEqual(
      ['coarse', 'detail'].map(tileMatrix => ({
        code: 'missing-geometry',
        tileMatrix,
        message: 'Incomplete tile matrix geometry: missing matrixSize.'
      }))
    );
  });
});
