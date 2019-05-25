/* eslint-disable camelcase, max-statements, no-restricted-globals */
/* global TextDecoder */
import {fetchFile} from '@loaders.gl/core';
import assert from './utils/assert';
import {getFullUri} from './gltf-utils/gltf-utils';
import parseGLBSync, {isGLB} from './parse-glb';
import * as EXTENSIONS from './extensions';

// import {getGLTFAccessors, getGLTFAccessor} from './gltf-attribute-utils';
// import {
//   ATTRIBUTE_TYPE_TO_COMPONENTS,
//   ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE,
//   ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY
// } from '../gltf/gltf-utils';

const DEFAULT_SYNC_OPTIONS = {
  fetchLinkedResources: false, // Fetch any linked .BIN buffers, decode base64
  decompress: false, // Decompress Draco compressed meshes (if DracoLoader available)
  DracoLoader: null,
  postProcess: true,
  createImages: false, // Create image objects
  log: console // eslint-disable-line
};

const DEFAULT_ASYNC_OPTIONS = {
  fetchLinkedResources: true, // Fetch any linked .BIN buffers, decode base64
  fetch: fetchFile,
  decompress: false, // Decompress Draco compressed meshes (if DracoLoader available)
  DracoLoader: null,
  postProcess: true,
  createImages: false, // Create image objects
  log: console // eslint-disable-line
};

export function isGLTF(arrayBuffer, options = {}) {
  const dataView = new DataView(arrayBuffer);
  const byteOffset = 0;
  return isGLB(dataView, byteOffset);
}

// NOTE: The sync parser cannot handle linked assets or base64 encoded resources
// gtlf - input can be arrayBuffer (GLB or UTF8 encoded JSON), string (JSON), or parsed JSON.
export function parseGLTFSync(gltf, arrayBufferOrString, byteOffset = 0, options = {}) {
  options = Object.assign({}, DEFAULT_SYNC_OPTIONS, options);

  let data = arrayBufferOrString;

  // If binary is not starting with magic bytes, assume JSON and convert to string
  if (data instanceof ArrayBuffer && !isGLB(data, byteOffset, options)) {
    const textDecoder = new TextDecoder();
    data = textDecoder.decode(data);
  }

  gltf.buffers = [];

  // If string, try to parse as JSON
  if (typeof data === 'string') {
    gltf.json = JSON.parse(data);
  } else if (data instanceof ArrayBuffer) {
    // Populates JSON and some bin chunk info
    byteOffset = parseGLBSync(gltf, data, byteOffset, options);

    if (gltf.hasBinChunk) {
      gltf.buffers.push({
        arrayBuffer: data,
        byteOffset: gltf.binChunkByteOffset,
        byteLength: gltf.binChunkLength
      });
    }
  } else {
    // Assume parsed JSON
    gltf.json = data;
  }

  if (options.uri) {
    gltf.baseUri = options.uri;
  }

  // TODO: we could synchronously decode base64 encoded URIs in the non-async path
  if (options.fetchLinkedResources) {
    for (const buffer of gltf.json.buffers || []) {
      if (buffer.uri) {
        throw new Error('parseGLTFSync: Cannot decode uri buffers');
      }
    }
  }

  decodeExtensions(gltf, options);

  return byteOffset;
}

export async function parseGLTF(gltf, arrayBufferOrString, byteOffset = 0, options = {}) {
  options = Object.assign({}, DEFAULT_ASYNC_OPTIONS, options);

  // Postpone decompressing/postprocessing to make sure we load any linked files first
  // TODO - is this really needed?
  parseGLTFSync(gltf, arrayBufferOrString, byteOffset, {
    ...options,
    fetchLinkedResources: false, // We'll handle it if needed
    postProcess: false, // We'll handle it if needed
    decompress: false // We'll handle it if needed
  });

  // Load linked buffers asynchronously and decodes base64 buffers in parallel
  if (options.fetchLinkedResources) {
    await fetchLinkedResources(gltf, options);
  }

  return gltf;
}

async function fetchLinkedResources(gltf, options) {
  for (const buffer of gltf.json.buffers) {
    if (buffer.uri) {
      const fetch = options.fetch || window.fetch;
      assert(fetch);
      const uri = getFullUri(buffer.uri, options.uri);
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      buffer.data = arrayBuffer;
      delete buffer.uri;
    }
  }
}

// TODO - async decoding for Draco
function decodeExtensions(gltf, options) {
  for (const extensionName in EXTENSIONS) {
    const disableExtension = extensionName in options && !options[extensionName];
    if (!disableExtension) {
      const extension = EXTENSIONS[extensionName];
      extension.decode(gltf, options);
    }
  }
}
