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
  extensions?: Record<string, unknown>;
};
type TilesetDocument = {asset?: {version?: string}; root?: TilesetTile};

/** Input options for bounded traversal of explicit 3D Tiles documents. */
export interface BrowserTilesetConversionSourceOptions {
  /** URL of the root tileset JSON document. */
  readonly input: string;
  /** Maximum aggregate response bytes across root/nested JSON and content resources. */
  readonly maxInputBytes: number;
  /** Maximum content declarations across all documents, including external JSON references. */
  readonly maxInputResources: number;
  /** Maximum documents read, including the root and repeated placements; defaults to 1 (no nesting). */
  readonly maxTilesetDocuments?: number;
  /** Fetch implementation, defaulting to the browser global. */
  readonly fetcher?: typeof fetch;
}

/** Inspection result for an explicit 3D Tiles source. */
export interface BrowserTilesetConversionInspection {
  /** Final response URL of the root document, falling back to the requested URL for virtual transports. */
  readonly rootUrl: string;
  /** Parsed root document used for deterministic content traversal. */
  readonly tileset: TilesetDocument;
  /** Ordered root-document descriptors; nested references expand lazily during reading. */
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
  /** Tile child indexes within the declaring document. */
  readonly tilePath: readonly number[];
  /** Declaring nested document URL; absent for root-document content. */
  readonly tilesetUrl?: string;
  /** Combined entry-root-to-tile transform in column-major order, including external roots. */
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
 * Traversal visits declared placements in depth-first order. Set maxTilesetDocuments above 1
 * to follow explicit external tilesets, with shared byte/declaration limits and active-path cycle
 * detection. Inspection only reads the root; nested metadata is discovered during reading.
 * Implicit tiling remains unsupported; content decoding and conversion remain codec work.
 * Bounds, metadata and LOD authoring policy remain application responsibilities.
 *
 * @param options - Tileset URL and aggregate byte and resource limits.
 * @returns A source yielding raw resources and placement transforms; it does not preserve output LOD.
 */
export function createBrowserTilesetConversionSource(
  options: BrowserTilesetConversionSourceOptions
): TileConversionSource<BrowserTilesetConversionInspection, BrowserTilesetConversionInputResource> {
  const maxTilesetDocuments = options.maxTilesetDocuments ?? 1;
  if (
    !Number.isSafeInteger(maxTilesetDocuments) ||
    maxTilesetDocuments < 1 ||
    !Number.isSafeInteger(options.maxInputBytes) ||
    options.maxInputBytes < 1 ||
    !Number.isSafeInteger(options.maxInputResources) ||
    options.maxInputResources < 1
  ) {
    throw new TileConversionError(
      'INVALID_BROWSER_SOURCE_OPTIONS',
      'Browser tileset sources require positive byte, declaration and document limits'
    );
  }

  const fetcher = options.fetcher ?? fetch;
  return {
    async inspect(signal) {
      throwIfAborted(signal);
      const requestedUrl = new URL(options.input).href;
      const response = await fetcher(requestedUrl, {signal});
      const rootUrl = response.url || requestedUrl;
      if (!response.ok) {
        await response.body?.cancel();
        throw new TileConversionError(
          'BROWSER_SOURCE_FETCH_FAILED',
          `Could not fetch browser tileset (${response.status} ${response.statusText})`
        );
      }
      const data = await readResponseBytes(response, options.maxInputBytes, signal);
      const tileset = parseTilesetDocument(data);
      const resources = collectResources(tileset.root, options.maxInputResources);
      return {rootUrl, tileset, resources, tilesetBytes: data.byteLength};
    },
    async *read(inspection, signal) {
      let inputBytes = inspection.tilesetBytes;
      let declarations = inspection.resources.length;
      let documents = 1;
      const stack = [
        {
          resources: inspection.resources,
          index: 0,
          tileset: inspection.tileset,
          url: inspection.rootUrl,
          ancestors: new Set([getDocumentKey(inspection.rootUrl), getDocumentKey(options.input)])
        }
      ];
      while (stack.length) {
        throwIfAborted(signal);
        const frame = stack[stack.length - 1];
        if (frame.index === frame.resources.length) {
          stack.pop();
          continue;
        }
        const descriptor = frame.resources[frame.index++];
        const resourceUrl = resolveResourceUrl(descriptor.uri, frame.url);
        if (frame.ancestors.has(getDocumentKey(resourceUrl))) {
          throw new TileConversionError(
            'BROWSER_TILESET_CYCLE',
            'External tileset references an active ancestor document'
          );
        }
        const response = await fetcher(resourceUrl, {signal});
        if (!response.ok) {
          await response.body?.cancel();
          throw new TileConversionError(
            'BROWSER_SOURCE_FETCH_FAILED',
            'Could not fetch browser tile content (' +
              response.status +
              ' ' +
              response.statusText +
              ')',
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
        const documentUrl = response.url || resourceUrl;
        if (frame.ancestors.has(getDocumentKey(documentUrl))) {
          await response.body?.cancel();
          throw new TileConversionError(
            'BROWSER_TILESET_CYCLE',
            'Redirected content references an active ancestor document'
          );
        }
        const data = await readResponseBytes(response, options.maxInputBytes - inputBytes, signal);
        inputBytes += data.byteLength;
        const contentType = response.headers.get('content-type') ?? undefined;
        if (isJsonContent(data, contentType)) {
          if (maxTilesetDocuments === 1) {
            throw new TileConversionError(
              'UNSUPPORTED_BROWSER_TILESET_CONTENT',
              'Nested tilesets and JSON tile content require an explicit document budget'
            );
          }
          if (documents >= maxTilesetDocuments) {
            throw new TileConversionError(
              'INPUT_TILESET_COUNT_EXCEEDED',
              'Browser tileset exceeds its document limit'
            );
          }
          let tile = frame.tileset.root!;
          for (const childIndex of descriptor.tilePath) tile = tile.children![childIndex];
          if (tile.children?.length) {
            throw new TileConversionError(
              'INVALID_BROWSER_TILESET',
              'External tileset references cannot also have child tiles'
            );
          }
          const tileset = parseTilesetDocument(data);
          const resources = collectResources(
            tileset.root!,
            options.maxInputResources - declarations,
            descriptor.transform
          ).map(resource => ({
            ...resource,
            resourceId: descriptor.resourceId + '/' + resource.resourceId,
            tilesetUrl: documentUrl
          }));
          declarations += resources.length;
          documents++;
          stack.push({
            resources,
            index: 0,
            tileset,
            url: documentUrl,
            ancestors: new Set([
              ...frame.ancestors,
              getDocumentKey(resourceUrl),
              getDocumentKey(documentUrl)
            ])
          });
          continue;
        }
        yield {...descriptor, data, ...(contentType ? {contentType} : {})};
      }
    }
  };
}

/** Parses one root or external document without inferring a profile from its filename. */
function parseTilesetDocument(data: Uint8Array): TilesetDocument & {root: TilesetTile} {
  let tileset: TilesetDocument;
  try {
    tileset = JSON.parse(new TextDecoder().decode(data));
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
  return tileset as TilesetDocument & {root: TilesetTile};
}

/** Normalizes URL identity for cycle checks; fragments do not identify a separate response. */
function getDocumentKey(url: string): string {
  const documentUrl = new URL(url);
  documentUrl.hash = '';
  return documentUrl.href;
}

/** Collects explicit tile contents in declaration order and fails on unbounded formats. */
function collectResources(
  root: TilesetTile,
  maxInputResources: number,
  parentTransform: readonly number[] = identityMatrix()
): BrowserTilesetResourceDescriptor[] {
  const resources: BrowserTilesetResourceDescriptor[] = [];
  const stack: Array<{tile: TilesetTile; path: number[]; transform: number[]}> = [
    {tile: root, path: [], transform: [...parentTransform]}
  ];
  while (stack.length > 0) {
    const {tile, path, transform: parentTransform} = stack.pop()!;
    if (!isRecord(tile)) {
      throw new TileConversionError('INVALID_BROWSER_TILESET', 'Tile entries must be objects');
    }
    if (
      tile.implicitTiling !== undefined ||
      tile.extensions?.['3DTILES_implicit_tiling'] !== undefined
    ) {
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
    if (tile.content !== undefined && tile.contents !== undefined) {
      throw new TileConversionError(
        'INVALID_BROWSER_TILESET',
        'Tile content and contents are mutually exclusive'
      );
    }
    const transform = multiplyMatrices(parentTransform, normalizeMatrix(tile.transform));
    if (transform.some(value => !Number.isFinite(value))) {
      throw new TileConversionError(
        'INVALID_BROWSER_TILESET',
        'Composed tile transforms must remain finite'
      );
    }
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
  let byteLength = 0;
  try {
    const data = new Uint8Array(maximumBytes);
    while (true) {
      throwIfAborted(signal);
      const {done, value} = await reader.read();
      throwIfAborted(signal);
      if (done) break;
      if (value.byteLength > maximumBytes - byteLength) {
        throw new TileConversionError(
          'INPUT_RESOURCE_TOO_LARGE',
          `Browser tileset input exceeds the configured ${maximumBytes} byte remaining limit`
        );
      }
      data.set(value, byteLength);
      byteLength += value.byteLength;
    }
    return data.slice(0, byteLength);
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/** Detects JSON payloads that require document validation before traversal. */
function isJsonContent(data: Uint8Array, contentType?: string): boolean {
  if (contentType?.includes('json')) return true;
  let byteOffset = data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf ? 3 : 0;
  while ([0x09, 0x0a, 0x0d, 0x20].includes(data[byteOffset])) byteOffset++;
  return data[byteOffset] === 0x7b;
}

/** Resolves a tile URI and carries declaring-document query parameters to same-origin resources. */
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
