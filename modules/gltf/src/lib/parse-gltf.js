/* eslint-disable camelcase, max-statements, no-restricted-globals */
/* global TextDecoder */
import assert from './utils/assert';
import {getFullUri} from './gltf-utils/gltf-utils';
import {decodeExtensions, decodeExtensionsSync} from './extensions/extensions';
import parseGLBSync, {isGLB} from './parse-glb';
import postProcessGLTF from './post-process-gltf';

const DEFAULT_OPTIONS = {
  fetchLinkedResources: true, // Fetch any linked .BIN buffers, decode base64
  fetchImages: false, // Fetch any linked .BIN buffers, decode base64
  createImages: false, // Create image objects
  decompress: false, // Decompress Draco compressed meshes
  postProcess: false,
  log: console // eslint-disable-line
};

export function isGLTF(arrayBuffer, options = {}) {
  const dataView = new DataView(arrayBuffer);
  const byteOffset = 0;
  return isGLB(dataView, byteOffset);
}

export async function parseGLTF(gltf, arrayBufferOrString, byteOffset = 0, options, context) {
  options = {...DEFAULT_OPTIONS, ...options.gltf};

  parseGLTFContainerSync(gltf, arrayBufferOrString, byteOffset, options);

  const promises = [];

  if (options.fetchImages) {
    const promise = fetchImages(gltf, options, context);
    promises.push(promise);
  }

  // Load linked buffers asynchronously and decodes base64 buffers in parallel
  if (options.fetchLinkedResources) {
    await fetchBuffers(gltf, options, context);
  }

  const promise = decodeExtensions(gltf, options, context);
  promises.push(promise);

  // Parallelize image loading and buffer loading/extension decoding
  await Promise.all(promises);

  // Post processing resolves indices to objects, buffers
  return options.postProcess ? postProcessGLTF(gltf, options) : gltf;
}

// NOTE: The sync parser cannot handle linked assets or base64 encoded resources
// gtlf - input can be arrayBuffer (GLB or UTF8 encoded JSON), string (JSON), or parsed JSON.
// eslint-disable-next-line complexity
export function parseGLTFSync(gltf, arrayBufferOrString, byteOffset = 0, options, context) {
  options = {...DEFAULT_OPTIONS, ...options};

  parseGLTFContainerSync(gltf, arrayBufferOrString, byteOffset, options);

  // TODO: we could synchronously decode base64 encoded data URIs in this non-async path
  if (options.fetchLinkedResources) {
    fetchBuffersSync(gltf, options);
  }

  // Whether this is possible can depends on whether sync loaders are registered
  // e.g. the `DracoWorkerLoader` cannot be called synchronously
  if (options.decodeExtensions) {
    decodeExtensionsSync(gltf, options);
  }

  // Post processing resolves indices to objects, buffers
  return options.postProcess ? postProcessGLTF(gltf, options) : gltf;
}

// `data` - can be ArrayBuffer (GLB), ArrayBuffer (Binary JSON), String (JSON), or Object (parsed JSON)
function parseGLTFContainerSync(gltf, data, byteOffset, options) {
  // Initialize gltf container
  if (options.uri) {
    gltf.baseUri = options.uri;
  }

  // If data is binary and starting with magic bytes, assume binary JSON text, convert to string
  if (data instanceof ArrayBuffer && !isGLB(data, byteOffset, options)) {
    const textDecoder = new TextDecoder();
    data = textDecoder.decode(data);
  }

  if (typeof data === 'string') {
    // If string, try to parse as JSON
    gltf.json = JSON.parse(data);
  } else if (data instanceof ArrayBuffer) {
    // If still ArrayBuffer, parse as GLB container
    gltf._glb = {};
    byteOffset = parseGLBSync(gltf._glb, data, byteOffset, options);
    gltf.json = gltf._glb.json;
  } else {
    // Assume input is already parsed JSON
    // TODO - should we throw instead?
    gltf.json = data;
  }

  // Populate buffers
  // Create an external buffers array to hold binary data
  const buffers = gltf.json.buffers || [];
  gltf.buffers = new Array(buffers.length).fill({});

  // Populates JSON and some bin chunk info
  if (gltf._glb && gltf._glb.hasBinChunk) {
    gltf.buffers[0] = {
      // TODO - standardize on `arrayBuffer`
      arrayBuffer: gltf._glb.binChunks[0].arrayBuffer,
      byteOffset: gltf._glb.binChunks[0].byteOffset,
      byteLength: gltf._glb.binChunks[0].byteLength
    };

    gltf.json.buffers[0].data = gltf.buffers[0].arrayBuffer;
    gltf.json.buffers[0].byteOffset = gltf.buffers[0].byteOffset;
  }

  // Populate images
  const images = gltf.json.images || [];
  gltf.images = new Array(images.length).fill({});
}

// Asynchronously fetch and parse buffers, store in buffers array outside of json
async function fetchBuffers(gltf, options, context) {
  for (let i = 0; i < gltf.json.buffers.length; ++i) {
    const buffer = gltf.json.buffers[i];
    if (buffer.uri) {
      if (!options.uri) {
        // TODO - remove this defensive hack and auto-infer the base URI
        // eslint-disable-next-line
        console.warn('options.uri must be set to decode embedded glTF buffers');
        return;
      }

      const {fetch} = context;
      assert(fetch);

      const uri = getFullUri(buffer.uri, options.uri);
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      gltf.buffers[i] = {
        arrayBuffer,
        byteOffset: 0,
        byteLength: arrayBuffer.byteLength
      };

      delete buffer.uri;
    }
  }
}

function fetchBuffersSync(gltf, options) {
  for (const buffer of gltf.json.buffers || []) {
    if (buffer.uri) {
      throw new Error('parseGLTFSync: Cannot decode uri buffers');
    }
  }
}

async function fetchImages(gltf, options, context) {
  const images = gltf.json.images || [];

  const promises = [];
  for (let i = 0; i < images.length; ++i) {
    const image = images[i];
    if ('uri' in image) {
      promises.push(fetchAndParseLinkedImage(gltf, image, i, options));
    }
  }
  return await Promise.all(promises);
}

// Asynchronously fetches and parses one image, store in images array outside of json
async function fetchAndParseLinkedImage(gltf, image, i, options, context) {
  // const fetch = options.fetch || window.fetch;
  // assert(fetch);

  /*
  if (image.bufferView) {
    gltf.images[i] = await new Promise(resolve => {
      const arrayBufferView = this.getBufferView(image.bufferView);
      const mimeType = image.mimeType || 'image/jpeg';
      const blob = new Blob([arrayBufferView], { type: mimeType });
      const urlCreator = self.URL || self.webkitURL;
      const imageUrl = urlCreator.createObjectURL(blob);
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = imageUrl;
    });
  }
  */

  const uri = getFullUri(image.uri, options.uri);

  // TODO - Call `parse` and use registered image loaders?
  // const response = await fetch(uri);
  // const arrayBuffer = await response.arrayBuffer();
  // Create a new 'buffer' to hold the arrayBuffer?
  // const image = parse(arrayBuffer);

  gltf.images[i] = await new Promise((resolve, reject) => {
    /* global Image */
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = error => reject(error);
    img.src = uri;
  });
}
