// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export class FetchError extends Error {
  constructor(message: string, info: {url: string; reason: string; response?: Response}) {
    super(message);
    this.reason = info.reason;
    this.url = info.url;
    this.response = info.response;
  }
  /** A best effort reason for why the fetch failed */
  reason: string;
  /** The URL that failed to load. Empty string if not available. */
  url: string;
  /** The Response object, if any. */
  response?: Response;
}
