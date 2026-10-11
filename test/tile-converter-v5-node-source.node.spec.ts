import {afterAll, beforeAll, beforeEach, expect, test, vi} from 'vitest';
import {mkdtemp, mkdir, writeFile, readFile, rm, symlink, open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync, spawnSync} from 'node:child_process';
import {Tiles3DArchiveWriter} from '@loaders.gl/3d-tiles';
import {
  createNodeTilesetConversionSource,
  NODE_TILESET_LIMITS
} from '../apps/tile-converter/src/v5/node-source';
import {runTileConverterCLI} from '../apps/tile-converter/src/v5/node-cli';

vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {...actual, open: vi.fn(actual.open)};
});
beforeEach(() => vi.clearAllMocks());

let directory: string;
let rootPath: string;
let archivePath: string;
const document = {asset: {version: '1.1'}, root: {content: {uri: 'meshes/triangle.glb'}}};
const rootBytes = new TextEncoder().encode(JSON.stringify(document));
const payload = new Uint8Array([103, 108, 84, 70, 2, 0, 0, 0]);
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tile-node-source-'));
  await mkdir(join(directory, 'dataset', 'meshes'), {recursive: true});
  rootPath = join(directory, 'dataset', 'tileset.json');
  archivePath = join(directory, 'dataset.3tz');
  await writeFile(rootPath, rootBytes);
  await writeFile(join(directory, 'dataset', 'meshes', 'triangle.glb'), payload);
  await writeFile(join(directory, 'outside.glb'), payload);
  await symlink(join(directory, 'outside.glb'), join(directory, 'dataset', 'linked.glb'));
  const archive = await Tiles3DArchiveWriter.encode!({
    'tileset.json': rootBytes.buffer,
    'meshes/triangle.glb': payload.buffer
  });
  await writeFile(archivePath, new Uint8Array(archive));
});
afterAll(async () => rm(directory, {recursive: true, force: true}));

test.each([
  'path',
  'file-url',
  '3tz'
] as const)('Node %s source inspects metadata and reads typed content', async format => {
  const fetcher = vi.fn<typeof fetch>();
  const source = await createNodeTilesetConversionSource({
    input:
      format === '3tz'
        ? archivePath
        : format === 'file-url'
          ? pathToFileURL(rootPath).href
          : rootPath,
    format: format === '3tz' ? '3tz' : '3d-tiles',
    fetcher
  });
  try {
    const inspection = await source.inspect();
    expect(inspection.resources).toHaveLength(1);
    expect(inspection.resources[0]).toMatchObject({
      resourceId: 'tile-root-content-0',
      uri: 'meshes/triangle.glb',
      tilePath: []
    });
    const resources = [];
    for await (const resource of source.read(inspection)) resources.push(resource);
    expect(resources).toHaveLength(1);
    expect(resources[0].data).toEqual(payload);
    expect(resources[0].data).toBeInstanceOf(Uint8Array);
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    await source.close();
  }
  await source.close();
  await expect(source.inspect()).rejects.toMatchObject({code: 'NODE_SOURCE_CLOSED'});
});

test('HTTP source retains root query credentials and bounds content responses', async () => {
  const fetcher = vi.fn<typeof fetch>(
    async input => new Response(String(input).includes('tileset.json') ? rootBytes : payload)
  );
  const source = await createNodeTilesetConversionSource({
    input: 'https://example.invalid/tileset.json?token=test',
    fetcher
  });
  try {
    const inspection = await source.inspect();
    for await (const resource of source.read(inspection)) expect(resource.data).toEqual(payload);
    expect(String(fetcher.mock.calls[1][0])).toBe(
      'https://example.invalid/meshes/triangle.glb?token=test'
    );
  } finally {
    await source.close();
  }
});

