// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {validateBytes, validateString} from 'gltf-validator';
import {load, encodeSync} from '@loaders.gl/core';
import {GLTFLoader, GLTFWriter, convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';

test.each([
  'Box',
  'BoxAnimated'
])('original Khronos glTF 1 %s converts to valid glTF 2 JSON and GLB with explicit rendering limitations', async name => {
  const warn = vi.fn(() => () => {});
  const parsed = await load(`@loaders.gl/gltf/test/data/gltf-1.0/${name}.gltf`, GLTFLoader, {
    core: {log: {log: () => () => {}, warn}},
    gltf: {loadImages: false}
  });
  expect(parsed.json.asset.version).toBe('2.0');
  expect(parsed.json.meshes!.length).toBeGreaterThan(0);
  for (const feature of [
    'legacy techniques',
    'legacy programs',
    'legacy shaders',
    'asset premultipliedAlpha rendering'
  ])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(`does not support ${feature}`));
  const jsonReport = await validateString(JSON.stringify(parsed.json), {
    writeTimestamp: false,
    externalResourceFunction: rejectExternalResource
  });
  expect(jsonReport.issues.messages.filter(message => message.severity === 0)).toEqual([]);
  const encoded = encodeSync(parsed, GLTFWriter, {gltf: {version: 2}});
  const binaryReport = await validateBytes(new Uint8Array(encoded), {
    writeTimestamp: false,
    externalResourceFunction: rejectExternalResource
  });
  expect(binaryReport.issues.messages.filter(message => message.severity === 0)).toEqual([]);
  if (name === 'BoxAnimated') expect(parsed.json.animations).toHaveLength(2);
});

test('conversion omits optional empty child and scene-root lists without modifying extras or source JSON', () => {
  const source = {
    json: {
      asset: {version: '1.0'},
      nodes: {root: {children: [], extras: {children: []}}},
      scenes: {empty: {nodes: []}},
      scene: 'empty'
    },
    buffers: []
  } as any;
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.nodes![0].children).toBeUndefined();
  expect(converted.json.scenes![0].nodes).toBeUndefined();
  expect(converted.json.nodes![0].extras.children).toEqual([]);
  expect(source.json.nodes.root.children).toEqual([]);
  expect(source.json.scenes.empty.nodes).toEqual([]);
});

/** Sample fixtures are self-contained; independent validation must not fetch external resources. */
async function rejectExternalResource(uri: string): Promise<Uint8Array> {
  throw new Error(`Unexpected external resource: ${uri}`);
}
