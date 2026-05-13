// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DeserializeOptions} from 'bson';
import * as BSON from 'bson';

export type ParseBSONOptions = DeserializeOptions & {
  /**
   * How to handle files that concatenate multiple BSON documents, such as Mongo dump files.
   * The default is `error` to avoid silently dropping documents.
   */
  concatenatedDocuments?: 'error' | 'first';
};

/**
 * Parses a BSON binary payload synchronously.
 * @param value - BSON-encoded binary data.
 * @param options - BSON deserialization options.
 * @returns Parsed BSON document.
 */
export function parseBSONSync(
  value: ArrayBuffer,
  options?: ParseBSONOptions
): Record<string, unknown> {
  const documentArrayBuffer = getBSONDocumentArrayBuffer(value, options);
  const {concatenatedDocuments: _concatenatedDocuments, ...deserializeOptions} = options || {};
  const parsedData = BSON.deserialize(new Uint8Array(documentArrayBuffer), deserializeOptions);
  return parsedData;
}

/**
 * Returns the single BSON document to parse from a binary payload.
 *
 * BSON files start with a 32-bit little-endian byte length. Mongo dump files
 * often concatenate many BSON documents back-to-back, which is valid dump data
 * but not a single BSON document. By default this preflight keeps the loader
 * error tied to the actual format mismatch. Callers that intentionally want a
 * preview can opt into parsing the first document only.
 */
function getBSONDocumentArrayBuffer(value: ArrayBuffer, options?: ParseBSONOptions): ArrayBuffer {
  if (value.byteLength < 5) {
    throw new Error(
      `BSONLoader: expected at least 5 bytes for a BSON document, received ${value.byteLength}`
    );
  }

  const dataView = new DataView(value);
  const documentSize = dataView.getInt32(0, true);
  if (documentSize === value.byteLength) {
    return value;
  }

  if (documentSize > 0 && documentSize < value.byteLength) {
    const documentCount = countConcatenatedBSONDocuments(value);
    if (documentCount > 1) {
      if (options?.concatenatedDocuments === 'first') {
        return value.slice(0, documentSize);
      }

      throw new Error(
        `BSONLoader: detected a concatenated BSON dump with ${documentCount} documents. ` +
          'BSONLoader parses one BSON document by default; set bson.concatenatedDocuments to "first" to parse only the first document.'
      );
    }
  }

  throw new Error(
    `BSONLoader: BSON document declares ${documentSize} bytes, but the buffer contains ${value.byteLength} bytes`
  );
}

/**
 * Counts BSON documents when the buffer is a clean concatenation of documents.
 */
function countConcatenatedBSONDocuments(value: ArrayBuffer): number {
  const dataView = new DataView(value);
  let documentCount = 0;
  let byteOffset = 0;

  while (byteOffset < value.byteLength) {
    if (byteOffset + 4 > value.byteLength) {
      return 0;
    }

    const documentSize = dataView.getInt32(byteOffset, true);
    if (documentSize <= 0 || byteOffset + documentSize > value.byteLength) {
      return 0;
    }

    documentCount++;
    byteOffset += documentSize;
  }

  return byteOffset === value.byteLength ? documentCount : 0;
}