test('HTTP redirects preserve the final root directory and query credentials', async () => {
  const finalUrl = 'https://example.invalid/releases/42/tileset.json?token=redirect';
  const fetcher = vi.fn<typeof fetch>(async input => {
    const response = new Response(String(input).includes('tileset.json') ? rootBytes : payload);
    Object.defineProperty(response, 'url', {value: finalUrl});
    return response;
  });
  const source = await createNodeTilesetConversionSource({
    input: 'https://example.invalid/latest/tileset.json',
    fetcher
  });
  try {
    const inspection = await source.inspect();
    expect(inspection.rootUrl).toBe(finalUrl);
    for await (const resource of source.read(inspection)) expect(resource.data).toEqual(payload);
    expect(String(fetcher.mock.calls[1][0])).toBe(
      'https://example.invalid/releases/42/meshes/triangle.glb?token=redirect'
    );
  } finally {
    await source.close();
  }
});

test.each([
  '../outside.glb',
  'https://example.invalid/content.glb',
  '%2e%2e%2foutside.glb',
  '%5coutside.glb',
  '%2foutside.glb'
])('local inspection rejects %s without network fallback', async uri => {
  const path = join(directory, 'dataset', `escaping-${encodeURIComponent(uri)}.json`);
  await writeFile(path, JSON.stringify({...document, root: {content: {uri}}}));
  const fetcher = vi.fn<typeof fetch>();
  const source = await createNodeTilesetConversionSource({input: path, fetcher});
  try {
    await expect(source.inspect()).rejects.toMatchObject({code: 'EXTERNAL_RESOURCE_UNSUPPORTED'});
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    await source.close();
  }
});

test('local reads reject symlink escape and missing contents after metadata-only inspection', async () => {
  for (const uri of ['linked.glb', 'missing.glb']) {
    const path = join(directory, 'dataset', `${uri}.json`);
    await writeFile(path, JSON.stringify({...document, root: {content: {uri}}}));
    const source = await createNodeTilesetConversionSource({input: path});
    try {
      const inspection = await source.inspect();
      await expect(
        (async () => {
          for await (const resource of source.read(inspection)) void resource;
        })()
      ).rejects.toMatchObject({
        code: uri === 'linked.glb' ? 'EXTERNAL_RESOURCE_UNSUPPORTED' : 'ENOENT'
      });
    } finally {
      await source.close();
    }
  }
});

