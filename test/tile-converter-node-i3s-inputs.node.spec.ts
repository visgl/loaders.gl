// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {preloadI3SMeshCompression} from '@loaders.gl/tiles-3d/i3s';
import {beforeAll as preloadBeforeAll} from 'vitest';
import {afterAll, beforeAll, expect, test, vi} from 'vitest';
import {mkdtemp, writeFile, rm, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {encodeI3SMeshLayer, SLPKWriter, parseSLPKArchive} from '@loaders.gl/tiles-3d/i3s';
import {GZipDecompressor} from '@loaders.gl/compression';
import {BlobFile} from '@loaders.gl/loader-utils';
import {createNodeI3SConversionSource} from '../apps/tile-converter/src/v5/node-i3s-source';
import {createNodeTilesetConversionSource} from '../apps/tile-converter/src/v5/node-source';
import {convertNodeTileset} from '../apps/tile-converter/src/v5/node-conversion';
import {runTileConverterCLI} from '../apps/tile-converter/src/v5/node-cli';
import {createTiles3DConversionArchive} from './utils/tile-browser-archive-conversion';

let directory: string;
let inputPath: string;
let archiveBytes: Uint8Array;
preloadBeforeAll(preloadI3SMeshCompression);

const resources: Record<string, ArrayBuffer> = {};
const i3sFeatures = {
  schema: {fields: [{name: 'feature_id', type: 'int32' as const, nullable: false}]},
  metadataClass: 'mesh',
  objectIdProperty: 'OBJECTID',
  sourceFeatureIdProperty: 'OBJECTID',
  maxAttributeBytes: 1024
};
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tile-i3s-node-'));
  inputPath = join(directory, 'input.slpk');
  const png = Uint8Array.from(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII='
    ),
    character => character.charCodeAt(0)
  );
  const layer = encodeI3SMeshLayer(
    {
      mode: 4,
      topology: 'triangle-list',
      attributes: {
        POSITION: {value: new Float64Array([6378137, 0, 0, 6378137, 1, 0, 6378137, 0, 1]), size: 3},
        TEXCOORD_0: {value: new Float32Array([0, 0, 1, 0, 0, 1]), size: 2}
      }
    },
    {
      maxPositionError: 0.01,
      maxResourceBytes: 8192,
      material: {baseColorTexture: {data: png, mimeType: 'image/png'}}
    }
  );
  const decompressor = new GZipDecompressor();
  for (const [path, bytes] of Object.entries(layer.files))
    resources[path.replace(/\.gz$/, '')] = path.endsWith('.gz')
      ? await decompressor.decompress(bytes)
      : bytes;
  archiveBytes = new Uint8Array(
    await SLPKWriter.encode!(layer.files, {slpk: {maxArchiveBytes: 32768}})
  );
  await writeFile(inputPath, archiveBytes);
});
afterAll(async () => rm(directory, {recursive: true, force: true}));

/** Supplies exact hermetic I3S resources and records inherited authentication parameters. */
function createLayerFetcher(integratedMesh = false) {
  return vi.fn<typeof fetch>(async input => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.searchParams.get('token')).toBe('fixture-token');
    const path = url.pathname.replace(/^\/layers\/0\/?/, '');
    const resource =
      path === ''
        ? '3dSceneLayer.json'
        : path.startsWith('nodepages/')
          ? `${path}.json`
          : /^nodes\/[^/]+$/.test(path)
            ? `${path}/3dNodeIndexDocument.json`
            : path.includes('/textures/')
              ? `${path}.png`
              : `${path}.bin`;
    if (!resources[resource]) throw Error('Unexpected fixture request: ' + url.href);
    if (integratedMesh && resource === '3dSceneLayer.json') {
      const layer = JSON.parse(new TextDecoder().decode(resources[resource]));
      layer.layerType = 'IntegratedMesh';
      return new Response(JSON.stringify(layer));
    }
    return new Response(resources[resource]);
  });
}

/** Implements small validator-bearing range responses without a server or public network. */
function createRangeFetcher(bytes: Uint8Array, changeIdentity = false) {
  let requestCount = 0;
  return vi.fn<typeof fetch>(async (_input, options) => {
    options?.signal?.throwIfAborted();
    const range = /^bytes=(\d+)-(\d+)$/.exec(new Headers(options?.headers).get('range') ?? '');
    if (!range) throw Error('Expected bounded byte range');
    const start = Number(range[1]);
    const end = Number(range[2]);
    return new Response(bytes.slice(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
        ETag: changeIdentity && requestCount++ > 0 ? '"replaced"' : '"fixture"'
      }
    });
  });
}

