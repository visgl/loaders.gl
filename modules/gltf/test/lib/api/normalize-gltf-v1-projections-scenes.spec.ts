// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';
import {createGLTFV1ConformanceAsset} from '../../test-utils/create-gltf-v1-conformance';

test.each([
  {type: 'perspective', perspective: {yfov: 1, znear: 0.1}},
  {type: 'perspective', perspective: {yfov: 1, znear: 0.1, zfar: 10, aspectRatio: 2}},
  {type: 'orthographic', orthographic: {xmag: -2, ymag: 3, znear: 0, zfar: 10}}
])('glTF 1 preserves valid $type projection parameters', camera => {
  const converted = convertGLTFV1ToGLTF2(createAccessorAsset({cameras: {camera}}), {
    normalize: 'strict'
  });
  expect(converted.json.cameras![0]).toMatchObject(camera);
  expect(converted.normalizationReport.unsupported).toEqual([]);
});

test.each([
  {yfov: 0},
  {znear: 0},
  {znear: -1},
  {zfar: 0.05},
  {aspectRatio: 0},
  {aspectRatio: '2'},
  {yfov: NaN}
])('glTF 1 rejects invalid perspective parameters %j', overrides => {
  const source = createAccessorAsset({
    cameras: {camera: {type: 'perspective', perspective: {yfov: 1, znear: 0.1, ...overrides}}}
  });
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toEqual([
    'camera 0 invalid projection parameters'
  ]);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'invalid projection parameters'
  );
});

test.each([
  {xmag: 0},
  {ymag: 0},
  {znear: -1},
  {zfar: 0},
  {zfar: 1, znear: 1}
])('glTF 1 rejects invalid orthographic parameters %j', overrides => {
  const source = createAccessorAsset({
    cameras: {
      camera: {
        type: 'orthographic',
        orthographic: {xmag: 2, ymag: 3, znear: 0, zfar: 10, ...overrides}
      }
    }
  });
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'invalid projection parameters'
  );
});

test('glTF 1 attaches the full detached ancestor chain without duplicating its transforms', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.nodes.group = {children: ['root'], translation: [0, 3, 0]};
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.scenes![0].nodes).toEqual([2, 3]);
  expect(converted.json.nodes![3]).toMatchObject({children: [0], translation: [0, 3, 0]});
  expect(converted.json.skins![0].skeleton).toBe(0);
});

test('glTF 1 attaches shared skeletons once in every scene with a skin instance', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.scenes.second = {nodes: ['instance']};
  json.nodes.instance.meshes.push('mesh');
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.scenes!.map(scene => scene.nodes)).toEqual([
    [2, 0],
    [2, 0]
  ]);
  expect(converted.json.nodes![2].children).toHaveLength(1);
  expect(
    converted.normalizationReport.warnings.filter(warning => warning.includes('Attached detached'))
  ).toHaveLength(2);
});

test('glTF 1 retains a skeleton that is already in the scene without adding duplicate roots', () => {
  const source = createGLTFV1ConformanceAsset();
  (source.json as any).scenes.scene.nodes.unshift('root');
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.scenes![0].nodes).toEqual([0, 2]);
  expect(
    converted.normalizationReport.warnings.some(warning => warning.includes('Attached detached'))
  ).toBe(false);
});

test.each([
  {label: 'renderable subtree', change: (json: any) => (json.nodes.root.meshes = ['mesh'])},
  {
    label: 'opaque node extension',
    change: (json: any) => (json.nodes.root.extensions = {VENDOR_unknown: {}})
  },
  {label: 'partial scene membership', change: (json: any) => json.scenes.scene.nodes.push('child')}
])('glTF 1 preserves unsafe detached skeleton $label and reports the gap', ({change}) => {
  const source = createGLTFV1ConformanceAsset();
  change(source.json);
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported).toContain(
    'scene 0 skin 0 cannot safely attach detached skeleton'
  );
  expect(converted.json.scenes![0].nodes).not.toContain(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('cannot safely attach');
});

test.each([
  {type: 'unknown'},
  {type: 'perspective'},
  {type: 'orthographic'}
])('glTF 1 reports missing or unknown projection definitions %j', camera => {
  const source = createAccessorAsset({cameras: {camera}});
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'invalid projection parameters'
  );
});

test('glTF 1 rejects repeated scene paths without attaching a skeleton', () => {
  const source = createGLTFV1ConformanceAsset();
  (source.json as any).scenes.scene.nodes.push('instance');
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported).toContain('scene 0 invalid node hierarchy');
  expect(converted.json.scenes![0].nodes).toEqual([2, 2]);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'invalid node hierarchy'
  );
});
