// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GZipCompressor} from '@loaders.gl/compression';
import {zxyToTileId} from 'pmtiles';
import type {PMTilesEncodeOptions, PMTilesTileInput} from '../pmtiles-writer-types';

/** PMTiles v3 has a fixed header and a root constrained to the first 16 KiB. */
const HEADER_BYTES = 127;
const MAX_ROOT_BYTES = 16384 - HEADER_BYTES;
/** Payload type values defined by the PMTiles v3 specification. */
const TILE_TYPES = {mvt: 1, png: 2, jpeg: 3, webp: 4, avif: 5, mlt: 6} as const;
/** Compression values describe existing payload bytes or encoded internal sections. */
const COMPRESSIONS = {none: 1, gzip: 2, brotli: 3, zstd: 4} as const;

/** One directory entry with offsets relative to its associated data section. */
interface DirectoryEntry {
  /** Hilbert tile ID, exact within the supported zoom range. */
  readonly tileId: number;
  /** Relative byte offset. */
  readonly offset: number;
  /** Nonzero byte length. */
  readonly length: number;
  /** One for a tile, zero for a leaf directory. */
  readonly runLength: number;
}

/** A snapshot of a caller's tile payload, sorted independently of input ordering. */
interface EncodedTile {
  /** Hilbert tile address. */
  readonly tileId: number;
  /** Owned payload bytes. */
  readonly bytes: Uint8Array<ArrayBuffer>;
}

/**
 * Packages explicit encoded XYZ tiles into a deterministic PMTiles v3 ArrayBuffer.
 * Input payloads are opaque and must all match the declared format and compression.
 * The input snapshots and complete output coexist in memory; this is not an out-of-core writer.
 */
