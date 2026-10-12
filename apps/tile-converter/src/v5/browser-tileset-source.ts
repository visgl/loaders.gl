// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TileConversionError} from './conversion-api.js';
import type {TileConversionSource} from './conversion-api.js';

type TilesetContent = {uri?: string; url?: string};
type TilesetTile = {
  /** Source metric error, scaled conservatively during selected mesh extraction. */
  geometricError?: number;
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
  /** Inspect declared .json external tilesets without fetching mesh content; defaults to false. */
  readonly inspectNestedTilesets?: boolean;
  /** Fetch implementation, defaulting to the browser global. */
  readonly fetcher?: typeof fetch;
}

/** Inspection result for an explicit 3D Tiles source. */
export interface BrowserTilesetConversionInspection {
  /** Final response URL of the root document, falling back to the requested URL for virtual transports. */
  readonly rootUrl: string;
  /** Parsed root document used for deterministic content traversal. */
  readonly tileset: TilesetDocument;
  /** Ordered root declarations, or binary candidates from an expanded metadata inspection. */
  readonly resources: readonly BrowserTilesetResourceDescriptor[];
  /** Inspected root/nested metadata bytes charged against the aggregate input limit. */
  readonly tilesetBytes: number;
  /** Inspected document placements, including repeated references; absent for root-only inspection. */
  readonly documents?: readonly BrowserTilesetDocumentPlacement[];
}

/** One inspected document at a distinct external placement. */
export interface BrowserTilesetDocumentPlacement {
  /** Effective document URL, including inherited query credentials. */
  readonly url: string;
  /** Original parsed document; its metadata and glTF conventions stay scoped to this document. */
  readonly tileset: TilesetDocument;
  /** Combined placement above this document's root. */
  readonly parentTransform: readonly number[];
  /** Conservative inherited metric error, when declared by all external ancestors. */
  readonly parentGeometricError?: number;
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
  /** Placement index in an expanded inspection's documents. */
  readonly documentIndex?: number;
  /** Combined entry-root-to-tile transform in column-major order, including external roots. */
  readonly transform: readonly number[];
}

/** One raw content resource from a browser-readable explicit tileset. */
export interface BrowserTilesetConversionInputResource extends BrowserTilesetResourceDescriptor {
  /** Complete content bytes for an injected profile-specific codec. */
  readonly data: Uint8Array;
  /** Optional content type reported by the response. */
  readonly contentType?: string;
  /** Effective content response URL used to resolve decoder dependencies after redirects. */
  readonly contentUrl?: string;
}

/**
 * Creates a bounded browser source for explicit 3D Tiles 1.0 and 1.1 tilesets.
 *
 * Traversal visits declared placements in depth-first order. Set maxTilesetDocuments above 1
 * to follow explicit external tilesets, with shared byte/declaration limits and active-path cycle
 * detection. Inspection reads the root by default; inspectNestedTilesets follows declared .json
 * references without fetching binary content. Other nested metadata is discovered during reading.
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
    (options.inspectNestedTilesets !== undefined &&
      typeof options.inspectNestedTilesets !== 'boolean') ||
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
      const inspection = {rootUrl, tileset, resources, tilesetBytes: data.byteLength};
      return options.inspectNestedTilesets
        ? expandInspection(inspection, options, maxTilesetDocuments, fetcher, signal)
        : inspection;
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
        const resourceUrl = resolveResourceUrl(descriptor.uri, descriptor.tilesetUrl ?? frame.url);
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
          if (inspection.documents)
            throw new TileConversionError(
              'UNSUPPORTED_BROWSER_TILESET_CONTENT',
              'Expanded inspection selections must be binary content; declare external metadata with a .json URI'
            );
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
        yield {...descriptor, data, contentUrl: documentUrl, ...(contentType ? {contentType} : {})};
      }
    }
  };
}

/** A selected document and conservative source error for one content placement. */
export interface BrowserTilesetContentSelection {
  /** Cloned document retaining its metadata, ancestor transforms and only the selected content. */
  readonly tileset: TilesetDocument;
  /** Resolved resource URL, carrying same-origin document query parameters. */
  readonly contentUrl: string;
  /** Conservative source geometric error in meters, including transform scaling. */
  readonly geometricError: number;
  /** Whether the original selected tile has no children. */
  readonly isLeaf: boolean;
}

