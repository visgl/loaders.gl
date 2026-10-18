// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {COPCSourceLoader} from '@loaders.gl/copc';
import type {COPCTileSource, COPCSourceLoaderOptions} from '@loaders.gl/copc';
import {PotreeSourceLoader, encodePotreeDataset} from '@loaders.gl/potree';
import type {
  PotreeDataset,
  PotreeWriterNode,
  PotreeWriterOptions,
  PotreeSourceLoaderOptions
} from '@loaders.gl/potree';
import type {Mesh, MeshArrowTable, MeshGeometry} from '@loaders.gl/core/schema';
import {deduceMeshSchema} from '@loaders.gl/core/schema-utils';
import {encodeZip, openZipArchive} from '@loaders.gl/zip';
import type {ZipArchive, ZipEntry} from '@loaders.gl/zip';

/** Explicit local-file input; no format is inferred from an extension. */
export type OpenPointCloudFileOptions = {
  /** Maximum retained input Blob size. This does not bound decoded heap. */
  readonly maxFileBytes: number;
  /** Cancellation before/after initialization and during archived resource reads. */
  readonly signal?: AbortSignal;
} & (
  | {
      /** COPC is a native single LAZ file. */
      readonly format: 'copc';
      /** Existing COPC source coordinate and decoder controls. */
      readonly sourceOptions?: COPCSourceLoaderOptions;
    }
  | {
      /** A loaders.gl STORE ZIP convention, not a native Potree archive standard. */
      readonly format: 'potree-zip';
      /** Maximum ZIP entry count, including metadata; default 100000. */
      readonly maxEntries?: number;
      /** Maximum requested ZIP resource/range bytes; default 64 MiB. */
      readonly maxResourceBytes?: number;
      /** Explicit metadata path when it is not at the ZIP root. */
      readonly metadataPath?: string;
      /** Existing Potree parser controls; the bundle owns its isolated fetch transport. */
      readonly sourceOptions?: PotreeSourceLoaderOptions;
    }
);

/** An initialized source with an owned local file lifetime. */
export interface OpenedPointCloudFile {
  /** Lazy node access through the existing unified source APIs. */
  readonly source: ReturnType<typeof PotreeSourceLoader.createDataSource> | COPCTileSource;
  /** Closes the source and rejects subsequent bundle reads; idempotent. */
  readonly close: () => Promise<void>;
}

/** Complete Potree dataset packaging controls. */
export interface EncodePotreeArchiveOptions {
  /** Existing dataset version, precision, hierarchy and encoded-byte limits. */
  readonly potree?: PotreeWriterOptions['potree'];
  /** Maximum completed STORE ZIP32 bytes, checked before archive allocation. */
  readonly maxArchiveBytes: number;
}

/**
 * Writes a complete Potree 1.x/2.0 dataset to a deterministic uncompressed ZIP32 Blob.
 * This is a loaders.gl bundle convention, not a native Potree archive standard. Metadata sits
 * at the root with original relative resource paths. Writer version/attribute/precision gates
 * apply. Inputs, dataset bytes, ZIP temporaries and the returned Blob are separate memory.
 * @param input - Decoded points or caller-organized additive nodes; no LOD sampling is inferred.
 * @param options - Dataset writer controls and final archive budget.
 * @returns A downloadable ZIP Blob that openPointCloudFile can read incrementally.
 */
export async function encodePotreeArchive(
  input: Mesh | MeshArrowTable | readonly PotreeWriterNode[],
  options: EncodePotreeArchiveOptions
): Promise<Blob> {
  validateLimit(options.maxArchiveBytes);
  const dataset = await encodePotreeDataset(input, {potree: options.potree});
  return encodePotreeDatasetArchive(dataset, options.maxArchiveBytes, options.potree?.signal);
}

/** Packages already encoded Potree files without encoding or sampling points a second time. */
export async function encodePotreeDatasetArchive(
  dataset: PotreeDataset,
  maxArchiveBytes: number,
  signal?: AbortSignal
): Promise<Blob> {
  validateLimit(maxArchiveBytes);
  for (const path of dataset.files.keys()) validatePath(path);
  signal?.throwIfAborted();
  const archive = await encodeZip(Object.fromEntries(dataset.files), {
    compression: 'store',
    zip64: 'never',
    maxEntries: 65535,
    maxArchiveBytes: BigInt(maxArchiveBytes),
    signal
  });
  signal?.throwIfAborted();
  return new Blob([archive], {type: 'application/zip'});
}