export async function encodePMTiles(
  input: PMTilesTileInput,
  options?: PMTilesEncodeOptions
): Promise<ArrayBuffer> {
  options?.signal?.throwIfAborted();
  if (!options || !Object.hasOwn(TILE_TYPES, options.tileType))
    throw new TypeError('PMTiles requires a supported tileType');
  options = {
    ...options,
    bounds: options.bounds?.slice() as PMTilesEncodeOptions['bounds'],
    center: options.center?.slice() as PMTilesEncodeOptions['center']
  };
  const tileCompression = options.tileCompression ?? 'none';
  const internalCompression = options.internalCompression ?? 'none';
  if (
    !Object.hasOwn(COMPRESSIONS, tileCompression) ||
    !['none', 'gzip'].includes(internalCompression)
  )
    throw new TypeError('Unsupported PMTiles compression');
  const maxTiles = validateLimit(options.maxTiles ?? 100000, 'tile');
  const maxOutputBytes = validateLimit(options.maxOutputBytes ?? 256 * 1024 * 1024, 'output');
  const maxMetadataBytes = validateLimit(options.maxMetadataBytes ?? 1024 * 1024, 'metadata');
  const metadata = encodeMetadata(
    options.metadata ?? {},
    options.tileType === 'mvt',
    maxMetadataBytes
  );
  const tiles: EncodedTile[] = [];
  const tileIds = new Set<number>();
  const bounds: [number, number, number, number] = [180, 90, -180, -90];
  let minZoom = 26;
  let maxZoom = 0;
  let payloadBytes = 0;
  for await (const tile of input) {
    options.signal?.throwIfAborted();
    if (tiles.length >= maxTiles) throw new RangeError('PMTiles tile limit exceeded');
    if (
      !Number.isInteger(tile.z) ||
      tile.z < 0 ||
      tile.z > 26 ||
      !Number.isInteger(tile.x) ||
      !Number.isInteger(tile.y) ||
      tile.x < 0 ||
      tile.y < 0 ||
      tile.x >= 2 ** tile.z ||
      tile.y >= 2 ** tile.z
    )
      throw new RangeError('Invalid PMTiles XYZ tile coordinate');
    const tileId = zxyToTileId(tile.z, tile.x, tile.y);
    if (tileIds.has(tileId)) throw new Error('Duplicate PMTiles tile coordinate');
    const data = tile.data;
    if (!(data instanceof Blob) && !(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data))
      throw new TypeError('PMTiles tile data must be a Blob, ArrayBuffer or typed-array view');
    const size = data instanceof Blob ? data.size : data.byteLength;
    if (!size) throw new RangeError('PMTiles tile payload must be nonempty');
    payloadBytes += size;
    if (HEADER_BYTES + payloadBytes > maxOutputBytes)
      throw new RangeError('PMTiles output limit exceeded');
    const bytes =
      data instanceof Blob
        ? new Uint8Array(await data.arrayBuffer())
        : data instanceof ArrayBuffer
          ? new Uint8Array(data).slice()
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
    options.signal?.throwIfAborted();
    tileIds.add(tileId);
    tiles.push({tileId, bytes});
    minZoom = Math.min(minZoom, tile.z);
    maxZoom = Math.max(maxZoom, tile.z);
    const width = 2 ** tile.z;
    bounds[0] = Math.min(bounds[0], (tile.x / width) * 360 - 180);
    bounds[1] = Math.min(bounds[1], getLatitude((tile.y + 1) / width));
    bounds[2] = Math.max(bounds[2], ((tile.x + 1) / width) * 360 - 180);
    bounds[3] = Math.max(bounds[3], getLatitude(tile.y / width));
  }
  if (!tiles.length) throw new RangeError('PMTiles requires at least one tile');
  const outputBounds = options.bounds ?? bounds;
  validateBounds(outputBounds);
  const center = options.center ?? [
    (outputBounds[0] + outputBounds[2]) / 2,
    (outputBounds[1] + outputBounds[3]) / 2,
    minZoom
  ];
  if (
    center.length !== 3 ||
    !Number.isFinite(center[0]) ||
    Math.abs(center[0]) > 180 ||
    !Number.isFinite(center[1]) ||
    Math.abs(center[1]) > 90 ||
    !Number.isInteger(center[2]) ||
    center[2] < minZoom ||
    center[2] > maxZoom
  )
    throw new RangeError('Invalid PMTiles center');
  tiles.sort((first, second) => first.tileId - second.tileId);
  let offset = 0;
  const entries = tiles.map(tile => {
    const entry = {tileId: tile.tileId, offset, length: tile.bytes.byteLength, runLength: 1};
    offset += entry.length;
    return entry;
  });
  /** Compresses internal sections with the shared first-party codec, when requested. */
  const compress = async (bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
    options.signal?.throwIfAborted();
    const result =
      internalCompression === 'gzip'
        ? new Uint8Array(await new GZipCompressor().compress(bytes.buffer))
        : bytes;
    options.signal?.throwIfAborted();
    return result;
  };
  let root = await compress(encodeDirectory(entries));
  const leaves: Uint8Array<ArrayBuffer>[] = [];
  let leafBytes = 0;
  if (root.byteLength > MAX_ROOT_BYTES) {
    const pointers: DirectoryEntry[] = [];
    // Bound root entries even at zoom 26 with large offset varints.
    const entriesPerLeaf = Math.max(1024, Math.ceil(entries.length / 512));
    for (let index = 0; index < entries.length; index += entriesPerLeaf) {
      const leaf = await compress(encodeDirectory(entries.slice(index, index + entriesPerLeaf)));
      pointers.push({
        tileId: entries[index].tileId,
        offset: leafBytes,
        length: leaf.byteLength,
        runLength: 0
      });
      leaves.push(leaf);
      leafBytes += leaf.byteLength;
      if (HEADER_BYTES + leafBytes + payloadBytes > maxOutputBytes)
        throw new RangeError('PMTiles output limit exceeded');
    }
    root = await compress(encodeDirectory(pointers));
  }
  if (root.byteLength > MAX_ROOT_BYTES)
    throw new RangeError('PMTiles root directory limit exceeded');
  const encodedMetadata = await compress(metadata);
  const metadataOffset = HEADER_BYTES + root.byteLength;
  const leafOffset = metadataOffset + encodedMetadata.byteLength;
  const tileOffset = leafOffset + leafBytes;
  const outputLength = tileOffset + payloadBytes;
  if (outputLength > maxOutputBytes) throw new RangeError('PMTiles output limit exceeded');
  const output = new Uint8Array(outputLength);
  output.set(new TextEncoder().encode('PMTiles'));
  output[7] = 3;
  const header = new DataView(output.buffer);
  const fields = [
    HEADER_BYTES,
    root.byteLength,
    metadataOffset,
    encodedMetadata.byteLength,
    leafOffset,
    leafBytes,
    tileOffset,
    payloadBytes,
    tiles.length,
    tiles.length,
    tiles.length
  ];
  fields.forEach((value, index) => header.setBigUint64(8 + index * 8, BigInt(value), true));
  output.set(
    [
      1,
      COMPRESSIONS[internalCompression],
      COMPRESSIONS[tileCompression],
      TILE_TYPES[options.tileType],
      minZoom,
      maxZoom
    ],
    96
  );
  outputBounds.forEach((value, index) =>
    header.setInt32(102 + index * 4, Math.round(value * 1e7), true)
  );
  output[118] = center[2];
  header.setInt32(119, Math.round(center[0] * 1e7), true);
  header.setInt32(123, Math.round(center[1] * 1e7), true);
  offset = HEADER_BYTES;
  for (const section of [root, encodedMetadata, ...leaves, ...tiles.map(tile => tile.bytes)]) {
    output.set(section, offset);
    offset += section.byteLength;
  }
  options.signal?.throwIfAborted();
  return output.buffer;
}