/** Selects one inspected content while keeping declaring-document conventions and placement. */
export function selectBrowserTilesetContent(
  inspection: BrowserTilesetConversionInspection,
  descriptor: BrowserTilesetResourceDescriptor
): BrowserTilesetContentSelection {
  const placement = inspection.documents?.[descriptor.documentIndex ?? 0];
  if (inspection.documents && (!Number.isSafeInteger(descriptor.documentIndex) || !placement))
    throw new TileConversionError(
      'INVALID_BROWSER_SELECTION',
      'Content descriptor has no inspected document placement'
    );
  const document = structuredClone(placement?.tileset ?? inspection.tileset);
  const originalRoot = document.root!;
  let transform = [...(placement?.parentTransform ?? identityMatrix())];
  let maximum = placement?.parentGeometricError ?? 0;
  let tile = originalRoot;
  for (let depth = 0; ; depth++) {
    transform = multiplyMatrices(transform, normalizeMatrix(tile.transform));
    if (
      typeof tile.geometricError !== 'number' ||
      !Number.isFinite(tile.geometricError) ||
      tile.geometricError < 0
    )
      throw new TileConversionError(
        'MESH_GEOMETRIC_ERROR_INVALID',
        'Every selected ancestor must declare a finite nonnegative geometricError'
      );
    maximum = Math.max(maximum, tile.geometricError * getTransformScale(transform));
    if (depth === descriptor.tilePath.length) break;
    const child = tile.children![descriptor.tilePath[depth]];
    delete tile.content;
    delete tile.contents;
    tile.children = [child];
    tile = child;
  }
  if (placement && placement.parentGeometricError === undefined && descriptor.documentIndex !== 0)
    throw new TileConversionError(
      'MESH_GEOMETRIC_ERROR_INVALID',
      'External ancestors must declare geometricError'
    );
  const isLeaf = !tile.children?.length;
  const contentIndex = Number(descriptor.resourceId.match(/content-(\d+)$/)?.[1]);
  const content = tile.contents?.[contentIndex] ?? tile.content;
  if (!content || (content.uri ?? content.url) !== descriptor.uri)
    throw new TileConversionError(
      'INVALID_BROWSER_SELECTION',
      'Content descriptor does not match its inspected document'
    );
  tile.content = content;
  delete tile.contents;
  delete tile.children;
  if (placement)
    originalRoot.transform = multiplyMatrices(
      [...placement.parentTransform],
      normalizeMatrix(originalRoot.transform)
    );
  if (!Number.isFinite(maximum))
    throw new TileConversionError(
      'MESH_GEOMETRIC_ERROR_INVALID',
      'Scaled geometricError must remain finite'
    );
  return {
    tileset: document,
    contentUrl: resolveResourceUrl(descriptor.uri, placement?.url ?? inspection.rootUrl),
    geometricError: maximum,
    isLeaf
  };
}

/** Expands only declared JSON references; binary content is never requested during inspection. */
async function expandInspection(
  inspection: BrowserTilesetConversionInspection,
  options: BrowserTilesetConversionSourceOptions,
  maxTilesetDocuments: number,
  fetcher: typeof fetch,
  signal?: AbortSignal
): Promise<BrowserTilesetConversionInspection> {
  const documents: BrowserTilesetDocumentPlacement[] = [
    {
      url: inspection.rootUrl,
      tileset: inspection.tileset,
      parentTransform: identityMatrix(),
      parentGeometricError: 0
    }
  ];
  const resources: BrowserTilesetResourceDescriptor[] = [];
  let bytes = inspection.tilesetBytes;
  let declarations = inspection.resources.length;
  const stack = [
    {
      resources: inspection.resources,
      index: 0,
      documentIndex: 0,
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
    const placement = documents[frame.documentIndex];
    const resourceUrl = resolveResourceUrl(descriptor.uri, placement.url);
    if (!new URL(resourceUrl).pathname.toLowerCase().endsWith('.json')) {
      resources.push({...descriptor, documentIndex: frame.documentIndex});
      continue;
    }
    if (frame.ancestors.has(getDocumentKey(resourceUrl)))
      throw new TileConversionError(
        'BROWSER_TILESET_CYCLE',
        'External tileset references an active ancestor document'
      );
    if (documents.length >= maxTilesetDocuments)
      throw new TileConversionError(
        'INPUT_TILESET_COUNT_EXCEEDED',
        'Browser tileset exceeds its document limit'
      );
    let tile = placement.tileset.root!;
    for (const childIndex of descriptor.tilePath) tile = tile.children![childIndex];
    if (tile.children?.length || tile.contents?.length)
      throw new TileConversionError(
        'INVALID_BROWSER_TILESET',
        'Inspected external tilesets require one content and no child tiles'
      );
    const response = await fetcher(resourceUrl, {signal});
    const url = response.url || resourceUrl;
    if (!response.ok || frame.ancestors.has(getDocumentKey(url))) {
      await response.body?.cancel();
      throw new TileConversionError(
        response.ok ? 'BROWSER_TILESET_CYCLE' : 'BROWSER_SOURCE_FETCH_FAILED',
        'Could not inspect external tileset'
      );
    }
    const data = await readResponseBytes(response, options.maxInputBytes - bytes, signal);
    bytes += data.byteLength;
    const tileset = parseTilesetDocument(data);
    const prefix = descriptor.resourceId + '/';
    const nestedResources = collectResources(
      tileset.root,
      options.maxInputResources - declarations,
      descriptor.transform
    ).map(resource => ({...resource, resourceId: prefix + resource.resourceId, tilesetUrl: url}));
    declarations += nestedResources.length;
    let parentGeometricError: number | undefined;
    try {
      parentGeometricError = selectBrowserTilesetContent(
        {...inspection, documents},
        {...descriptor, documentIndex: frame.documentIndex}
      ).geometricError;
    } catch (error) {
      if (!(error instanceof TileConversionError) || error.code !== 'MESH_GEOMETRIC_ERROR_INVALID')
        throw error;
    }
    const documentIndex = documents.length;
    documents.push({url, tileset, parentTransform: descriptor.transform, parentGeometricError});
    stack.push({
      resources: nestedResources,
      index: 0,
      documentIndex,
      ancestors: new Set([...frame.ancestors, getDocumentKey(resourceUrl), getDocumentKey(url)])
    });
  }
  return {...inspection, resources, documents, tilesetBytes: bytes};
}

/** Conservative spectral norm bound for a finite affine placement's linear part. */
function getTransformScale(transform: readonly number[]): number {
  const columns = [0, 1, 2].map(column =>
    [0, 1, 2].reduce((total, row) => total + Math.abs(transform[column * 4 + row]), 0)
  );
  const rows = [0, 1, 2].map(row =>
    [0, 1, 2].reduce((total, column) => total + Math.abs(transform[column * 4 + row]), 0)
  );
  return Math.sqrt(Math.max(...columns)) * Math.sqrt(Math.max(...rows));
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
