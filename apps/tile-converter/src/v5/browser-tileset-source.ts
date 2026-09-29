// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TileConversionError} from './conversion-api.js';
import type {TileConversionSource} from './conversion-api.js';

type TilesetContent = {uri?: string; url?: string};
type TilesetTile = {
  content?: TilesetContent;
  contents?: TilesetContent[];
  children?: TilesetTile[];
  transform?: number[];
  implicitTiling?: unknown;
};
type TilesetDocument = {asset?: {version?: string}; root?: TilesetTile};

/** Input options for bounded traversal of one explicit 3D Tiles tileset. */
export interface BrowserTilesetConversionSourceOptions {
  /** URL of the root tileset JSON document. */
  readonly input: string;
  /** Maximum bytes retained across the tileset JSON and all content resources. */
  readonly maxInputBytes: number;
  /** Maximum number of content resources to visit. */
  readonly maxInputResources: number;
  /** Fetch implementation, defaulting to the browser global. */
  readonly fetcher?: typeof fetch;
}

/** Inspection result for an explicit 3D Tiles source. */
export interface BrowserTilesetConversionInspection {
  /** Absolute URL of the root tileset document. */
  readonly rootUrl: string;
  /** Parsed root document used for deterministic content traversal. */
  readonly tileset: TilesetDocument;
  /** Ordered content descriptors. */
  readonly resources: readonly BrowserTilesetResourceDescriptor[];
  /** Root document bytes charged against the input limit. */
  readonly tilesetBytes: number;
}

/** Placement metadata for one ordered content resource. */
export interface BrowserTilesetResourceDescriptor {
  /** Unique, stable path for this content placement. */
  readonly resourceId: string;
  /** Original URI declared by the tileset. */
  readonly uri: string;
  /** Tile child indexes from the tileset root. */
  readonly tilePath: readonly number[];
  /** Combined root-to-tile transform in column-major order. */
  readonly transform: readonly number[];
}

/** One raw content resource from a browser-readable explicit tileset. */
export interface BrowserTilesetConversionInputResource extends BrowserTilesetResourceDescriptor {
  /** Complete content bytes for an injected profile-specific codec. */
  readonly data: Uint8Array;
  /** Optional content type reported by the response. */
  readonly contentType?: string;
}

/**
 * Creates a bounded browser source for explicit 3D Tiles 1.0 and 1.1 tilesets.
 *
 * Traversal visits each declared content placement once in depth-first order. Implicit tiling and
 * nested external tilesets are rejected; content decoding and conversion remain codec work.
 *
 * @param options - Tileset URL and aggregate byte and resource limits.
 * @returns A source yielding ordered raw tile resources with placement transforms.
 */
export function createBrowserTilesetConversionSource(
  options: BrowserTilesetConversionSourceOptions
): TileConversionSource<BrowserTilesetConversionInspection, BrowserTilesetConversionInputResource> {
  if (
    !Number.isSafeInteger(options.maxInputBytes) ||
    options.maxInputBytes < 1 ||
    !Number.isSafeInteger(options.maxInputResources) ||
    options.maxInputResources < 1
  ) {
    throw new TileConversionError(
      'INVALID_BROWSER_SOURCE_OPTIONS',
      'Browser tileset sources require positive byte and resource limits'
    );
  }

  const fetcher = options.fetcher ?? fetch;
  return {
    async inspect(signal) {
      throwIfAborted(signal);
      const rootUrl = new URL(options.input).href;
      const response = await fetcher(rootUrl, {signal});
      if (!response.ok) {
        throw new TileConversionError(
          'BROWSER_SOURCE_FETCH_FAILED',
          `Could not fetch browser tileset (${response.status} ${response.statusText})`
        );
      }
      const data = await readResponseBytes(response, options.maxInputBytes, signal);
      let tileset: TilesetDocument;
      try {
        tileset = JSON.parse(new TextDecoder().decode(data)) as TilesetDocument;
      } catch {
        throw new TileConversionError('INVALID_BROWSER_TILESET', 'Tileset input is not valid JSON');
      }
      if (
        !isRecord(tileset) ||
        !['1.0', '1.1'].includes(tileset.asset?.version || '') ||
        !isRecord(tileset.root)
      ) {
        throw new TileConversionError(
          'UNSUPPORTED_BROWSER_TILESET',
          'Browser tileset traversal supports explicit 3D Tiles 1.0 and 1.1 documents'
        );
      }
      const resources = collectResources(tileset.root, options.maxInputResources);
      return {rootUrl, tileset, resources, tilesetBytes: data.byteLength};
    },
    async *read(inspection, signal) {
      let inputBytes = inspection.tilesetBytes;
      for (const descriptor of inspection.resources) {
        throwIfAborted(signal);
        const resourceUrl = resolveResourceUrl(descriptor.uri, inspection.rootUrl);
        const response = await fetcher(resourceUrl, {signal});
        if (!response.ok) {
          throw new TileConversionError(
            'BROWSER_SOURCE_FETCH_FAILED',
            `Could not fetch browser tile content (${response.status} ${response.statusText})`,
            [
              {
                code: 'BROWSER_SOURCE_FETCH_FAILED',
                message: resourceUrl,
                severity: 'error',
                resourceId: descriptor.resourceId
              }
            ]
          );
        }
        const remainingBytes = options.maxInputBytes - inputBytes;
        const data = await readResponseBytes(response, remainingBytes, signal);
        inputBytes += data.byteLength;
        const contentType = response.headers.get('content-type') ?? undefined;
        if (isJsonContent(data, contentType)) {
          throw new TileConversionError(
            'UNSUPPORTED_BROWSER_TILESET_CONTENT',
            `Nested tilesets and JSON tile content are not supported: ${descriptor.uri}`
          );
        }
        yield {...descriptor, data, ...(contentType ? {contentType} : {})};
      }
    }
  };
}

