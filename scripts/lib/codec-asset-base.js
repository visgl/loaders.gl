// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Capture the script URL at evaluation time, before asynchronous codec imports.
const fileName = typeof __filename === 'string' ? __filename.replace(/\\/g, '/') : null;
const fileNameUrl = fileName
  ? `file://${fileName.startsWith('/') ? '' : '/'}${encodeURI(fileName).replace(/#/g, '%23').replace(/\?/g, '%3F')}`
  : undefined;

/** Original script location for sidecars in classic workers and standalone bundles. */
export const __loadersCodecAssetBaseUrl =
  globalThis.__loadersWorkerUrl ||
  (typeof document !== 'undefined' && document.currentScript?.src) ||
  fileNameUrl ||
  globalThis.location?.href;
