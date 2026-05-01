// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshArrowTable} from '@loaders.gl/schema';
import type {GaussianSplats} from '../types';
import {makeGaussianSplatsArrowTable} from './splats-arrow-table';
import {
  convertAlphaByteToLinearOpacity,
  decodeQuaternionByte,
  normalizeQuaternion
} from './splat-utils';

const SPLAT_ROW_BYTE_LENGTH = 32;

/** Parses a raw `.splat` ArrayBuffer into a Mesh Arrow table. */
export function parseSPLAT(data: ArrayBuffer): MeshArrowTable {
  return makeGaussianSplatsArrowTable(parseSPLATToGaussianSplats(data));
}

/** Parses a raw `.splat` ArrayBuffer into decoded Gaussian splat values. */
export function parseSPLATToGaussianSplats(data: ArrayBuffer): GaussianSplats {
  if (data.byteLength % SPLAT_ROW_BYTE_LENGTH !== 0) {
    throw new Error(`SPLATLoader: byte length must be a multiple of ${SPLAT_ROW_BYTE_LENGTH}.`);
  }

  const splatCount = data.byteLength / SPLAT_ROW_BYTE_LENGTH;
  const dataView = new DataView(data);
  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 3);
  const opacities = new Float32Array(splatCount);

  for (let splatIndex = 0; splatIndex < splatCount; splatIndex++) {
    const byteOffset = splatIndex * SPLAT_ROW_BYTE_LENGTH;
    const positionOffset = splatIndex * 3;
    const rotationOffset = splatIndex * 4;

    positions[positionOffset + 0] = dataView.getFloat32(byteOffset + 0, true);
    positions[positionOffset + 1] = dataView.getFloat32(byteOffset + 4, true);
    positions[positionOffset + 2] = dataView.getFloat32(byteOffset + 8, true);
    scales[positionOffset + 0] = dataView.getFloat32(byteOffset + 12, true);
    scales[positionOffset + 1] = dataView.getFloat32(byteOffset + 16, true);
    scales[positionOffset + 2] = dataView.getFloat32(byteOffset + 20, true);
    colors[positionOffset + 0] = dataView.getUint8(byteOffset + 24);
    colors[positionOffset + 1] = dataView.getUint8(byteOffset + 25);
    colors[positionOffset + 2] = dataView.getUint8(byteOffset + 26);
    opacities[splatIndex] = convertAlphaByteToLinearOpacity(dataView.getUint8(byteOffset + 27));

    const [w, x, y, z] = normalizeQuaternion(
      decodeQuaternionByte(dataView.getUint8(byteOffset + 28)),
      decodeQuaternionByte(dataView.getUint8(byteOffset + 29)),
      decodeQuaternionByte(dataView.getUint8(byteOffset + 30)),
      decodeQuaternionByte(dataView.getUint8(byteOffset + 31))
    );
    rotations[rotationOffset + 0] = w;
    rotations[rotationOffset + 1] = x;
    rotations[rotationOffset + 2] = y;
    rotations[rotationOffset + 3] = z;
  }

  return {
    format: 'splat',
    splatCount,
    positions,
    scales,
    rotations,
    colors,
    opacities,
    loaderData: {
      format: 'splat',
      splatCount,
      rowByteLength: SPLAT_ROW_BYTE_LENGTH
    }
  };
}
