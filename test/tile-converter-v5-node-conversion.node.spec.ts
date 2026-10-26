// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterAll, beforeAll, expect, test} from 'vitest';
import {mkdtemp, mkdir, writeFile, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {parse} from '@loaders.gl/core';
import {
  encodeMeshTile,
  convertFeatureAttributesToArrowBatches
} from '@loaders.gl/tile-converter/v5/adapters';
import {GLTFLoader, GLTFScenegraph, GLTFWriter} from '@loaders.gl/scene/gltf';
import {BlobFile} from '@loaders.gl/core/loader-utils';
import {parse3DTilesArchive, Tiles3DArchiveWriter} from '@loaders.gl/tiles-3d/3d-tiles';
import {parseSLPKArchive} from '@loaders.gl/tiles-3d/i3s';
import {
  convertNodeTileset,
  writeNodeTileConversionOutput
} from '../apps/tile-converter/src/v5/node-conversion';
import {runTileConverterCLI} from '../apps/tile-converter/src/v5/node-cli';

let directory: string;
let rootPath: string;
let archivePath: string;
let externalArchivePath: string;
const identifier = 'tile-root-content-0/tile-root-content-0';
const root = {
  asset: {version: '1.1'},
  root: {
    geometricError: 4,
    boundingVolume: {region: [-0.001, -0.001, 0.001, 0.001, 0, 200]},
    transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 6378137, 0, 0, 1],
    content: {uri: 'nested/tileset.json'}
  }
};
const nested = {
  asset: {version: '1.1', gltfUpAxis: 'Z'},
  root: {geometricError: 0, boundingVolume: {sphere: [0, 0, 0, 10]}, content: {uri: 'triangle.glb'}}
};
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tile-node-conversion-'));
  rootPath = join(directory, 'input', 'tileset.json');
  archivePath = join(directory, 'input.3tz');
  await mkdir(join(directory, 'input', 'nested'), {recursive: true});
  const scene = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const mesh = scene.addMesh({
    attributes: {POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}},
    indices: new Uint16Array([0, 1, 2])
  });
  scene.setDefaultScene(scene.addScene({nodeIndices: [scene.addNode({meshIndex: mesh})]}));
  scene.createBinaryChunk();
  const triangle = GLTFWriter.encodeSync!(scene.gltf);
  const files = {
    'tileset.json': new TextEncoder().encode(JSON.stringify(root)).buffer,
    'nested/tileset.json': new TextEncoder().encode(JSON.stringify(nested)).buffer,
    'nested/triangle.glb': triangle
  };
  const hierarchy = {
    asset: {version: '1.1', gltfUpAxis: 'Z'},
    extensions: {
      EXT_geospatial_crs: {
        format: 'wkid',
        extensions: {EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 4978}}
      }
    },
    geometricError: 4,
    root: {
      geometricError: 4,
      refine: 'REPLACE',
      boundingVolume: {sphere: [0, 0, 0, 10]},
      transform: root.root.transform,
      content: {uri: 'nested/triangle.glb'},
      children: [
        {
          geometricError: 0,
          boundingVolume: {sphere: [0, 0, 0, 1]},
          content: {uri: 'nested/triangle.glb'}
        }
      ]
    }
  };
  await writeFile(join(directory, 'input', 'hierarchy.json'), JSON.stringify(hierarchy));
  for (const [path, bytes] of Object.entries(files))
    await writeFile(join(directory, 'input', path), new Uint8Array(bytes));
  await writeFile(archivePath, new Uint8Array(await Tiles3DArchiveWriter.encode!(files)));
  const external = {
    ...root,
    root: {...root.root, refine: 'REPLACE', content: {uri: 'nested/hierarchy.json'}}
  };
  const nestedHierarchy = {...nested, root: {...nested.root, refine: 'ADD'}};
  await writeFile(join(directory, 'input', 'external-hierarchy.json'), JSON.stringify(external));
  await writeFile(
    join(directory, 'input', 'nested', 'hierarchy.json'),
    JSON.stringify(nestedHierarchy)
  );
  externalArchivePath = join(directory, 'external-input.3tz');
  await writeFile(
    externalArchivePath,
    new Uint8Array(
      await Tiles3DArchiveWriter.encode!({
        'tileset.json': new TextEncoder().encode(JSON.stringify(external)).buffer,
        'nested/hierarchy.json': new TextEncoder().encode(JSON.stringify(nestedHierarchy)).buffer,
        'nested/triangle.glb': triangle
      })
    )
  );
});
afterAll(async () => rm(directory, {recursive: true, force: true}));

