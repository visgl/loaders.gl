// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertGLTFV1ToGLTF2, normalizeGLTFV1} from '@loaders.gl/gltf';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

/** Tiny unsigned color fixture requiring an explicit normalization assumption. */
function createAmbiguousColorAsset() {
  const source = createAccessorAsset(
    {
      accessors: {color: {bufferView: 'view', componentType: 5121, count: 1, type: 'VEC4'}},
      meshes: {mesh: {primitives: [{attributes: {COLOR: 'color'}}]}}
    },
    4
  );
  new Uint8Array(source.buffers[0].arrayBuffer, 0, 4).set([255, 128, 0, 255]);
  return source;
}

test('glTF 1 conversion executes lazy logger callbacks and retains structured diagnostics', () => {
  const messages: string[] = [];
  const logger = {
    log: vi.fn(function (this: unknown, priority: number, message: string) {
      expect(this).toBe(logger);
      expect(priority).toBe(1);
      return () => messages.push(message);
    }),
    warn: vi.fn(function (this: unknown, message: string) {
      expect(this).toBe(logger);
      return () => messages.push(message);
    })
  };
  const converted = convertGLTFV1ToGLTF2(createAmbiguousColorAsset(), {log: logger});
  expect(logger.log).toHaveBeenCalledTimes(2);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(messages).toHaveLength(3);
  expect(messages[1]).toContain('assumes normalized unsigned values');
  expect(converted.normalizationReport.unsupported[0]).toContain('ambiguous integer attribute');
  expect(converted.normalizationReport.warnings).toHaveLength(1);
});

test('glTF 1 strict rejection emits its diagnostic before throwing', () => {
  const emitWarning = vi.fn();
  const logger = {log: vi.fn(() => vi.fn()), warn: vi.fn(() => emitWarning)};
  expect(() =>
    convertGLTFV1ToGLTF2(createAmbiguousColorAsset(), {
      normalize: 'strict',
      log: logger
    })
  ).toThrow('ambiguous integer attribute');
  expect(emitWarning).toHaveBeenCalledOnce();
  expect(logger.log).toHaveBeenCalledOnce();
});

test('glTF 1 non-mutating normalization forwards the supplied logger', () => {
  const source = createAmbiguousColorAsset();
  const emitWarning = vi.fn();
  const report = normalizeGLTFV1(source, {
    normalize: true,
    mutate: false,
    log: {log: () => () => {}, warn: () => emitWarning}
  });
  expect(emitWarning).toHaveBeenCalledOnce();
  expect(report.mutated).toBe(false);
  expect(source.json.asset.version).toBe('1.0');
});

test.each([
  undefined,
  null
])('glTF 1 helpers leave console output to the caller when log is %s', log => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const converted = convertGLTFV1ToGLTF2(createAmbiguousColorAsset(), {log});
    expect(converted.normalizationReport.unsupported).toHaveLength(1);
    expect(warning).not.toHaveBeenCalled();
  } finally {
    warning.mockRestore();
  }
});

test('unknown glTF versions use the supplied logger and structured warning', () => {
  const source = createAccessorAsset({asset: {version: '3.0'}});
  const emitWarning = vi.fn();
  const logger = {log: vi.fn(() => vi.fn()), warn: vi.fn(() => emitWarning)};
  const report = normalizeGLTFV1(source, {normalize: true, log: logger});
  expect(report.warnings).toEqual(['Unknown glTF version 3.0']);
  expect(emitWarning).toHaveBeenCalledOnce();
  expect(logger.log).not.toHaveBeenCalled();
});
