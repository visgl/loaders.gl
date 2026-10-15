// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, getSpatialAudio, type GLTF, type GLTFWithBuffers} from '@loaders.gl/gltf';
import type {LoaderContext} from '@loaders.gl/loader-utils';
import {decode as decodeEmitters} from '../../../src/lib/extensions/KHR_audio_emitter';
import {decode as decodeSpatial} from '../../../src/lib/extensions/MPEG_audio_spatial';

/** Creates tiny encoded audio fixtures without requiring an audio codec. */
function createEmitterAsset(): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_audio_emitter'],
      buffers: [{byteLength: 5}],
      bufferViews: [{buffer: 0, byteOffset: 1, byteLength: 3}],
      extensions: {
        KHR_audio_emitter: {
          audio: [{bufferView: 0, mimeType: 'audio/mpeg', uri: 'ignored.mp3'}],
          sources: [{audio: 0, autoplay: true, loop: true, gain: 0.5}, {}],
          emitters: [
            {type: 'positional', sources: [0, 1], positional: {coneInnerAngle: 1}},
            {type: 'global', sources: [0]},
            {type: 'global'}
          ]
        }
      },
      nodes: [{extensions: {KHR_audio_emitter: {emitters: [0, 1]}}}],
      scenes: [{extensions: {KHR_audio_emitter: {emitters: [1, 2]}}}]
    },
    buffers: [
      {arrayBuffer: new Uint8Array([9, 9, 0, 1, 2, 3, 0, 9]).buffer, byteOffset: 2, byteLength: 5}
    ]
  };
}

/** Creates MPEG declarations with a timed accessor and no resident audio data. */
function createSpatialAsset(): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.0'},
      accessors: [
        {componentType: 5126, type: 'SCALAR', count: 1, extensions: {MPEG_accessor_timed: {}}}
      ],
      extensionsUsed: ['MPEG_audio_spatial'],
      extensions: {
        MPEG_audio_spatial: {
          listener: {id: 1},
          reverbs: [{id: 7, properties: [{frequency: 1000, RT60: 1, DSR: 0}]}]
        }
      },
      nodes: [
        {
          extensions: {
            MPEG_audio_spatial: {
              sources: [
                {id: 2, type: 'Object', accessors: [0], reverbFeed: [7], reverbFeedGain: [0]}
              ]
            }
          }
        },
        {extensions: {MPEG_audio_spatial: {sources: [{id: 3, type: 'HOA', accessors: [0]}]}}}
      ]
    },
    buffers: []
  };
}

test('KHR audio preserves JSON and resolves shared clips, placeholders and scene/node attachments', async () => {
  const asset = createEmitterAsset();
  const original = structuredClone(asset.json);
  const fetch = vi.fn();
  await decodeEmitters(asset, {}, {fetch} as unknown as LoaderContext);
  expect(asset.json).toEqual(original);
  expect(asset.audioClips![0].data).toEqual(new Uint8Array([1, 2, 3]));
  expect(fetch).not.toHaveBeenCalled();
  expect(
    asset.audioEmitters!.map(({nodeIndex, sceneIndex, emitterIndex}) => [
      nodeIndex,
      sceneIndex,
      emitterIndex
    ])
  ).toEqual([
    [0, null, 0],
    [0, null, 1],
    [null, 0, 1],
    [null, 0, 2]
  ]);
  expect(asset.audioEmitters![0].sources[0].clip).toBe(asset.audioEmitters![2].sources[0].clip);
  expect(asset.audioEmitters![0].sources[1].clip).toBeUndefined();
  expect(asset.audioEmitters![3].sources).toEqual([]);
});

test('KHR audio resolves external URLs through the supplied fetch and handles errors', async () => {
  const asset = createEmitterAsset();
  asset.json.extensions!.KHR_audio_emitter.audio = [{uri: '../sound.mp3'}];
  const fetch = vi.fn(async () => new Response(new Uint8Array([4, 5])));
  const context = {fetch, baseUrl: 'https://example.invalid/models/'} as unknown as LoaderContext;
  await decodeEmitters(asset, {}, context);
  expect(fetch).toHaveBeenCalledWith('https://example.invalid/sound.mp3');
  expect(asset.audioClips![0].data).toEqual(new Uint8Array([4, 5]));
  await expect(decodeEmitters(asset, {})).rejects.toThrow('loader context');
  fetch.mockResolvedValueOnce(new Response('', {status: 404}));
  await expect(decodeEmitters(asset, {}, context)).rejects.toThrow('(404)');
});

test('KHR audio supports metadata-only loading and unloaded buffers', async () => {
  const asset = createEmitterAsset();
  asset.buffers = [];
  await decodeEmitters(asset, {gltf: {loadBuffers: false}});
  expect(asset.audioClips![0].data).toBeUndefined();
  await expect(decodeEmitters(asset, {})).rejects.toThrow('not loaded');
  asset.json.extensions!.KHR_audio_emitter.audio = [{uri: 'unresolved.mp3'}];
  await decodeEmitters(asset, {gltf: {loadAudio: false}});
  expect(asset.audioEmitters).toHaveLength(4);
  expect(asset.audioClips![0].data).toBeUndefined();
});

