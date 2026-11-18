// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Reads a bounded exact byte-range response without requiring total-size discovery. */
export async function readRangeResponse(
  response: Response,
  offset: number | bigint,
  length: number,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (
    (typeof offset === 'number' && (!Number.isSafeInteger(offset) || offset < 0)) ||
    (typeof offset === 'bigint' && offset < 0n) ||
    !Number.isSafeInteger(length) ||
    length <= 0
  ) {
    await response.body?.cancel().catch(() => {});
    throw new RangeError('Invalid HTTP byte range');
  }
  const start = BigInt(offset);
  const end = start + BigInt(length) - 1n;
  const value = response.headers.get('Content-Range');
  const match = value === null ? null : /^bytes (\d+)-(\d+)\/(\d+|\*)$/.exec(value);
  // CORS may hide metadata while still allowing a safelisted single Range.
  // Never treat empty/malformed visible metadata as an absent header.
  if (
    response.status !== 206 ||
    (value !== null &&
      (!match ||
        BigInt(match[1]) !== start ||
        BigInt(match[2]) !== end ||
        (match[3] !== '*' && BigInt(match[3]) <= end)))
  ) {
    await response.body?.cancel().catch(() => {});
    throw new Error('HTTP range requires 206 and matching Content-Range when visible');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('HTTP range response has no body');
  let received = 0;
  const abort = () => {
    void reader.cancel(signal?.reason).catch(() => {});
  };
  signal?.addEventListener('abort', abort, {once: true});
  try {
    signal?.throwIfAborted();
    const bytes = new Uint8Array(length);
    for (;;) {
      const chunk = await reader.read();
      signal?.throwIfAborted();
      if (chunk.done) break;
      if (received + chunk.value.byteLength > length)
        throw new Error('HTTP range body exceeds requested length');
      bytes.set(chunk.value, received);
      received += chunk.value.byteLength;
    }
    if (received !== length) throw new Error('HTTP range body has truncated length');
    return bytes;
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}