test.each([
  '3d-tiles',
  '3tz',
  'slpk'
] as const)('Node conversion writes bounded %s output through the shared mesh profile', async outputFormat => {
  const output = join(directory, `converted-${outputFormat}`);
  const report = await convertNodeTileset({
    input: outputFormat === '3tz' ? archivePath : rootPath,
    format: outputFormat === '3tz' ? '3tz' : '3d-tiles',
    resourceIds: [identifier],
    outputFormat,
    profile: outputFormat === '3tz',
    output
  });
  expect(report.state).toBe('completed');
  expect(report.outputResources).toBe(1);
  if (outputFormat === '3tz') {
    expect(report.timings!.setupMilliseconds).toBeGreaterThanOrEqual(0);
    expect(report.timings!.outputMilliseconds).toBeGreaterThanOrEqual(0);
    expect(report.timings!.totalMilliseconds).toBeGreaterThanOrEqual(
      report.timings!.setupMilliseconds! + report.timings!.outputMilliseconds!
    );
  } else expect(report.timings).toBeUndefined();
  if (outputFormat === '3d-tiles') {
    const tileset = JSON.parse(await readFile(join(output, 'tileset.json'), 'utf8'));
    expect(tileset.root.children[0].content.uri).toBe('meshes/0.glb');
    expect(tileset.root.children[0].geometricError).toBeCloseTo(4.01);
    const bytes = await readFile(join(output, 'meshes/0.glb'));
    expect(new TextDecoder().decode(bytes.subarray(0, 4))).toBe('glTF');
  } else {
    const file = new BlobFile(new Blob([new Uint8Array(await readFile(output))]));
    const archive =
      outputFormat === '3tz' ? await parse3DTilesArchive(file) : await parseSLPKArchive(file);
    try {
      const metadata = await archive.getFile(
        outputFormat === '3tz' ? 'tileset.json' : '3dSceneLayer.json'
      );
      expect(JSON.parse(new TextDecoder().decode(metadata))).toBeTypeOf('object');
    } finally {
      await archive.close();
    }
  }
});

test('CLI inspect exposes nested selections and validate qualifies an archive without writing', async () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  expect(
    await runTileConverterCLI(['inspect', rootPath], {
      stdout: text => stdout.push(text),
      stderr: text => stderr.push(text)
    })
  ).toBe(0);
  expect(JSON.parse(stdout.pop()!).resources[0].resourceId).toBe(identifier);
  const before = await readdir(directory);
  expect(
    await runTileConverterCLI(
      [
        'validate',
        archivePath,
        '--input-format',
        '3tz',
        '--resource',
        identifier,
        '--output-format',
        'slpk',
        '--profile'
      ],
      {stdout: text => stdout.push(text), stderr: text => stderr.push(text)}
    )
  ).toBe(0);
  expect(stderr).toEqual([]);
  expect(JSON.parse(stdout.pop()!)).toMatchObject({
    operation: 'validate',
    report: {
      state: 'completed',
      outputResources: 1,
      timings: {totalMilliseconds: expect.any(Number), outputMilliseconds: expect.any(Number)}
    }
  });
  expect(await readdir(directory)).toEqual(before);
});

