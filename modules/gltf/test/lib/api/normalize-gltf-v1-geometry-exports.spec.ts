// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateString, validateBytes} from 'gltf-validator';
import {parse, encodeSync} from '@loaders.gl/core';
import {convertGLTFV1ToGLTF2, GLTFLoader, GLTFWriter} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import {createGLBV1} from '../../test-utils/create-glb-v1';

test('signed attributes on a tiny skinned triangle produce independently valid glTF 2 JSON', async () => {
  const source = createTriangleAsset();
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.normalizationReport.unsupported).toEqual([]);
  const report = await validateString(JSON.stringify(converted.json), {
    writeTimestamp: false,
    externalResourceFunction: rejectExternalResource
  });
  expect(report.issues.messages.filter(message => message.severity === 0)).toEqual([]);
});

test.each([
  'JSON',
  'GLB 1'
])('GLTFLoader completes %s geometry conversion and writes an independently valid GLB 2', async format => {
  const source = createTriangleAsset();
  let input: string | ArrayBuffer;
  if (format === 'JSON') {
    delete (source.json.buffers as any).data.byteLength;
    input = JSON.stringify(source.json);
  } else {
    const json = source.json as any;
    json.buffers.binary_glTF = {byteLength: 169, type: 'arraybuffer'};
    delete json.buffers.data;
    json.bufferViews.view.buffer = 'binary_glTF';
    const paddedBody = new Uint8Array(172);
    paddedBody.set(new Uint8Array(source.buffers[0].arrayBuffer));
    paddedBody[168] = 0x44;
    input = createGLBV1(json, paddedBody);
  }
  const parsed = await parse(input, GLTFLoader, {gltf: {normalize: 'strict', loadImages: false}});
  const encoded = encodeSync(parsed, GLTFWriter, {gltf: {version: 2}});
  const report = await validateBytes(new Uint8Array(encoded), {
    writeTimestamp: false,
    externalResourceFunction: rejectExternalResource
  });
  expect(report.issues.messages.filter(message => message.severity === 0)).toEqual([]);
  const reparsed = await parse(encoded, GLTFLoader, {gltf: {loadImages: false}});
  expect(reparsed.json.skins![0].joints).toEqual([0, 1]);
  expect(
    reparsed.json.accessors![reparsed.json.meshes![0].primitives[0].attributes.WEIGHTS_0]
  ).toMatchObject({componentType: 5126, type: 'VEC4'});
});

/** Dense 168-byte triangle with unit directions, signed UV/color/weights, and a two-node palette. */
function createTriangleAsset(): GLTFWithBuffers {
  const arrayBuffer = new ArrayBuffer(168);
  new Float32Array(arrayBuffer, 0, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  new Float32Array(arrayBuffer, 36, 9).set([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  new Float32Array(arrayBuffer, 72, 12).set([1, 0, 0, 1, 1, 0, 0, -1, 1, 0, 0, 1]);
  new Int16Array(arrayBuffer, 120, 6).set([0, 0, 32767, 0, 0, 32767]);
  new Int8Array(arrayBuffer, 132, 9).fill(127);
  new Int8Array(arrayBuffer, 144, 6).set([127, 0, 127, 0, 127, 0]);
  new Uint8Array(arrayBuffer, 156, 12).set([0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0]);
  /** All attributes share the raw source view so conversion must separate target layouts. */
  const accessor = (
    byteOffset: number,
    componentType: number,
    type: string,
    normalized?: boolean
  ) => ({
    bufferView: 'view',
    byteOffset,
    componentType,
    type,
    count: 3,
    ...(normalized === undefined ? {} : {normalized})
  });
  return {
    json: {
      asset: {version: '1.0'},
      buffers: {
        data: {
          byteLength: 168,
          uri: `data:application/octet-stream;base64,${btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))}`
        }
      },
      bufferViews: {view: {buffer: 'data', byteLength: 168}},
      accessors: {
        position: accessor(0, 5126, 'VEC3'),
        normal: accessor(36, 5126, 'VEC3'),
        tangent: accessor(72, 5126, 'VEC4'),
        uv: accessor(120, 5122, 'VEC2', true),
        color: accessor(132, 5120, 'VEC3', true),
        weight: accessor(144, 5120, 'VEC2', true),
        joint: accessor(156, 5121, 'VEC4')
      },
      meshes: {
        mesh: {
          primitives: [
            {
              attributes: {
                POSITION: 'position',
                NORMAL: 'normal',
                TANGENT: 'tangent',
                TEXCOORD: 'uv',
                COLOR: 'color',
                JOINT: 'joint',
                WEIGHT: 'weight'
              }
            }
          ]
        }
      },
      skins: {skin: {jointNames: ['root', 'child']}},
      nodes: {
        root: {jointName: 'root', children: ['child']},
        child: {jointName: 'child'},
        instance: {meshes: ['mesh'], skin: 'skin', skeletons: ['root']}
      },
      scenes: {scene: {nodes: ['root', 'instance']}},
      scene: 'scene'
    },
    buffers: [{arrayBuffer, byteOffset: 0, byteLength: 168}]
  } as unknown as GLTFWithBuffers;
}

/** Independent validation must never fetch the public network. */
async function rejectExternalResource(uri: string): Promise<Uint8Array> {
  throw new Error(`Unexpected external resource: ${uri}`);
}
