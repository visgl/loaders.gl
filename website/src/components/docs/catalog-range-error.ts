/** Identifies transport range failures that permit a bounded whole-file preview fallback. */
export function isCatalogRangeUnsupportedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  // HttpFileTransport and ParquetRangeFile expose plain Errors with this shared status wording.
  return /Content-Range|range requests|HTTP 200\b|expected 206, received 200\b/i.test(message);
}