test('installed CLI converts and installed ESM/CJS Node entrypoints expose the API', async () => {
  const output = join(directory, 'installed.3tz');
  const result = execFileSync(
    process.execPath,
    [
      'apps/tile-converter/bin/converter-v5.js',
      'convert',
      rootPath,
      '--resource',
      identifier,
      '--output',
      output
    ],
    {encoding: 'utf8'}
  );
  expect(JSON.parse(result)).toMatchObject({
    operation: 'convert',
    output,
    report: {outputResources: 1}
  });
  const entrypoints = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    const esm = await import('@loaders.gl/tile-converter/v5/node');
    assert.equal(typeof esm.convertNodeTileset, 'function');
    assert.equal(typeof require('@loaders.gl/tile-converter/v5/node').convertNodeTileset, 'function');
    console.log('Node entrypoints ready');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(entrypoints.trim()).toBe('Node entrypoints ready');
});

test('writer confines paths and preserves preexisting destinations', async () => {
  const signal = new AbortController().signal;
  const files = [{resourceId: 'tileset.json', blob: new Blob(['{}'])}];
  const output = join(directory, 'existing-output');
  await mkdir(output);
  await writeFile(join(output, 'sentinel'), 'preserved');
  await expect(
    writeNodeTileConversionOutput(files, output, '3d-tiles', 4096, signal)
  ).rejects.toMatchObject({code: 'EEXIST'});
  expect(await readFile(join(output, 'sentinel'), 'utf8')).toBe('preserved');
  const archive = join(directory, 'existing.3tz');
  await writeFile(archive, 'preserved');
  await expect(
    writeNodeTileConversionOutput(files, archive, '3tz', 4096, signal)
  ).rejects.toMatchObject({code: 'EEXIST'});
  expect(await readFile(archive, 'utf8')).toBe('preserved');
  for (const resourceId of [
    '../escape',
    '/absolute',
    'a/../escape',
    'a\\escape',
    'C:escape',
    'a//escape'
  ])
    await expect(
      writeNodeTileConversionOutput(
        [{resourceId, blob: new Blob(['a'])}],
        join(directory, 'invalid'),
        '3d-tiles',
        4096,
        signal
      )
    ).rejects.toMatchObject({code: 'INVALID_NODE_OUTPUT'});
  await expect(
    writeNodeTileConversionOutput(
      [...files, ...files],
      join(directory, 'duplicate'),
      '3d-tiles',
      4096,
      signal
    )
  ).rejects.toMatchObject({code: 'INVALID_NODE_OUTPUT'});
});

test('output limits, packaging failures and cancellation discard partial destinations', async () => {
  const files = [{resourceId: 'tileset.json', blob: new Blob(['{}'])}];
  const before = await readdir(directory);
  const signal = new AbortController().signal;
  await expect(
    writeNodeTileConversionOutput(files, join(directory, 'too-small.3tz'), '3tz', 2, signal)
  ).rejects.toThrow();
  await expect(
    writeNodeTileConversionOutput(files, join(directory, 'too-small'), '3d-tiles', 1, signal)
  ).rejects.toMatchObject({code: 'OUTPUT_BYTES_LIMIT_EXCEEDED'});
  const controller = new AbortController();
  controller.abort(new Error('Canceled output'));
  await expect(
    writeNodeTileConversionOutput(
      files,
      join(directory, 'canceled'),
      '3d-tiles',
      4096,
      controller.signal
    )
  ).rejects.toThrow('Canceled output');
  const conflicting = [
    {resourceId: 'a', blob: new Blob(['first'])},
    {resourceId: 'a/child', blob: new Blob(['second'])}
  ];
  await expect(
    writeNodeTileConversionOutput(
      conflicting,
      join(directory, 'failed-directory'),
      '3d-tiles',
      4096,
      signal
    )
  ).rejects.toThrow();
  expect(await readdir(directory)).toEqual(before);
});

