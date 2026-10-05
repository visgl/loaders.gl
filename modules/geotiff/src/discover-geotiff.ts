// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Explicit asset detection options; callers classify STAC documents before probing assets. */
export type DiscoverGeoTIFFOptions = {
  /** Caller-supplied transport and authentication policy. */
  fetch?: typeof fetch;
  /** Cancellation for the detection request. */
  signal?: AbortSignal;
  /** Caller-supplied headers. */
  headers?: HeadersInit;
};

/** Detects classic TIFF or BigTIFF magic, without claiming cloud optimization. */
export function isTIFFHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  const littleEndian = bytes[0] === 73 && bytes[1] === 73;
  const bigEndian = bytes[0] === 77 && bytes[1] === 77;
  if (!littleEndian && !bigEndian) return false;
  const version = littleEndian ? bytes[2] + bytes[3] * 256 : bytes[2] * 256 + bytes[3];
  if (version === 42) return true;
  if (version !== 43 || bytes.length < 8) return false;
  return littleEndian
    ? bytes[4] === 8 && bytes[5] === 0 && bytes[6] === 0 && bytes[7] === 0
    : bytes[4] === 0 && bytes[5] === 8 && bytes[6] === 0 && bytes[7] === 0;
}

/** Probes one explicitly selected asset using an eight-byte range; rejects servers ignoring Range. */
export async function discoverGeoTIFF(
  url: string,
  options: DiscoverGeoTIFFOptions = {}
): Promise<boolean> {
  options.signal?.throwIfAborted();
  const headers = new Headers(options.headers);
  headers.set('Range', 'bytes=0-7');
  const response = await (options.fetch ?? globalThis.fetch)(url, {
    headers,
    signal: options.signal
  });
  if (response.status !== 206) {
    await response.body?.cancel();
    throw new Error('Bounded TIFF detection requires a 206 byte-range response');
  }
  const contentRange = response.headers.get('Content-Range');
  if (contentRange && !/^bytes 0-[0-7]\/\d+$/.test(contentRange)) {
    await response.body?.cancel();
    throw new Error('Invalid TIFF detection content range');
  }
  if (!response.body) return false;
  const reader = response.body.getReader();
  const prefix = new Uint8Array(8);
  let length = 0;
  try {
    while (length < prefix.length) {
      options.signal?.throwIfAborted();
      const chunk = await reader.read();
      if (chunk.done) break;
      if (length + chunk.value.byteLength > prefix.length)
        throw new Error('TIFF detection response exceeds eight-byte budget');
      prefix.set(chunk.value, length);
      length += chunk.value.byteLength;
    }
    options.signal?.throwIfAborted();
    return isTIFFHeader(prefix.subarray(0, length));
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