/** Collects explicit tile contents in declaration order and fails on unbounded formats. */
function collectResources(
  root: TilesetTile,
  maxInputResources: number
): BrowserTilesetResourceDescriptor[] {
  const resources: BrowserTilesetResourceDescriptor[] = [];
  const stack: Array<{tile: TilesetTile; path: number[]; transform: number[]}> = [
    {tile: root, path: [], transform: identityMatrix()}
  ];
  while (stack.length > 0) {
    const {tile, path, transform: parentTransform} = stack.pop()!;
    if (!isRecord(tile)) {
      throw new TileConversionError('INVALID_BROWSER_TILESET', 'Tile entries must be objects');
    }
    if (tile.implicitTiling) {
      throw new TileConversionError(
        'UNSUPPORTED_BROWSER_TILESET',
        'Browser tileset traversal does not yet support implicit tiling'
      );
    }
    if (tile.contents !== undefined && !Array.isArray(tile.contents)) {
      throw new TileConversionError('INVALID_BROWSER_TILESET', 'Tile contents must be an array');
    }
    if (tile.children !== undefined && !Array.isArray(tile.children)) {
      throw new TileConversionError('INVALID_BROWSER_TILESET', 'Tile children must be an array');
    }
    const transform = multiplyMatrices(parentTransform, normalizeMatrix(tile.transform));
    const contents = tile.contents ?? (tile.content ? [tile.content] : []);
    for (let contentIndex = 0; contentIndex < contents.length; contentIndex++) {
      const content = contents[contentIndex];
      if (!isRecord(content)) {
        throw new TileConversionError(
          'INVALID_BROWSER_TILESET',
          'Tile content entries must be objects'
        );
      }
      const uri = content.uri ?? content.url;
      if (typeof uri !== 'string' || !uri) {
        throw new TileConversionError(
          'INVALID_BROWSER_TILESET',
          `Tile content at ${path.join('/')} has no URI`
        );
      }
      if (resources.length >= maxInputResources) {
        throw new TileConversionError(
          'INPUT_RESOURCE_COUNT_EXCEEDED',
          `Browser tileset exceeds the configured ${maxInputResources} resource limit`
        );
      }
      resources.push({
        resourceId: `tile-${path.length ? path.join('-') : 'root'}-content-${contentIndex}`,
        uri,
        tilePath: path,
        transform
      });
    }
    const children = tile.children ?? [];
    for (let childIndex = children.length - 1; childIndex >= 0; childIndex--) {
      stack.push({
        tile: children[childIndex],
        path: [...path, childIndex],
        transform
      });
    }
  }
  return resources;
}

/** Reads one response into a single buffer without exceeding its remaining byte budget. */
async function readResponseBytes(
  response: Response,
  maximumBytes: number,
  signal?: AbortSignal
): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new TileConversionError(
      'BROWSER_SOURCE_STREAM_UNAVAILABLE',
      'Browser inputs must provide a readable response stream'
    );
  }
  const data = new Uint8Array(maximumBytes);
  let byteLength = 0;
  try {
    while (true) {
      throwIfAborted(signal);
      const {done, value} = await reader.read();
      if (done) break;
      if (value.byteLength > maximumBytes - byteLength) {
        await reader.cancel();
        throw new TileConversionError(
          'INPUT_RESOURCE_TOO_LARGE',
          `Browser tileset input exceeds the configured ${maximumBytes} byte remaining limit`
        );
      }
      data.set(value, byteLength);
      byteLength += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return data.subarray(0, byteLength);
}

/** Detects JSON payloads that may declare an unsupported external tileset. */
function isJsonContent(data: Uint8Array, contentType?: string): boolean {
  return (
    Boolean(contentType?.includes('json')) ||
    new TextDecoder()
      .decode(data.subarray(0, Math.min(data.byteLength, 32)))
      .trimStart()
      .startsWith('{')
  );
}

/** Resolves a tile URI and carries root query parameters to same-origin relative resources. */
function resolveResourceUrl(uri: string, rootUrl: string): string {
  const root = new URL(rootUrl);
  const resource = new URL(uri, root);
  if (resource.origin === root.origin) {
    for (const [name, value] of root.searchParams) {
      if (!resource.searchParams.has(name)) resource.searchParams.append(name, value);
    }
  }
  return resource.href;
}

/** Returns whether a JSON value is a non-array object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

/** Returns an identity matrix in column-major order. */
function identityMatrix(): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** Validates and copies a tile's optional column-major transform. */
function normalizeMatrix(matrix?: number[]): number[] {
  if (matrix === undefined) return identityMatrix();
  if (
    !Array.isArray(matrix) ||
    matrix.length !== 16 ||
    matrix.some(value => !Number.isFinite(value))
  ) {
    throw new TileConversionError(
      'INVALID_BROWSER_TILESET',
      'Tile transform must contain 16 finite numbers'
    );
  }
  return matrix;
}

/** Multiplies column-major 4x4 matrices. */
function multiplyMatrices(left: number[], right: number[]): number[] {
  const result = new Array<number>(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      result[column * 4 + row] =
        left[row] * right[column * 4] +
        left[4 + row] * right[column * 4 + 1] +
        left[8 + row] * right[column * 4 + 2] +
        left[12 + row] * right[column * 4 + 3];
    }
  }
  return result;
}

/** Throws the signal reason when a browser source operation has been canceled. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
  }
}
