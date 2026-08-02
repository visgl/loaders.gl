// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import * as path from './path';

const URI_SCHEME_PATTERN = /^[a-z][0-9a-z+.-]*:/i;

/**
 * Resolves resource URIs against one stable base while caching repeated derivations.
 *
 * The base URL is parsed once. Resolved strings are cached for the lifetime of the resolver, which
 * is intended to match one source or metadata parse. This avoids repeated base parsing for large
 * resource trees without introducing a process-wide cache or retaining unrelated datasets.
 */
export class CachedUriResolver {
  /** Original filesystem path or URI base used for non-URL resolution. */
  private readonly basePath: string;
  /** Parsed URL base, retained when the base uses an RFC 3986 scheme. */
  private readonly baseUrl?: URL;
  /** Resolved URI strings keyed by their source-relative spelling. */
  private readonly resolvedUris: Map<string, string> = new Map();

  /**
   * Creates a resolver scoped to one resource hierarchy.
   *
   * @param basePath - Directory path or absolute base URI.
   */
  constructor(basePath: string) {
    this.basePath = basePath;
    if (URI_SCHEME_PATTERN.test(basePath)) {
      this.baseUrl = new URL(basePath.endsWith('/') ? basePath : `${basePath}/`);
    }
  }

  /**
   * Resolves a relative or absolute resource identifier.
   *
   * URL bases follow the platform `URL` implementation and are decoded to preserve the existing
   * loaders.gl 3D Tiles behavior. Filesystem-like bases continue to use loaders.gl path semantics.
   * Repeated calls with the same source string return the previously resolved string.
   *
   * @param uri - Relative path, absolute path, data URL, or absolute URI.
   * @returns Absolute or base-relative resource identifier.
   */
  resolve(uri: string): string {
    const cachedUri = this.resolvedUris.get(uri);
    if (cachedUri) {
      return cachedUri;
    }

    let resolvedUri: string;
    if (this.baseUrl) {
      resolvedUri = decodeURI(new URL(uri, this.baseUrl).toString());
    } else if (uri.startsWith('/')) {
      resolvedUri = uri;
    } else {
      resolvedUri = path.resolve(this.basePath, uri);
    }

    this.resolvedUris.set(uri, resolvedUri);
    return resolvedUri;
  }

  /** Clears derived URI strings while retaining the parsed base URL. */
  clear(): void {
    this.resolvedUris.clear();
  }
}
