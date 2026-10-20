// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF, GLTFNode, GLTFScene} from './lib/types/gltf-json-schema';
import type {GLTFExternalBuffer, GLTFExternalFile, GLTFWithBuffers} from './lib/types/gltf-types';
import {parse as parseGLTF} from './gltf-loader-with-parser';

/** Options for a persistent, CPU-only glTF source. */
export type GLTFSourceOptions = {
  /** Override the platform fetch implementation. */
  fetch?: typeof fetch;
  /** Maximum number of nested node references traversed. */
  maxDepth?: number;
};

/**
 * Persistent, schema-preserving access to a glTF document and its resources.
 *
 * Opening reads the root document, but does not fetch external buffers, images or assets.
 * The source owns its resource cache and outstanding requests. No GPU resources are created.
 */
export class GLTFSource {
  readonly url: string;
  readonly gltf: GLTFWithBuffers;
  readonly json: GLTF;
  private readonly fetcher: typeof fetch;
  private readonly maxDepth: number;
  private readonly pending = new Map<string, Promise<ArrayBuffer>>();
  private readonly cache = new Map<string, ArrayBuffer>();
  private readonly controller = new AbortController();
  private closed = false;

  private constructor(url: string, gltf: GLTFWithBuffers, options: GLTFSourceOptions) {
    this.url = url;
    this.gltf = gltf;
    this.json = gltf.json;
    this.fetcher = options.fetch || globalThis.fetch.bind(globalThis);
    this.maxDepth = options.maxDepth ?? 256;
  }

  /** Load the root JSON or GLB container without fetching external resources. */
  static async open(url: string, options: GLTFSourceOptions = {}): Promise<GLTFSource> {
    const fetcher = options.fetch || globalThis.fetch.bind(globalThis);
    const response = await fetcher(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch glTF ${url}: HTTP ${response.status}`);
    }
    const bytes = await response.arrayBuffer();
    const baseUrl = new URL('.', url).href;
    const gltf = await parseGLTF(
      bytes,
      {
        core: {baseUrl},
        gltf: {
          normalize: false,
          loadBuffers: false,
          loadImages: false,
          loadAudio: false,
          loadFiles: false,
          loadExternalAssets: false,
          decompressMeshes: false
        }
      },
      {url, fetch: fetcher}
    );
    return new GLTFSource(url, gltf, options);
  }

  /** Return an unmodified glTF scene definition. */
  getScene(index: number = this.json.scene ?? 0): GLTFScene {
    this.assertOpen();
    const scene = this.json.scenes?.[index];
    if (!scene) throw new Error(`Invalid glTF scene index ${index}`);
    return scene;
  }

  /** Return an unmodified glTF node definition. */
  getNode(index: number): GLTFNode {
    this.assertOpen();
    const node = this.json.nodes?.[index];
    if (!node) throw new Error(`Invalid glTF node index ${index}`);
    return node;
  }

  /** Traverse a scene's native node indices in depth-first order. */
  *traverse(sceneIndex: number = this.json.scene ?? 0): IterableIterator<{index: number; node: GLTFNode}> {
    const scene = this.getScene(sceneIndex);
    const active = new Set<number>();
    const visit = function* (source: GLTFSource, index: number, depth: number): IterableIterator<{index: number; node: GLTFNode}> {
      if (depth > source.maxDepth) throw new Error('glTF node traversal depth exceeded');
      if (active.has(index)) throw new Error(`Cycle in glTF node hierarchy at index ${index}`);
      const node = source.getNode(index);
      active.add(index);
      try {
        yield {index, node};
        for (const child of node.children || []) yield* visit(source, child, depth + 1);
      } finally {
        active.delete(index);
      }
    };
    for (const index of scene.nodes || []) yield* visit(this, index, 0);
  }

  /** Fetch an external or data-URI buffer, or return an embedded GLB buffer. */
  async resolveBuffer(index: number): Promise<GLTFExternalBuffer> {
    this.assertOpen();
    const definition = this.json.buffers?.[index];
    if (!definition) throw new Error(`Invalid glTF buffer index ${index}`);
    const embedded = this.gltf.buffers[index];
    if (embedded) return embedded;
    if (!definition.uri) throw new Error(`glTF buffer ${index} has no embedded data or URI`);
    const data = await this.fetchBytes(definition.uri);
    if (data.byteLength < definition.byteLength) throw new Error(`Truncated glTF buffer ${index}`);
    this.assertOpen();
    const buffer = {arrayBuffer: data, byteOffset: 0, byteLength: definition.byteLength};
    this.gltf.buffers[index] = buffer;
    return buffer;
  }

  /** Resolve a glTF 2.1 file entry without loading unrelated resources. */
  async resolveFile(index: number): Promise<GLTFExternalFile> {
    this.assertOpen();
    const definition = this.json.files?.[index];
    if (!definition) throw new Error(`Invalid glTF file index ${index}`);
    const existing = this.gltf.files?.[index];
    if (existing) return existing;
    if (!definition.mimeType) throw new Error(`glTF file ${index} lacks mimeType`);
    if ((definition.uri === undefined) === (definition.bufferView === undefined)) {
      throw new Error(`glTF file ${index} must specify exactly one of uri or bufferView`);
    }
    let arrayBuffer: ArrayBuffer;
    let byteOffset = 0;
    let byteLength: number;
    if (definition.uri !== undefined) {
      arrayBuffer = await this.fetchBytes(definition.uri);
      byteLength = arrayBuffer.byteLength;
    } else {
      const view = this.json.bufferViews?.[definition.bufferView!];
      if (!view) throw new Error(`Invalid glTF file bufferView ${definition.bufferView}`);
      const buffer = await this.resolveBuffer(view.buffer);
      arrayBuffer = buffer.arrayBuffer;
      byteOffset = buffer.byteOffset + (view.byteOffset || 0);
      byteLength = view.byteLength;
      if (byteOffset + byteLength > arrayBuffer.byteLength) throw new Error('glTF file bufferView exceeds buffer');
    }
    this.assertOpen();
    const result: GLTFExternalFile = {
      arrayBuffer, byteOffset, byteLength, mimeType: definition.mimeType,
      name: definition.name,
      ...(definition.uri ? {url: new URL(definition.uri, this.url).href} : {})
    };
    this.gltf.files ||= new Array(this.json.files?.length || 0).fill(null);
    this.gltf.files[index] = result;
    return result;
  }

  /** Release source-owned cached bytes and cancel outstanding fetches. */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.controller.abort();
    this.cache.clear();
    this.pending.clear();
  }

  private assertOpen(): void {
    if (this.closed) throw new Error('GLTFSource is closed');
  }

  private async fetchBytes(uri: string): Promise<ArrayBuffer> {
    this.assertOpen();
    const key = new URL(uri, this.url).href;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;
    const promise = (async () => {
      const response = await this.fetcher(key, {signal: this.controller.signal});
      if (!response.ok) throw new Error(`Failed to fetch glTF resource ${key}: HTTP ${response.status}`);
      const data = await response.arrayBuffer();
      this.assertOpen();
      this.cache.set(key, data);
      return data;
    })();
    this.pending.set(key, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(key);
    }
  }
}
