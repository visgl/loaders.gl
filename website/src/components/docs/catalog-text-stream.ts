/** Bounded UTF-8 content and its completion status. */
export type CatalogTextStreamPreview = {
  /** Decoded source text, retaining at most 256 KiB of source bytes. */
  readonly text: string;
  /** Whether any source bytes were omitted. */
  readonly truncated: boolean;
};

/** Reads a bounded text preview, observing EOF even when the body exactly fills the limit. */
export async function readCatalogTextStream(
  stream: ReadableStream<Uint8Array>
): Promise<CatalogTextStreamPreview> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let byteCount = 0;
  let truncated = false;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      const remainingBytes = 256 * 1024 - byteCount;
      text += decoder.decode(value.subarray(0, remainingBytes), {stream: true});
      byteCount += value.byteLength;
      if (byteCount > 256 * 1024) {
        truncated = true;
        break;
      }
    }
    text += decoder.decode();
  } finally {
    await reader.cancel().finally(() => reader.releaseLock());
  }
  return {text, truncated};
}