/**
 * Opens a COPC Blob or a Potree STORE ZIP without extracting the complete dataset.
 * ZIP directory/local headers are checked before constructing the Potree source; modern node
 * requests slice only their archived byte ranges. DEFLATE, encrypted entries, ambiguous
 * metadata and noncanonical paths fail explicitly. Partial reads do not verify whole-entry CRCs.
 * Legacy Potree retains its existing coordinate behavior; modern Potree retains native coordinates.
 * COPC uses its existing source coordinate policy. Applications own CRS preparation and conversion.
 * @param input - Immutable local file/Blob, bounded by maxFileBytes.
 * @param options - Explicit format, source controls and archive transport limits.
 * @returns An initialized lazy source; close it when conversion finishes.
 */
export async function openPointCloudFile(
  input: Blob,
  options: OpenPointCloudFileOptions
): Promise<OpenedPointCloudFile> {
  validateLimit(options.maxFileBytes);
  if (input.size > options.maxFileBytes) throw new RangeError('Point file input budget exceeded');
  options.signal?.throwIfAborted();
  if (options.format === 'copc') {
    const source = COPCSourceLoader.createDataSource(input, options.sourceOptions || {});
    try {
      await source.metadata;
      options.signal?.throwIfAborted();
      return {source, close: () => source.close()};
    } catch (error) {
      await source.close();
      throw error;
    }
  }
  if (options.format !== 'potree-zip') throw new TypeError('Unsupported point file format');
  const maxEntries = options.maxEntries ?? 100000;
  const maxResourceBytes = options.maxResourceBytes ?? 64 * 1024 * 1024;
  validateLimit(maxEntries);
  validateLimit(maxResourceBytes);
  const controller = new AbortController();
  const signals = [controller.signal, options.signal, options.sourceOptions?.potree?.signal].filter(
    (value): value is AbortSignal => Boolean(value)
  );
  const signal = AbortSignal.any(signals);
  let archive: ZipArchive | undefined;
  const entries = new Map<string, ZipEntry>();
  let source: ReturnType<typeof PotreeSourceLoader.createDataSource> | undefined;
  try {
    archive = await openZipArchive(input, {
      maxArchiveBytes: BigInt(options.maxFileBytes),
      maxEntries,
      maxReadBytes: Math.max(65557, maxResourceBytes),
      maxCompressedBytes: BigInt(maxResourceBytes),
      maxDecodedBytes: BigInt(maxResourceBytes),
      signal
    });
    for await (const entry of archive.entries()) {
      if (entry.directory) continue;
      validatePath(entry.path);
      if (entry.compression !== 'store')
        throw new Error('Potree bundles require unencrypted STORE entries');
      entries.set(entry.path, entry);
    }
    const candidates = ['metadata.json', 'cloud.js'].filter(path => entries.has(path));
    const metadataPath = options.metadataPath || (candidates.length === 1 ? candidates[0] : '');
    validatePath(metadataPath);
    if (!entries.has(metadataPath) || !/(^|\/)(metadata\.json|cloud\.js)$/.test(metadataPath))
      throw new Error('Potree ZIP requires one metadata entry or an explicit metadataPath');
    const prefix = 'https://point-bundle.loaders.gl.invalid/';
    /** Isolated archive transport; it never falls back to network access. */
    const fetchResource = async (
      resource: string,
      request: RequestInit = {}
    ): Promise<Response> => {
      signal.throwIfAborted();
      request.signal?.throwIfAborted();
      const url = new URL(resource);
      if (url.origin !== new URL(prefix).origin || url.search || url.hash)
        throw new Error('Resource outside the Potree bundle');
      const path = decodeURIComponent(url.pathname.slice(1));
      validatePath(path);
      const entry = entries.get(path);
      if (!entry) throw new Error(`Missing Potree bundle resource: ${path}`);
      const range = new Headers(request.headers).get('range');
      const match = range?.match(/^bytes=(\d+)-(\d+)$/);
      if (range && !match) throw new RangeError('Unsupported Potree bundle byte range');
      const begin = match ? Number(match[1]) : 0;
      const end = match ? Number(match[2]) + 1 : Number(entry.size);
      if (
        !Number.isSafeInteger(begin) ||
        !Number.isSafeInteger(end) ||
        begin < 0 ||
        end < begin ||
        BigInt(end) > entry.size ||
        end - begin > maxResourceBytes
      )
        throw new RangeError('Potree bundle resource/range budget exceeded');
      const headers = new Headers({
        'content-length': String(end - begin),
        'accept-ranges': 'bytes'
      });
      if (match) headers.set('content-range', `bytes ${begin}-${end - 1}/${entry.size}`);
      const bytes = match
        ? await archive!.readRange(entry, {
            start: BigInt(begin),
            end: BigInt(end),
            signal: request.signal ?? undefined
          })
        : await archive!.read(entry, {signal: request.signal ?? undefined});
      const response = new Response(bytes, {
        status: match ? 206 : 200,
        headers
      });
      Object.defineProperty(response, 'url', {value: url.href});
      signal.throwIfAborted();
      return response;
    };
    source = PotreeSourceLoader.createDataSource(`${prefix}${metadataPath}`, {
      ...options.sourceOptions,
      core: {...options.sourceOptions?.core, fetch: fetchResource},
      potree: {...options.sourceOptions?.potree, signal}
    });
    await source.initialize();
    signal.throwIfAborted();
    return {
      source,
      async close() {
        controller.abort();
        source?.close();
        await archive?.close();
      }
    };
  } catch (error) {
    controller.abort();
    source?.close();
    await archive?.close();
    throw error;
  }
}

