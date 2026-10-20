// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadonlyCRSDefinition} from '@math.gl/crs';

/**
 * Common opt-in coordinate transformation options for vector loaders.
 *
 * Loader geometry and bounds use `xy` order (x/easting or longitude first), regardless of the
 * authoritative axis order advertised by a CRS. The CRS definition itself is preserved separately
 * in metadata. When `reproject` is true, `targetCrs` defaults to WGS84 for compatibility.
 */
export type CRSReprojectionOptions = {
  /** Transform decoded coordinates into the requested output CRS. Defaults to `false`. */
  reproject?: boolean;
  /** CRS of returned coordinates. Defaults to `WGS84` when reprojection is enabled. */
  targetCrs?: ReadonlyCRSDefinition;
};

/** Stable categories for failures while an opt-in CRS transformation is being prepared. */
export type CRSReprojectionErrorCode =
  | 'missing-source-crs'
  | 'unsupported-source-crs'
  | 'unsupported-target-crs'
  | 'transformation-failed';

/** Error thrown when a requested CRS transformation cannot be performed. */
export class CRSReprojectionError extends Error {
  /** Machine-readable reason for the failed transformation request. */
  readonly code: CRSReprojectionErrorCode;
  /** Source CRS when it was discovered or supplied. */
  readonly sourceCrs?: ReadonlyCRSDefinition;
  /** Requested output CRS when it was supplied. */
  readonly targetCrs?: ReadonlyCRSDefinition;

  constructor(
    code: CRSReprojectionErrorCode,
    message: string,
    options: {
      sourceCrs?: ReadonlyCRSDefinition;
      targetCrs?: ReadonlyCRSDefinition;
      cause?: unknown;
    } = {}
  ) {
    super(message, {cause: options.cause});
    this.name = 'CRSReprojectionError';
    this.code = code;
    this.sourceCrs = options.sourceCrs;
    this.targetCrs = options.targetCrs;
  }
}
