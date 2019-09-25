/* eslint-disable camelcase, max-statements, no-restricted-globals */
/* global TextDecoder */
import {parseJSON} from '@loaders.gl/loader-utils';
import assert from './utils/assert';
import {getFullUri} from './gltf-utils/gltf-utils';
import {decodeExtensions} from './extensions/gltf-extensions';
import parseGLBSync, {isGLB} from './parse-glb';
import postProcessGLTF from './post-process-gltf';

export function isGLTF(arrayBuffer, options = {}) {
  const dataView = new DataView(arrayBuffer);
  const byteOffset = 0;
  return isGLB(dataView, byteOffset);
}

export async function parseGLTF(gltf, arrayBufferOrString, byteOffset = 0, options, context) {
  parseGLTFContainerSync(gltf, arrayBufferOrString, byteOffset, options);

  const promises = [];

  if (options.gltf.fetchImages) {
    const promise = fetchImages(gltf, options, context);
    promises.push(promise);
  }

  // Load linked buffers asynchronously and decodes base64 buffers in parallel
  if (options.gltf.fetchBuffers) {
    await fetchBuffers(gltf, options, context);
  }

  const promise = decodeExtensions(gltf, options, context);
  promises.push(promise);

  // Parallelize image loading and buffer loading/extension decoding
  await Promise.all(promises);

  // Post processing resolves indices to objects, buffers
  return options.gltf.postProcess ? postProcessGLTF(gltf, options) : gltf;
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
    gltf.json = parseJSON(data);
  } else if (data instanceof ArrayBuffer) {
    // If still ArrayBuffer, parse as GLB container
    const glb = {};
    byteOffset = parseGLBSync(glb, data, byteOffset, options);

    assert(glb.type === 'glTF', `Invalid GLB magic string ${glb.type}`);

    gltf._glb = glb;
    gltf.json = glb.json;
  } else {
    assert(false, `GLTF: must be ArrayBuffer or string`);
  }

  // Populate buffers
  // Create an external buffers array to hold binary data
  const buffers = gltf.json.buffers || [];
  gltf.buffers = new Array(buffers.length).fill({});

  // Populates JSON and some bin chunk info
  if (gltf._glb && gltf._glb.hasBinChunk) {
    const {binChunks} = gltf._glb;
    gltf.buffers[0] = {
      arrayBuffer: binChunks[0].arrayBuffer,
      byteOffset: binChunks[0].byteOffset,
      byteLength: binChunks[0].byteLength
    };

    // TODO - this modifies JSON and is a post processing thing
    // gltf.json.buffers[0].data = gltf.buffers[0].arrayBuffer;
    // gltf.json.buffers[0].byteOffset = gltf.buffers[0].byteOffset;
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
