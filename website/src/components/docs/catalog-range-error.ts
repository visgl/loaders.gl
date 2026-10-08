/** Identifies transport range failures that permit a bounded whole-file preview fallback. */
export function isCatalogRangeUnsupportedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  // HttpFileTransport currently exposes these failures as plain Error messages.
  return /Content-Range|range requests|HTTP 200|HTTP byte-range request expected 206, received 200/i.test(message);
}
