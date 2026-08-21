// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {GLTFExternalFile, GLTFWithBuffers} from '../types/gltf-types';
import {getTypedArrayForBufferView} from './get-typed-array';
import {resolveUrl} from './resolve-url';
import {assert} from '../utils/assert';

/**
 * Find a draft glTF 2.1 file definition by package name or original URI.
 * @param gltf - Parsed glTF container.
 * @param reference - Package-relative file reference.
 * @returns File index, or `-1` when no definition matches.
 */
export function findGLTFFileIndex(gltf: GLTFWithBuffers, reference: string): number {
  const files = gltf.json.files || [];
  const matches: number[] = [];

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    if (file.name === reference || file.uri === reference) {
      matches.push(fileIndex);
    }
  }

  assert(matches.length <= 1, `glTF package file reference ${reference} is ambiguous.`);
  return matches[0] ?? -1;
}

/**
 * Resolve a draft glTF 2.1 file from a URI or embedded buffer view.
 * String references are matched against `files[*].name` and `files[*].uri`, enabling this
 * function to serve as the virtual file-system lookup for packaged assets.
 * @param gltf - Parsed glTF container with buffers loaded when embedded files are used.
 * @param fileReference - File array index, package name, or original URI.
 * @param options - Loader options used for relative URL resolution.
 * @param context - Loader context supplying base URL and fetch implementation.
 * @returns Resolved file bytes and metadata.
 */
export async function resolveGLTFFile(
  gltf: GLTFWithBuffers,
  fileReference: number | string,
  options: StrictLoaderOptions,
  context: LoaderContext
): Promise<GLTFExternalFile> {
  const files = gltf.json.files || [];
  const fileIndex =
    typeof fileReference === 'number' ? fileReference : findGLTFFileIndex(gltf, fileReference);
  assert(Number.isInteger(fileIndex) && fileIndex >= 0 && fileIndex < files.length);

  gltf.files = gltf.files || new Array(files.length).fill(null);
  const loadedFile = gltf.files[fileIndex];
  if (loadedFile) {
    return loadedFile;
  }

  const file = files[fileIndex];
  assert(file.mimeType, `glTF file ${fileIndex} must define mimeType.`);
  const hasUri = file.uri !== undefined;
  const hasBufferView = file.bufferView !== undefined;
  assert(
    hasUri !== hasBufferView,
    `glTF file ${fileIndex} must define exactly one of uri or bufferView.`
  );

  let resolvedFile: GLTFExternalFile;
  if (file.uri !== undefined) {
    const url = resolveUrl(file.uri, options, context);
    const response = await context.fetch(url);
    assert(response?.ok, `Failed to fetch glTF file ${file.uri}: HTTP ${response?.status}.`);
    const arrayBuffer = await response.arrayBuffer();
    resolvedFile = {
      arrayBuffer,
      byteOffset: 0,
      byteLength: arrayBuffer.byteLength,
      mimeType: file.mimeType,
      name: file.name,
      url
    };
  } else {
    const data = getTypedArrayForBufferView(gltf.json, gltf.buffers, file.bufferView);
    resolvedFile = {
      arrayBuffer: data.buffer as ArrayBuffer,
      byteOffset: data.byteOffset,
      byteLength: data.byteLength,
      mimeType: file.mimeType,
      name: file.name
    };
  }

  gltf.files[fileIndex] = resolvedFile;
  return resolvedFile;
}
