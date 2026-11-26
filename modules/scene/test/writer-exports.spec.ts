// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {DracoWriter} from '@loaders.gl/scene/draco';
import {DracoWriter as BundledDracoWriter} from '@loaders.gl/scene/draco/bundled';
import {GLBWriter, GLTFWriter} from '@loaders.gl/scene/gltf';
import {
  GLBWriter as BundledGLBWriter,
  GLTFWriter as BundledGLTFWriter
} from '@loaders.gl/scene/gltf/bundled';
import {OBJWriter} from '@loaders.gl/scene/obj';
import {OBJWriter as BundledOBJWriter} from '@loaders.gl/scene/obj/bundled';

test.each([
  ['DracoWriter', DracoWriter, BundledDracoWriter],
  ['GLBWriter', GLBWriter, BundledGLBWriter],
  ['GLTFWriter', GLTFWriter, BundledGLTFWriter],
  ['OBJWriter', OBJWriter, BundledOBJWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