test.each([
  [
    'audio',
    (json: GLTF) => {
      json.extensions!.KHR_audio_emitter.sources[0].audio = -1;
    }
  ],
  [
    'source',
    (json: GLTF) => {
      json.extensions!.KHR_audio_emitter.emitters[0].sources = [3];
    }
  ],
  [
    'emitter',
    (json: GLTF) => {
      json.nodes![0].extensions!.KHR_audio_emitter.emitters = [0.5];
    }
  ],
  [
    'requires emitters',
    (json: GLTF) => {
      json.nodes![0].extensions!.KHR_audio_emitter.emitters = [];
    }
  ],
  [
    'global emitters',
    (json: GLTF) => {
      json.scenes![0].extensions!.KHR_audio_emitter.emitters = [0];
    }
  ],
  [
    'positional settings',
    (json: GLTF) => {
      json.extensions!.KHR_audio_emitter.emitters[0].type = 'global';
    }
  ],
  [
    'invalid emitter type',
    (json: GLTF) => {
      json.extensions!.KHR_audio_emitter.emitters[0].type = 'invalid';
    }
  ],
  [
    'bufferView',
    (json: GLTF) => {
      json.extensions!.KHR_audio_emitter.audio[0].bufferView = 1;
    }
  ],
  [
    'mimeType',
    (json: GLTF) => {
      delete json.extensions!.KHR_audio_emitter.audio[0].mimeType;
    }
  ],
  [
    'uri or bufferView',
    (json: GLTF) => {
      json.extensions!.KHR_audio_emitter.audio = [{}];
    }
  ],
  [
    'exceeds',
    (json: GLTF) => {
      json.bufferViews![0].byteLength = 5;
    }
  ]
])('KHR audio rejects invalid %s', async (message, mutate) => {
  const asset = createEmitterAsset();
  mutate(asset.json);
  await expect(decodeEmitters(asset, {})).rejects.toThrow(message);
});

test('MPEG audio distinguishes raw documents with a custom json property from loader results', () => {
  const document = {...createSpatialAsset().json, json: {applicationData: true}};
  const descriptors = getSpatialAudio(document);
  expect(descriptors).toHaveLength(3);
  expect(descriptors).toEqual(getSpatialAudio({json: document, buffers: []}));
});

test('MPEG audio discovers root and node declarations without mutating JSON or fetching media', async () => {
  const asset = createSpatialAsset();
  const original = structuredClone(asset.json);
  await decodeSpatial(asset);
  expect(asset.json).toEqual(original);
  expect(getSpatialAudio(asset.json)).toEqual(asset.spatialAudio);
  expect(asset.spatialAudio!.map(descriptor => descriptor.nodeIndex)).toEqual([null, 0, 1]);
  expect(asset.spatialAudio![1].extension.sources![0].accessors).toEqual([0]);
});

test.each([
  undefined,
  [],
  [-1],
  [0.5],
  [1]
])('MPEG audio rejects invalid accessor references %j', async accessors => {
  const asset = createSpatialAsset();
  asset.json.nodes![0].extensions!.MPEG_audio_spatial.sources[0].accessors = accessors;
  await expect(decodeSpatial(asset)).rejects.toThrow('accessor');
});

test('MPEG audio rejects mismatched reverb gains', async () => {
  const asset = createSpatialAsset();
  asset.json.nodes![0].extensions!.MPEG_audio_spatial.sources[0].reverbFeedGain = [0, 1];
  await expect(decodeSpatial(asset)).rejects.toThrow('mismatched');
});

test('GLTFLoader integrates both audio extensions and supports independent exclusion', async () => {
  const asset = createSpatialAsset();
  asset.json.extensionsUsed!.push('KHR_audio_emitter');
  asset.json.extensions!.KHR_audio_emitter = {
    audio: [{uri: 'data:audio/mpeg;base64,AQID'}],
    sources: [{audio: 0}],
    emitters: [{type: 'global', sources: [0]}]
  };
  asset.json.scenes = [{extensions: {KHR_audio_emitter: {emitters: [0]}}}];
  const parsed = await parse(JSON.stringify(asset.json), GLTFLoader);
  expect(parsed.audioClips![0].data).toEqual(new Uint8Array([1, 2, 3]));
  expect(parsed.spatialAudio).toHaveLength(3);
  const excluded = await parse(JSON.stringify(asset.json), GLTFLoader, {
    gltf: {excludeExtensions: ['KHR_audio_emitter', 'MPEG_audio_spatial']}
  });
  expect(excluded.audioEmitters).toBeUndefined();
  expect(excluded.spatialAudio).toBeUndefined();
  expect(excluded.json.extensions).toEqual(asset.json.extensions);
});

test('audio handlers leave assets without audio unchanged', async () => {
  const asset: GLTFWithBuffers = {
    json: {asset: {version: '2.0'}, nodes: [{}], scenes: [{}]},
    buffers: []
  };
  const original = structuredClone(asset);
  await decodeEmitters(asset, {});
  await decodeSpatial(asset);
  expect(asset).toEqual(original);
});