/** Explicit opt-in mesh-to-point selection. */
export interface ExtractMeshVerticesOptions {
  /** Attribute names to retain in addition to POSITION; all other semantics are omitted explicitly. */
  readonly attributes: readonly string[];
  /** Maximum stored vertices, not expanded triangle corners. */
  readonly maxPoints: number;
}

/**
 * Harvests one point per stored vertex from already placed triangle geometry.
 * Does not expand indices, deduplicate coincident vertices or sample triangle interiors. Output
 * shares immutable attribute arrays. Materials, features, topology and unselected attributes are
 * discarded by this explicit opt-in; select compatible attributes before destination encoding.
 * For tiles, use the mesh source adapters first so node/RTC/tile transforms are applied once.
 * @param mesh - Decoded triangle geometry in the desired absolute coordinate frame.
 * @param options - Explicit retained attributes and stored-vertex count budget.
 * @returns An unindexed point Mesh ready for point-cloud writers or the dynamic tiler.
 */
export function extractMeshVertices(mesh: MeshGeometry, options: ExtractMeshVerticesOptions): Mesh {
  validateLimit(options.maxPoints);
  const position = mesh.attributes.POSITION;
  const pointCount = position?.value.length / 3;
  if (
    mesh.topology !== 'triangle-list' ||
    mesh.mode !== 4 ||
    !position ||
    position.size !== 3 ||
    position.normalized ||
    position.transform ||
    position.byteStride ||
    position.byteOffset ||
    !(position.value instanceof Float32Array || position.value instanceof Float64Array) ||
    !Number.isSafeInteger(pointCount) ||
    pointCount > options.maxPoints ||
    position.value.some(value => !Number.isFinite(value))
  )
    throw new Error(
      'Mesh vertex harvesting requires packed finite triangle XYZ within the point budget'
    );
  const attributes: MeshGeometry['attributes'] = {POSITION: position};
  for (const name of options.attributes) {
    const attribute = mesh.attributes[name];
    if (
      !attribute ||
      attribute.transform ||
      attribute.byteStride ||
      attribute.byteOffset ||
      !Number.isSafeInteger(attribute.size) ||
      attribute.size < 1 ||
      attribute.value.length !== pointCount * attribute.size
    )
      throw new Error(`Invalid selected mesh vertex attribute: ${name}`);
    attributes[name] = attribute;
  }
  return {topology: 'point-list', mode: 0, attributes, schema: deduceMeshSchema(attributes)};
}

/** Rejects unsafe or unsupported archive paths before URL resolution. */
function validatePath(path: string): void {
  if (
    !path ||
    !/^[A-Za-z0-9_.\/-]+$/.test(path) ||
    path.split('/').some(part => !part || part === '.' || part === '..')
  )
    throw new Error('Potree bundle paths must be canonical relative ASCII paths');
}

/** Validates caller budgets before file reads or output allocation. */
function validateLimit(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new RangeError('Point file limits must be positive safe integers');
}