test.each(
  [
    ['convert', 'input', '--resource', 'id'],
    ['validate', 'input', '--resource', 'id', '--output', 'destination'],
    ['validate', 'input', '--resource', 'id', '--output-format', 'copc'],
    ['inspect', 'input', '--output', 'destination'],
    ['inspect', 'input', '--resource', 'id'],
    ['inspect', 'input', '--max-documents', '0']
  ].map(argumentsList => [argumentsList])
)('CLI rejects invalid conversion arguments %j', async argumentsList => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  expect(
    await runTileConverterCLI(argumentsList, {
      stdout: text => stdout.push(text),
      stderr: text => stderr.push(text)
    })
  ).toBe(1);
  expect(stdout).toEqual([]);
  expect(JSON.parse(stderr[0]).code).toBe('CLI_USAGE_ERROR');
});

test('conversion rejects missing selections, invalid budgets and failed inputs without output', async () => {
  const before = await readdir(directory);
  const output = join(directory, 'failed-conversion.3tz');
  for (const options of [
    {resourceIds: []},
    {resourceIds: ['missing']},
    {maxOutputBytes: 0},
    {maxInputBytes: 1},
    {maxTilesetDocuments: 1}
  ])
    await expect(
      convertNodeTileset({
        input: rootPath,
        resourceIds: [identifier],
        outputFormat: '3tz',
        output,
        ...options
      })
    ).rejects.toThrow();
  expect(await readdir(directory)).toEqual(before);
});

test.each([
  '3d-tiles',
  '3tz'
] as const)('Node hierarchy profile preserves parent and child LOD in %s output', async outputFormat => {
  const output = join(directory, 'hierarchy-' + outputFormat);
  const report = await convertNodeTileset({
    input: join(directory, 'input', 'hierarchy.json'),
    resourceIds: ['tile-root-content-0', 'tile-0-content-0'],
    preserveHierarchy: true,
    outputFormat,
    output
  });
  expect(report.outputResources).toBe(2);
  let bytes: Uint8Array;
  if (outputFormat === '3d-tiles')
    bytes = new Uint8Array(await readFile(join(output, 'tileset.json')));
  else {
    const archive = await parse3DTilesArchive(
      new BlobFile(new Blob([new Uint8Array(await readFile(output))]))
    );
    try {
      bytes = new Uint8Array(await archive.getFile('tileset.json'));
    } finally {
      await archive.close();
    }
  }
  const tileset = JSON.parse(new TextDecoder().decode(bytes));
  expect(tileset.root.content.uri).toBe('meshes/0.glb');
  expect(tileset.root.refine).toBe('REPLACE');
  expect(tileset.root.children[0].refine).toBe('REPLACE');
  expect(tileset.root.children[0].geometricError).toBeCloseTo(0.01);
});

test('CLI exposes opt-in hierarchy validation and rejects unsupported output and partial selections', async () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const options = {
    stdout: (text: string) => stdout.push(text),
    stderr: (text: string) => stderr.push(text)
  };
  const argumentsList = [
    'validate',
    join(directory, 'input', 'hierarchy.json'),
    '--preserve-hierarchy',
    '--resource',
    'tile-root-content-0',
    '--resource',
    'tile-0-content-0'
  ];
  expect(await runTileConverterCLI(argumentsList, options)).toBe(0);
  expect(JSON.parse(stdout.pop()!).report.outputResources).toBe(2);
  expect(await runTileConverterCLI([...argumentsList, '--output-format', 'slpk'], options)).toBe(1);
  expect(JSON.parse(stderr.pop()!).code).toBe('MESH_HIERARCHY_UNSUPPORTED');
  expect(await runTileConverterCLI(argumentsList.slice(0, -2), options)).toBe(1);
  expect(JSON.parse(stderr.pop()!).code).toBe('MESH_HIERARCHY_UNSUPPORTED');
});

