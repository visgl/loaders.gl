// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseRADChunkToGaussianSplats, type RADChunkDecodeOptions} from './parse-rad-chunk';
import type {GaussianSplats} from '../types';

type RADChunkWorkerRequest = {
  /** Request identifier assigned by the owning RADSource worker pool. */
  id: number;
  /** Raw RADC chunk payload. */
  data: ArrayBuffer;
  /** Decode options forwarded to the RAD chunk parser. */
  options: RADChunkDecodeOptions;
};

type RADChunkWorkerResponse = {
  /** Request identifier assigned by the owning RADSource worker pool. */
  id: number;
  /** Decoded Gaussian splat values, present when decode succeeded. */
  splats?: GaussianSplats;
  /** Error message, present when decode failed. */
  error?: string;
};

/** Decode RAD chunks off the main thread and transfer typed-array outputs back. */
self.onmessage = (event: MessageEvent<RADChunkWorkerRequest>): void => {
  const {id, data, options} = event.data;
  try {
    const splats = parseRADChunkToGaussianSplats(data, options);
    const response: RADChunkWorkerResponse = {id, splats};
    self.postMessage(response, getGaussianSplatsTransferList(splats));
  } catch (error) {
    const response: RADChunkWorkerResponse = {
      id,
      error: error instanceof Error ? error.message : String(error)
    };
    self.postMessage(response);
  }
};

/** Return every transferable ArrayBuffer owned by decoded RAD splat arrays. */
function getGaussianSplatsTransferList(splats: GaussianSplats): Transferable[] {
  const transferList: Transferable[] = [
    splats.positions.buffer,
    splats.scales.buffer,
    splats.rotations.buffer,
    splats.colors.buffer,
    splats.opacities.buffer
  ];
  if (splats.sphericalHarmonicDcs) {
    transferList.push(splats.sphericalHarmonicDcs.buffer);
  }
  if (splats.sphericalHarmonics) {
    transferList.push(splats.sphericalHarmonics.buffer);
  }
  const childCounts = splats.loaderData?.childCounts;
  if (childCounts instanceof Uint16Array) {
    transferList.push(childCounts.buffer);
  }
  const childStarts = splats.loaderData?.childStarts;
  if (childStarts instanceof Uint32Array) {
    transferList.push(childStarts.buffer);
  }
  return transferList;
}
