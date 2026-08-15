// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Normalize a Content-Type header into a lowercased media type string.
 * @param contentTypeHeader - Raw Content-Type header value.
 * @returns Lowercased media type, or null when not available.
 */
export function parseContentType(contentTypeHeader?: string | null): string | null {
  if (!contentTypeHeader) {
    return null;
  }

  const trimmedValue = contentTypeHeader.trim();
  if (!trimmedValue) {
    return null;
  }

  const contentType = trimmedValue.split(';')[0]?.trim().toLowerCase();
  return contentType || null;
}