/** Serializes directory columns with delta tile IDs and contiguous offset markers. */
function encodeDirectory(entries: readonly DirectoryEntry[]): Uint8Array<ArrayBuffer> {
  const bytes: number[] = [];
  writeVarint(bytes, entries.length);
  let previousTileId = 0;
  for (const entry of entries) {
    writeVarint(bytes, entry.tileId - previousTileId);
    previousTileId = entry.tileId;
  }
  for (const entry of entries) writeVarint(bytes, entry.runLength);
  for (const entry of entries) writeVarint(bytes, entry.length);
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const previous = entries[index - 1];
    writeVarint(
      bytes,
      previous && entry.offset === previous.offset + previous.length ? 0 : entry.offset + 1
    );
  }
  return Uint8Array.from(bytes);
}

/** Writes unsigned base-128 varints without 32-bit truncation of zoom-26 IDs. */
function writeVarint(output: number[], value: number): void {
  while (value >= 128) {
    output.push((value % 128) + 128);
    value = Math.floor(value / 128);
  }
  output.push(value);
}

/** Checks configurable budgets before consuming the caller's tile iterator. */
function validateLimit(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new RangeError(`Invalid PMTiles ${name} limit`);
  return value;
}

/** Validates geographic bounds independently of tile-local payload coordinates. */
function validateBounds(bounds: readonly number[]): void {
  if (
    bounds.length !== 4 ||
    bounds.some(value => !Number.isFinite(value)) ||
    Math.abs(bounds[0]) > 180 ||
    Math.abs(bounds[2]) > 180 ||
    Math.abs(bounds[1]) > 90 ||
    Math.abs(bounds[3]) > 90 ||
    bounds[0] > bounds[2] ||
    bounds[1] > bounds[3]
  )
    throw new RangeError('Invalid PMTiles bounds');
}

/** Converts a normalized Web Mercator tile edge to latitude. */
function getLatitude(value: number): number {
  return (Math.atan(Math.sinh(Math.PI * (1 - 2 * value))) * 180) / Math.PI;
}

/** Encodes a JSON object and enforces MVT's required TileJSON layer declarations. */
function encodeMetadata(
  metadata: Readonly<Record<string, unknown>>,
  mvt: boolean,
  limit: number
): Uint8Array<ArrayBuffer> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
    throw new TypeError('PMTiles metadata must be a JSON object');
  const json = JSON.stringify(metadata);
  const normalized = JSON.parse(json);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized))
    throw new TypeError('PMTiles metadata must serialize to a JSON object');
  if (mvt || normalized.vector_layers !== undefined) {
    const layers = normalized.vector_layers;
    const ids = new Set<string>();
    if (!Array.isArray(layers) || !layers.length)
      throw new TypeError('PMTiles vector_layers must declare at least one layer');
    for (const layer of layers) {
      if (
        !layer ||
        typeof layer.id !== 'string' ||
        !layer.id ||
        ids.has(layer.id) ||
        !layer.fields ||
        typeof layer.fields !== 'object' ||
        Array.isArray(layer.fields) ||
        Object.values(layer.fields).some(
          value => !['String', 'Number', 'Boolean'].includes(value as string)
        )
      )
        throw new TypeError('Invalid PMTiles vector_layers declaration');
      ids.add(layer.id);
    }
  }
  const bytes = new TextEncoder().encode(json);
  if (bytes.byteLength > limit) throw new RangeError('PMTiles metadata limit exceeded');
  return bytes;
}