test.each([
  '3d-tiles',
  '3tz'
] as const)('Node external hierarchy conversion retains the reference wrapper in %s output', async outputFormat => {
  const output = join(directory, 'external-output-' + outputFormat);
  const report = await convertNodeTileset({
    input:
      outputFormat === '3tz'
        ? externalArchivePath
        : join(directory, 'input', 'external-hierarchy.json'),
    format: outputFormat === '3tz' ? '3tz' : '3d-tiles',
    resourceIds: [identifier],
    preserveHierarchy: true,
    outputFormat,
    output
  });
  expect(report.outputResources).toBe(1);
  let bytes: Uint8Array;
  if (outputFormat === '3d-tiles')
    bytes = new Uint8Array(await readFile(join(output, 'tileset.json')));
  else {
    const archive = await parse3DTilesArchive(
      new BlobFile(new Blob([new Uint8Array(await readFile(output))]))
    );
    try {
      bytes = new Uint8Array(await archive.getFile('tileset.json'));
    } finally {
      await archive.close();
    }
  }
  const tileset = JSON.parse(new TextDecoder().decode(bytes));
  expect(tileset.root.content).toBeUndefined();
  expect(tileset.root.refine).toBe('REPLACE');
  expect(tileset.root.children[0].refine).toBe('ADD');
  expect(tileset.root.children[0].content.uri).toBe('meshes/1.glb');
  expect(tileset.root.geometricError).toBeCloseTo(4.01);
  expect(tileset.root.children[0].geometricError).toBeCloseTo(0.01);
});

test('CLI feature schema preserves exact identifiers and nullable strings through GLB output', async () => {
  const schema = {
    fields: [
      {name: 'feature_id', type: 'uint64' as const, nullable: false},
      {name: 'label', type: 'utf8' as const, nullable: true}
    ]
  };
  const features = {
    featureIdField: 'feature_id',
    triangleFeatureIndices: new Uint32Array([0]),
    batches: convertFeatureAttributesToArrowBatches(
      [{featureId: 9007199254740993n, metadataClass: 'building', properties: {label: null}}],
      {schema}
    )
  };
  const mesh = encodeMeshTile(
    {
      mode: 4,
      topology: 'triangle-list',
      attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
    },
    {features}
  );
  const input = join(directory, 'input', 'features.json');
  await writeFile(join(directory, 'input', 'feature.glb'), new Uint8Array(mesh));
  await writeFile(
    input,
    JSON.stringify({
      asset: {version: '1.1', gltfUpAxis: 'Z'},
      root: {
        ...nested.root,
        boundingVolume: root.root.boundingVolume,
        transform: root.root.transform,
        content: {uri: 'feature.glb'}
      }
    })
  );
  const mapping = join(directory, 'mapping.json');
  await writeFile(
    mapping,
    JSON.stringify({schema, metadataClass: 'building', sourceFeatureIdProperty: 'feature_id'})
  );
  const output = join(directory, 'feature-output');
  const stdout: string[] = [];
  const stderr: string[] = [];
  const destinations = {
    stdout: (text: string) => stdout.push(text),
    stderr: (text: string) => stderr.push(text)
  };
  const argumentsList = [
    'convert',
    input,
    '--resource',
    'tile-root-content-0',
    '--output-format',
    '3d-tiles',
    '--output',
    output
  ];
  expect(
    await runTileConverterCLI([...argumentsList, '--feature-schema', mapping], destinations),
    stderr.join('\n')
  ).toBe(0);
  expect(stderr).toEqual([]);
  expect(JSON.parse(stdout.pop()!).report.outputResources).toBe(1);
  const data = await parse(
    new Uint8Array(await readFile(join(output, 'meshes/0.glb'))),
    GLTFLoader,
    {core: {worker: false, useLocalLibraries: true}}
  );
  const table = data.json.extensions!.EXT_structural_metadata.propertyTables[0];
  expect(Array.from(table.properties.feature_id.data)).toEqual([9007199254740993n]);
  expect(
    data.json.extensions!.EXT_structural_metadata.schema.classes.building.properties.label.noData
  ).toBe(table.properties.label.data[0]);
  expect(
    await runTileConverterCLI(
      ['validate', input, '--resource', 'tile-root-content-0'],
      destinations
    )
  ).toBe(1);
  expect(JSON.parse(stderr.pop()!).code).toBe('MESH_FEATURE_SCHEMA_REQUIRED');
  const slpkArguments = [
    'validate',
    input,
    '--resource',
    'tile-root-content-0',
    '--output-format',
    'slpk',
    '--feature-schema',
    mapping
  ];
  expect(await runTileConverterCLI(slpkArguments, destinations)).toBe(1);
  expect(JSON.parse(stderr.pop()!).message).toContain('decimal-string');
  await writeFile(
    mapping,
    JSON.stringify({
      schema,
      metadataClass: 'building',
      sourceFeatureIdProperty: 'feature_id',
      integer64Encoding: 'decimal-string'
    })
  );
  expect(await runTileConverterCLI(slpkArguments, destinations), stderr.join('\n')).toBe(0);
  expect(JSON.parse(stdout.pop()!).report.diagnostics).toEqual(
    expect.arrayContaining([expect.objectContaining({code: 'I3S_INTEGER_DECIMAL_STRING'})])
  );

  expect(
    await runTileConverterCLI(['inspect', input, '--feature-schema', mapping], destinations)
  ).toBe(1);
  expect(JSON.parse(stderr.pop()!).code).toBe('CLI_USAGE_ERROR');
});

