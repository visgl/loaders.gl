// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MD5Hash} from '@loaders.gl/crypto';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import {ZipWriter} from '@loaders.gl/zip/zip-writer';
import {ThreeTZFormat} from './tiles-3d-format';
import {VERSION} from './lib/utils/version';

/** Portable resources with canonical relative ASCII paths; JSON and content must already be valid. */
export type Tiles3DArchiveFiles = Readonly<Record<string, ArrayBuffer | Blob>>;

/** Options for the bounded, uncompressed ZIP32 3TZ writer. */
export type Tiles3DArchiveWriterOptions = WriterOptions & {
  /** 3TZ packaging options. */
  '3tz'?: {
    /** Maximum archive bytes, including ZIP headers and the index; not a peak-memory limit. */
    maxArchiveBytes?: number;
  };
};

/** Largest supported archive, below the ZIP64 sentinel. */
const MAX_ARCHIVE_BYTES = 0xfffffffe;
/** Required final uncompressed index entry. */
const INDEX_PATH = '@3dtilesIndex1@';

/**
 * Packages already-authored 3D Tiles resources as a deterministic indexed 3TZ archive.
 * Uses STORE, populated local headers, a fixed timestamp, and a final case-sensitive MD5 index.
 * Requires root tileset.json and canonical relative ASCII file paths; does not validate content
 * or external references. ZIP64, compression, streaming, and scene authoring are separate APIs.
 */
export const Tiles3DArchiveWriter = {
  ...ThreeTZFormat,
  version: VERSION,
  mimeTypes: ['application/vnd.maxar.archive.3tz+zip'],
  options: {'3tz': {maxArchiveBytes: MAX_ARCHIVE_BYTES}},
  encode: encodeArchive
} as const satisfies WriterWithEncoder<Tiles3DArchiveFiles, never, Tiles3DArchiveWriterOptions>;

/** Validates and measures every resource before reading Blobs or encoding ZIP data. */
async function encodeArchive(
  files: Tiles3DArchiveFiles,
  options: Tiles3DArchiveWriterOptions = {}
): Promise<ArrayBuffer> {
  const maxArchiveBytes = options['3tz']?.maxArchiveBytes ?? MAX_ARCHIVE_BYTES;
  if (!Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes < 0) {
    throw new RangeError('3TZ archive byte limit must be a non-negative safe integer');
  }
  // Integer-like object keys follow ECMAScript enumeration order in JSZip as well.
  const paths = Object.keys(
    Object.fromEntries(
      Object.keys(files)
        .sort()
        .map(path => [path, true])
    )
  );
  if (!paths.includes('tileset.json') || paths.length >= 0xfffe) {
    throw new RangeError('3TZ requires tileset.json and fewer than 65534 resource files');
  }
  const resources = paths.map(path => {
    if (
      path.length > 0xffff ||
      /[^\x20-\x7e]/.test(path) ||
      path.includes('\\') ||
      path.split('/').some(segment => !segment || segment === '.' || segment === '..') ||
      /\.3tz|\.3dtiles\.zip/i.test(path) ||
      path === INDEX_PATH
    ) {
      throw new TypeError(
        '3TZ requires canonical relative ASCII resource paths without nested archives'
      );
    }
    const data = files[path];
    const byteLength =
      data instanceof ArrayBuffer
        ? (Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')!.get!.call(
            data
          ) as number)
        : (Object.getOwnPropertyDescriptor(Blob.prototype, 'size')!.get!.call(data) as number);
    return {path, data, byteLength};
  });
  // ZIP32: EOCD + local/central headers + both copies of each ASCII path + index payload.
  const archiveBytes = resources.reduce(
    (total, resource) => total + 76 + 2 * resource.path.length + resource.byteLength,
    22 + 76 + 2 * INDEX_PATH.length + 24 * resources.length
  );
  if (archiveBytes > Math.min(maxArchiveBytes, MAX_ARCHIVE_BYTES)) {
    throw new RangeError('3TZ archive exceeds the configured byte limit or ZIP32 capacity');
  }

  const entries: DataView[] = [];
  const fileMap: Record<string, ArrayBuffer> = Object.create(null);
  const hash = new MD5Hash();
  let localHeaderOffset = 0;
  for (const resource of resources) {
    const data =
      resource.data instanceof ArrayBuffer
        ? resource.data
        : await Blob.prototype.arrayBuffer.call(resource.data);
    if (data.byteLength !== resource.byteLength) {
      throw new TypeError('3TZ resource size changed during packaging');
    }
    fileMap[resource.path] = data;
    const digest = await hash.hash(new TextEncoder().encode(resource.path).buffer, 'hex');
    const entry = new DataView(new ArrayBuffer(24));
    for (let index = 0; index < 16; index++) {
      entry.setUint8(index, Number.parseInt(digest.slice(index * 2, index * 2 + 2), 16));
    }
    entry.setBigUint64(16, BigInt(localHeaderOffset), true);
    entries.push(entry);
    localHeaderOffset += 30 + resource.path.length + resource.byteLength;
  }
  entries.sort(compareIndexEntries);
  const indexData = new Uint8Array(24 * entries.length);
  entries.forEach((entry, index) => indexData.set(new Uint8Array(entry.buffer), index * 24));
  fileMap[INDEX_PATH] = indexData.buffer;
  const archive = await ZipWriter.encode(fileMap, {
    jszip: {
      compression: 'STORE',
      streamFiles: false,
      platform: 'DOS',
      date: new Date('1980-01-01T00:00:00Z')
    }
  });
  if (archive.byteLength !== archiveBytes) {
    throw new Error('Unexpected 3TZ ZIP layout');
  }
  return archive;
}

/** Compares MD5 values as two little-endian unsigned 64-bit integers, per the 3TZ specification. */
function compareIndexEntries(left: DataView, right: DataView): number {
  for (const offset of [0, 8]) {
    const leftValue = left.getBigUint64(offset, true);
    const rightValue = right.getBigUint64(offset, true);
    if (leftValue !== rightValue) return leftValue < rightValue ? -1 : 1;
  }
  return 0;
}