test('local reads enforce an aggregate byte budget before allocating payloads', async () => {
  const source = await createNodeTilesetConversionSource({
    input: rootPath,
    maxInputBytes: rootBytes.byteLength + payload.byteLength - 1
  });
  try {
    const inspection = await source.inspect();
    await expect(
      (async () => {
        for await (const resource of source.read(inspection)) void resource;
      })()
    ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
  } finally {
    await source.close();
  }
});

test('opening rejects oversize files, unsupported protocols and unbounded options', async () => {
  await expect(
    createNodeTilesetConversionSource({input: archivePath, format: '3tz', maxInputBytes: 1})
  ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
  await expect(
    createNodeTilesetConversionSource({input: 'https://example.invalid/a.3tz', format: '3tz'})
  ).rejects.toMatchObject({code: 'UNSUPPORTED_NODE_SOURCE'});
  await expect(
    createNodeTilesetConversionSource({input: 'ftp://example.invalid/input'})
  ).rejects.toMatchObject({code: 'UNSUPPORTED_NODE_SOURCE'});
  for (const maxInputBytes of [0, Infinity, NODE_TILESET_LIMITS.maxInputBytes + 1])
    await expect(
      createNodeTilesetConversionSource({input: rootPath, maxInputBytes})
    ).rejects.toMatchObject({code: 'INVALID_NODE_SOURCE_OPTIONS'});
});

test('cancellation prevents opening or further reads and callers release the source', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Canceled Node source'));
  await expect(
    createNodeTilesetConversionSource({
      input: archivePath,
      format: '3tz',
      signal: controller.signal
    })
  ).rejects.toThrow('Canceled Node source');
  const source = await createNodeTilesetConversionSource({input: archivePath, format: '3tz'});
  try {
    await expect(source.inspect(controller.signal)).rejects.toThrow('Canceled Node source');
  } finally {
    await source.close();
  }
});

test('CLI inspection returns JSON metadata without reading or modifying content', async () => {
  const outputs: string[] = [];
  const errors: string[] = [];
  const input = join(directory, 'dataset', 'metadata-only.json');
  await writeFile(input, JSON.stringify({...document, root: {content: {uri: 'absent.glb'}}}));
  expect(
    await runTileConverterCLI(['inspect', input], {
      stdout: text => outputs.push(text),
      stderr: text => errors.push(text)
    })
  ).toBe(0);
  expect(errors).toEqual([]);
  expect(JSON.parse(outputs.join(''))).toMatchObject({
    operation: 'inspect',
    inputFormat: '3d-tiles',
    resources: [{uri: 'absent.glb'}]
  });
  expect(await readFile(rootPath, 'utf8')).toBe(new TextDecoder().decode(rootBytes));
});

test.each([
  ['convert', 'input'],
  ['inspect'],
  ['inspect', 'input', '--unknown'],
  ['inspect', 'input', '--input-format', 'i3s'],
  ['inspect', 'input', '--max-input-bytes', '1.5'],
  ['inspect', 'input', '--max-resources', '0']
])('CLI rejects invalid arguments %j with JSON stderr', async argumentsList => {
  const stdout = vi.fn();
  const stderr = vi.fn();
  expect(await runTileConverterCLI(argumentsList, {stdout, stderr})).toBe(1);
  expect(stdout).not.toHaveBeenCalled();
  expect(JSON.parse(stderr.mock.calls[0][0]).message).toBeTypeOf('string');
});

test('installed Node entrypoint and binary inspect a hermetic archive', () => {
  const require = createRequire(import.meta.url);
  expect(require.resolve('@loaders.gl/tile-converter/v5/node')).toMatch(
    /dist[\\/]v5[\\/]node\.cjs$/
  );
  expect(
    require('@loaders.gl/tile-converter/v5/node').createNodeTilesetConversionSource
  ).toBeTypeOf('function');
  const output = execFileSync(
    process.execPath,
    ['apps/tile-converter/bin/converter-v5.js', 'inspect', archivePath, '--input-format', '3tz'],
    {encoding: 'utf8'}
  );
  expect(JSON.parse(output).resources).toHaveLength(1);
  const help = execFileSync(
    process.execPath,
    ['apps/tile-converter/bin/converter-v5.js', '--help'],
    {encoding: 'utf8'}
  );
  expect(help).toContain('metadata');
  const invalid = spawnSync(
    process.execPath,
    ['apps/tile-converter/bin/converter-v5.js', 'inspect', join(directory, 'absent.json')],
    {encoding: 'utf8'}
  );
  expect(invalid.status).toBe(1);
  expect(invalid.stdout).toBe('');
  expect(JSON.parse(invalid.stderr).code).toBe('ENOENT');
});

test('bad archive indexes and invalid JSON release every opened file handle', async () => {
  for (const format of ['3d-tiles', '3tz'] as const) {
    vi.mocked(open).mockClear();
    const path = join(directory, `invalid.${format === '3tz' ? '3tz' : 'json'}`);
    await writeFile(path, '{}');
    let source: Awaited<ReturnType<typeof createNodeTilesetConversionSource>> | undefined;
    try {
      await expect(
        (async () => {
          source = await createNodeTilesetConversionSource({input: path, format});
          await source.inspect();
        })()
      ).rejects.toThrow();
    } finally {
      await source?.close();
    }
    expect(vi.mocked(open).mock.results.length).toBeGreaterThan(0);
    for (const result of vi.mocked(open).mock.results) {
      const handle = await result.value;
      await expect(handle.read(new Uint8Array(1), 0, 1, 0)).rejects.toMatchObject({code: 'EBADF'});
    }
  }
});

test('CLI does not publish success when archive cleanup fails', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  const handle = await actual.open(archivePath, 'r');
  const closeFile = handle.close.bind(handle);
  vi.spyOn(handle, 'close').mockImplementationOnce(async () => {
    await closeFile();
    throw new Error('Failed archive cleanup');
  });
  vi.mocked(open).mockResolvedValueOnce(handle);
  const stdout = vi.fn();
  const stderr = vi.fn();
  expect(
    await runTileConverterCLI(['inspect', archivePath, '--input-format', '3tz'], {stdout, stderr})
  ).toBe(1);
  expect(stdout).not.toHaveBeenCalled();
  expect(JSON.parse(stderr.mock.calls[0][0]).message).toBe('Failed archive cleanup');
});
