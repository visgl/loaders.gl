// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, expectTypeOf, test} from 'vitest';
import {encodeSync, load, parse} from '@loaders.gl/core';
import {
  GLTFLoader,
  GLTFWriter,
  getGLTFInteractivity,
  postProcessGLTF,
  type GLTF,
  type GLTFWithBuffers,
  type GLTFInteractivityValue,
  type GLTFInteractivityEvent,
  type GLTFInteractivityDeclaration
} from '@loaders.gl/gltf';

let parsed: GLTFWithBuffers;
beforeAll(async () => {
  parsed = await load('@loaders.gl/gltf/test/data/interactivity/minimal.gltf', GLTFLoader);
});

test('getGLTFInteractivity reads JSON and loader results without expanding defaults', () => {
  const extension = getGLTFInteractivity(parsed);
  expect(extension).toBe(parsed.json.extensions?.KHR_interactivity);
  expect(getGLTFInteractivity(parsed.json)).toBe(extension);
  expect(extension?.graph).toBeUndefined();
  expect(extension?.graphs[0].nodes?.[0].flows?.out).toEqual({node: 1});
  expect(extension?.graphs[0].events?.[0].id).toBeUndefined();
});

test('getGLTFInteractivity returns null for absent extensions', () => {
  const json: GLTF = {asset: {version: '2.0'}};
  expect(getGLTFInteractivity(json)).toBeNull();
  expect(getGLTFInteractivity({json})).toBeNull();
  expect(getGLTFInteractivity({...json, extensions: {}})).toBeNull();
  expect(getGLTFInteractivity({...json, json: null})).toBeNull();
});

test('postprocessing retains interactivity indices, pointers, and metadata', () => {
  const original = structuredClone(parsed);
  const snapshot = structuredClone(original.json.extensions?.KHR_interactivity);
  const processed = postProcessGLTF(original);
  expect(processed.extensions?.KHR_interactivity).toEqual(snapshot);
  expect(original.json.extensions?.KHR_interactivity).toEqual(snapshot);
  expect(processed.extensionsUsed).toContain('KHR_interactivity');
});

test('GLTFWriter preserves interactivity through a GLB round trip', async () => {
  const original = structuredClone(parsed);
  const encoded = encodeSync(original, GLTFWriter);
  const decoded = await parse(encoded, GLTFLoader);
  expect(getGLTFInteractivity(decoded)).toEqual(getGLTFInteractivity(parsed));
  expect(decoded.json.extensionsUsed).toContain('KHR_interactivity');
});

test('interactivity types model internal events and connected or default input values', () => {
  expectTypeOf<{values: {position: {type: number}}}>().toExtend<GLTFInteractivityEvent>();
  expectTypeOf<{node: number; socket: string}>().toExtend<GLTFInteractivityValue>();
  expectTypeOf<{type: number}>().toExtend<GLTFInteractivityValue>();
  expectTypeOf<{}>().not.toExtend<GLTFInteractivityValue>();
  expectTypeOf<{node: number; value: number[]}>().not.toExtend<GLTFInteractivityValue>();
  expectTypeOf<{socket: string}>().not.toExtend<GLTFInteractivityValue>();
  expectTypeOf<{
    op: string;
    inputValueSockets: {input: {type: number}};
  }>().not.toExtend<GLTFInteractivityDeclaration>();
});