test('CLI converts ordered multi-content and multi-primitive tiles into indexed 3TZ without flattening', async () => {
  const triangle = await parse(
    Uint8Array.from(await readFile(join(directory, 'input', 'nested', 'triangle.glb'))).buffer,
    GLTFLoader,
    {core: {worker: false}, gltf: {loadImages: false}}
  );
  triangle.json.meshes![0].primitives.push({...triangle.json.meshes![0].primitives[0]});
  const multiplePrimitives = GLTFWriter.encodeSync!(triangle);
  const input = join(directory, 'input', 'multiple.json');
  await writeFile(
    input,
    JSON.stringify({
      asset: {version: '1.1', gltfUpAxis: 'Z'},
      root: {
        ...nested.root,
        boundingVolume: root.root.boundingVolume,
        refine: 'REPLACE',
        transform: root.root.transform,
        content: undefined,
        contents: [{uri: 'nested/multiple.glb'}, {uri: 'nested/triangle.glb'}]
      }
    })
  );
  const archiveInput = join(directory, 'multiple-input.3tz');
  await writeFile(
    archiveInput,
    new Uint8Array(
      await Tiles3DArchiveWriter.encode!({
        'tileset.json': Uint8Array.from(await readFile(input)).buffer,
        'nested/multiple.glb': multiplePrimitives,
        'nested/triangle.glb': Uint8Array.from(
          await readFile(join(directory, 'input', 'nested', 'triangle.glb'))
        ).buffer
      })
    )
  );
  const output = join(directory, 'multiple.3tz');
  const stderr: string[] = [];
  expect(
    await runTileConverterCLI(
      [
        'convert',
        archiveInput,
        '--input-format',
        '3tz',
        '--preserve-hierarchy',
        '--resource',
        'tile-root-content-1',
        '--resource',
        'tile-root-content-0',
        '--output',
        output
      ],
      {stdout: () => {}, stderr: text => stderr.push(text)}
    ),
    stderr.join('\n')
  ).toBe(0);
  expect(stderr).toEqual([]);
  const archive = await parse3DTilesArchive(
    new BlobFile(new Blob([new Uint8Array(await readFile(output))]))
  );
  try {
    const tileset = JSON.parse(new TextDecoder().decode(await archive.getFile('tileset.json')));
    expect(tileset.root.contents).toEqual([
      {uri: 'meshes/0-0-primitive-0.glb'},
      {uri: 'meshes/0-0-primitive-1.glb'},
      {uri: 'meshes/0-1.glb'}
    ]);
    expect(tileset.root.content).toBeUndefined();
    expect(tileset.root.children).toBeUndefined();
    expect(tileset.root.refine).toBe('REPLACE');
    for (const content of tileset.root.contents)
      expect(
        new TextDecoder().decode(new Uint8Array(await archive.getFile(content.uri)).subarray(0, 4))
      ).toBe('glTF');
  } finally {
    await archive.close();
  }
});