test.each([
  'i3s',
  'slpk'
] as const)('Node %s inspection is metadata-only and rejects reads after close', async format => {
  const fetcher = createLayerFetcher();
  const source = await createNodeI3SConversionSource({
    input: format === 'slpk' ? inputPath : 'https://example.invalid/layers/0?token=fixture-token',
    format,
    fetcher
  });
  const inspection = await source.inspect();
  expect(inspection.resources.map(resource => resource.resourceId)).toEqual(['1']);
  expect(inspection.metadataBytes).toBeGreaterThan(0);
  expect(fetcher.mock.calls.every(([input]) => !String(input).includes('/geometries/'))).toBe(true);
  await source.close();
  await source.close();
  await expect(source.inspect()).rejects.toMatchObject({code: 'NODE_SOURCE_CLOSED'});
});

test.each([
  '3d-tiles',
  '3tz',
  'slpk'
] as const)('Node SLPK converts to %s with explicit metric error', async outputFormat => {
  const output = join(directory, `converted-${outputFormat}`);
  const report = await convertNodeTileset({
    input: inputPath,
    format: 'slpk',
    resourceIds: ['1'],
    outputFormat,
    output,
    geometricError: 2,
    i3sFeatures
  });
  expect(report).toMatchObject({state: 'completed', inputResources: 1, outputResources: 1});
  if (outputFormat === '3d-tiles') {
    const document = JSON.parse(await readFile(join(output, 'tileset.json'), 'utf8'));
    expect(document.root.children[0].geometricError).toBeCloseTo(2.01);
  } else if (outputFormat === 'slpk') {
    const archive = await parseSLPKArchive(
      new BlobFile(new Blob([new Uint8Array(await readFile(output))]))
    );
    try {
      expect(
        JSON.parse(new TextDecoder().decode(await archive.getFile('', 'http'))).layerType
      ).toBe('3DObject');
    } finally {
      await archive.close();
    }
  }
});

test('I3S URL converts using bundled Node Draco transport and inherited query credentials', async () => {
  const report = await convertNodeTileset({
    input: 'https://example.invalid/layers/0?token=fixture-token',
    format: 'i3s',
    resourceIds: ['1'],
    outputFormat: 'slpk',
    fetcher: createLayerFetcher(),
    i3sFeatures
  });
  expect(report.state).toBe('completed');
});

test.each([
  'slpk',
  '3tz'
] as const)('Node remote %s uses indexed HTTP ranges and converts selected meshes', async format => {
  const bytes =
    format === 'slpk'
      ? archiveBytes
      : new Uint8Array(await (await createTiles3DConversionArchive()).arrayBuffer());
  const fetcher = createRangeFetcher(bytes);
  const report = await convertNodeTileset({
    input: 'https://example.invalid/archive?token=fixture',
    format,
    resourceIds: [format === 'slpk' ? '1' : 'tile-root-content-0'],
    outputFormat: 'slpk',
    fetcher,
    ...(format === 'slpk' ? {i3sFeatures} : {})
  });
  expect(report.state).toBe('completed');
  expect(fetcher.mock.calls.length).toBeGreaterThan(1);
});

test('remote archive replacement is rejected during indexed initialization', async () => {
  await expect(
    createNodeI3SConversionSource({
      input: 'https://example.invalid/archive',
      format: 'slpk',
      fetcher: createRangeFetcher(archiveBytes, true)
    })
  ).rejects.toThrow(/changed|identity|validator/i);
});

test('remote archives reject full-file responses and source creation respects cancellation', async () => {
  await expect(
    createNodeTilesetConversionSource({
      input: 'https://example.invalid/archive',
      format: '3tz',
      fetcher: async () => new Response(archiveBytes)
    })
  ).rejects.toThrow(/206/);
  const controller = new AbortController();
  controller.abort(new Error('stop'));
  await expect(
    createNodeI3SConversionSource({input: inputPath, format: 'slpk', signal: controller.signal})
  ).rejects.toThrow('stop');
});

test.each([
  {maxInputBytes: 1},
  {maxInputResources: 1}
])('I3S metadata enforces lowered %j limits', async limits => {
  const source = await createNodeI3SConversionSource({
    input: inputPath,
    format: 'slpk',
    ...limits
  }).catch(error => error);
  if (source instanceof Error) expect(source.message).toMatch(/budget|16 MiB|limit/i);
  else {
    try {
      await expect(source.inspect()).rejects.toThrow(/limit|budget/i);
    } finally {
      await source.close();
    }
  }
});

test('I3S-to-3D-Tiles rejects missing metric error before opening input', async () => {
  await expect(
    convertNodeTileset({
      input: 'missing.slpk',
      format: 'slpk',
      resourceIds: ['1'],
      outputFormat: '3tz'
    })
  ).rejects.toMatchObject({code: 'MESH_GEOMETRIC_ERROR_INVALID'});
});

