// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

test('glTF 1 obsolete asset and default texture fields move to provenance without losing application data', () => {
  const source = createAccessorAsset({
    asset: {
      version: '1.0',
      profile: {api: 'WebGL', version: '1.0'},
      premultipliedAlpha: false,
      extras: {application: 5, gltf1: {existing: true}}
    },
    textures: {
      texture: {
        format: 6408,
        internalFormat: 6408,
        target: 3553,
        type: 5121,
        extras: {name: 'metadata'}
      }
    }
  });
  const originalJson = JSON.stringify(source.json);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.asset).not.toHaveProperty('profile');
  expect(converted.json.asset).not.toHaveProperty('premultipliedAlpha');
  expect(converted.json.asset.extras).toEqual({
    application: 5,
    gltf1: {
      existing: true,
      legacyFields: {profile: {api: 'WebGL', version: '1.0'}, premultipliedAlpha: false}
    }
  });
  const texture = converted.json.textures![0];
  for (const field of ['format', 'internalFormat', 'target', 'type'])
    expect(texture).not.toHaveProperty(field);
  expect(texture.extras).toEqual({
    name: 'metadata',
    gltf1: {legacyFields: {format: 6408, internalFormat: 6408, target: 3553, type: 5121}}
  });
  expect(JSON.stringify(source.json)).toBe(originalJson);
});

test.each(['application', [1, 2], null])('glTF 1 cleanup retains non-object extras: %j', extras => {
  const converted = convertGLTFV1ToGLTF2(
    createAccessorAsset({
      asset: {version: '1.0', profile: {}, extras},
      textures: {texture: {type: 5121, extras: {gltf1: 'existing'}}}
    }),
    {normalize: 'strict'}
  );
  expect(converted.json.asset.extras.originalExtras).toEqual(extras);
  expect(converted.json.textures![0].extras.gltf1.originalExtras).toBe('existing');
});

test.each([
  'application',
  {profile: 'application', other: true}
])('glTF 1 cleanup retains existing legacy provenance: %j', legacyFields => {
  const source = createAccessorAsset({
    asset: {version: '1.0', profile: {api: 'WebGL'}, extras: {gltf1: {legacyFields}}}
  });
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.asset.extras.gltf1.legacyFields.profile).toEqual({api: 'WebGL'});
  expect(converted.json.asset.extras.gltf1.legacyFields.originalExtras).toEqual(legacyFields);
  expect(source.json.asset.extras.gltf1.legacyFields).toEqual(legacyFields);
});

test.each([
  {asset: {version: '1.0', premultipliedAlpha: true}},
  {textures: {texture: {format: 6407}}},
  {textures: {texture: {internalFormat: 6406}}},
  {textures: {texture: {target: 34067}}},
  {textures: {texture: {type: 5126}}}
])('glTF 1 cleanup reports rendering semantics that require additional conversion: %j', properties => {
  const source = createAccessorAsset(properties);
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toEqual([
    expect.stringContaining('rendering')
  ]);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/rendering/);
});
