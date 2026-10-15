// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Error raised when a Lance parser backend is not available. */
export class LanceDecoderUnavailableError extends Error {
  /** Creates a descriptive unavailable-decoder error. */
  constructor() {
    super('Lance decoding is not implemented yet in @loaders.gl/lance');
    this.name = 'LanceDecoderUnavailableError';
  }
}