test('installed CLI inspects SLPK and explicitly rejects unmapped feature-bearing conversion', () => {
  const executable = join(process.cwd(), 'apps/tile-converter/bin/converter-v5.js');
  const inspect = JSON.parse(
    execFileSync(process.execPath, [executable, 'inspect', inputPath, '--input-format', 'slpk'], {
      encoding: 'utf8'
    })
  );
  expect(inspect.resources[0].resourceId).toBe('1');
  const validated = spawnSync(
    process.execPath,
    [
      executable,
      'validate',
      inputPath,
      '--input-format',
      'slpk',
      '--resource',
      '1',
      '--geometric-error',
      '2'
    ],
    {encoding: 'utf8'}
  );
  expect(validated.status).toBe(1);
  expect(JSON.parse(validated.stderr.trim().split('\n').at(-1)!).code).toBe(
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  );
});

test.each([
  '-1',
  'NaN',
  'Infinity',
  ''
])('CLI rejects invalid explicit metric error %s', async value => {
  const stderr: string[] = [];
  expect(
    await runTileConverterCLI(
      [
        'validate',
        inputPath,
        '--input-format',
        'slpk',
        '--resource',
        '1',
        `--geometric-error=${value}`
      ],
      {stdout: () => {}, stderr: text => stderr.push(text)}
    )
  ).toBe(1);
  expect(JSON.parse(stderr[0]).code).toBe('CLI_USAGE_ERROR');
});

test('IntegratedMesh to SLPK requires an explicit layer-type policy and reports the change', async () => {
  const options = {
    input: 'https://example.invalid/layers/0?token=fixture-token',
    format: 'i3s' as const,
    resourceIds: ['1'],
    outputFormat: 'slpk' as const,
    i3sFeatures
  };
  await expect(
    convertNodeTileset({...options, fetcher: createLayerFetcher(true)})
  ).rejects.toMatchObject({code: 'I3S_LAYER_TYPE_CHANGE_REQUIRED'});
  const report = await convertNodeTileset({
    ...options,
    fetcher: createLayerFetcher(true),
    integratedMeshPolicy: 'as-3d-object'
  });
  expect(report.diagnostics.some(diagnostic => diagnostic.code === 'I3S_LAYER_TYPE_CHANGED')).toBe(
    true
  );
});

test('per-call inspection cancellation reaches pending I3S metadata transport', async () => {
  let notifyStarted!: () => void;
  const started = new Promise<void>(resolve => {
    notifyStarted = resolve;
  });
  const fetcher: typeof fetch = async (_input, options) =>
    new Promise((_resolve, reject) => {
      options!.signal!.addEventListener('abort', () => reject(options!.signal!.reason), {
        once: true
      });
      notifyStarted();
    });
  const source = await createNodeI3SConversionSource({
    input: 'https://example.invalid/layers/0',
    format: 'i3s',
    fetcher
  });
  const controller = new AbortController();
  const inspection = source.inspect(controller.signal);
  const rejected = expect(inspection).rejects.toThrow('Canceled metadata inspection');
  try {
    await started;
    controller.abort(new Error('Canceled metadata inspection'));
    await rejected;
  } finally {
    await source.close();
  }
});

test('I3S runtime does not propagate layer query credentials outside its layer path', async () => {
  const layerFetcher = createLayerFetcher();
  const fetcher: typeof fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === '/external/object-id') {
      expect(url.searchParams.has('token')).toBe(false);
      return new Response(resources['nodes/1/attributes/f_0/0.bin']);
    }
    const response = await layerFetcher(input, options);
    if (url.pathname === '/layers/0') {
      const layer = await response.json();
      delete layer.nodePages;
      return new Response(JSON.stringify(layer));
    }
    if (url.pathname === '/layers/0/nodes/1') {
      const header = await response.json();
      delete header.textureData;
      header.attributeData[0].href = './../../../../external/object-id';
      return new Response(JSON.stringify(header));
    }
    return response;
  };
  const report = await convertNodeTileset({
    input: 'https://example.invalid/layers/0?token=fixture-token',
    format: 'i3s',
    resourceIds: ['1'],
    outputFormat: 'slpk',
    i3sFeatures,
    fetcher
  });
  expect(report.state).toBe('completed');
});

test('CLI validates feature-bearing SLPK with format-specific schema controls', async () => {
  const mapping = join(directory, 'i3s-feature-schema.json');
  await writeFile(mapping, JSON.stringify(i3sFeatures));
  const stdout: string[] = [];
  const stderr: string[] = [];
  const argumentsList = [
    'validate',
    inputPath,
    '--input-format',
    'slpk',
    '--resource',
    '1',
    '--geometric-error',
    '2',
    '--feature-schema',
    mapping
  ];
  expect(
    await runTileConverterCLI(argumentsList, {
      stdout: text => stdout.push(text),
      stderr: text => stderr.push(text)
    })
  ).toBe(0);
  expect(stderr).toEqual([]);
  expect(JSON.parse(stdout[0]).report).toMatchObject({
    state: 'completed',
    inputResources: 1,
    outputResources: 1
  });
});
