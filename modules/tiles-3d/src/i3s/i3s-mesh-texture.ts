// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getBinaryImageMetadata} from '@loaders.gl/images';
import type {MeshAttribute} from '@loaders.gl/schema';

/** Encoded base-color image and the supported glTF UV/sampling controls. */
export interface I3SMeshTexture {
  /** PNG or JPEG bytes; only the selected typed-array view is copied. */
  readonly data: Uint8Array;
  /** Image format validated against the encoded header. */
  readonly mimeType: 'image/png' | 'image/jpeg';
  /** Wrapping controls; explicit filtering cannot be represented by this I3S profile. */
  readonly sampler?: {
    /** Horizontal wrapping. */ readonly wrapS?: 33071 | 33648 | 10497;
    /** Vertical wrapping. */ readonly wrapT?: 33071 | 33648 | 10497;
    /** Explicit magnification is rejected. */ readonly magFilter?: number;
    /** Explicit minification is rejected. */ readonly minFilter?: number;
  };
  /** UV transform baked into the encoded texture coordinates. */
  readonly transform?: {
    /** UV translation. */ readonly offset?: readonly [number, number];
    /** Counterclockwise rotation in radians. */ readonly rotation?: number;
    /** UV scale. */ readonly scale?: readonly [number, number];
  };
}

/** Validates an encoded image and copies/bakes packed UVs without mutating source arrays. */
export function prepareI3SMeshTexture(
  attribute: MeshAttribute | undefined,
  vertexCount: number,
  texture?: I3SMeshTexture
): Float32Array | undefined {
  if (texture) {
    if (
      !(texture.data instanceof Uint8Array) ||
      Object.keys(texture).some(
        name => !['data', 'mimeType', 'sampler', 'transform'].includes(name)
      )
    )
      throw new Error('Invalid I3S base-color texture');
    let metadata;
    try {
      metadata = getBinaryImageMetadata(
        new DataView(texture.data.buffer, texture.data.byteOffset, texture.data.byteLength)
      );
    } catch {
      /* Normalize malformed headers to the same writer diagnostic. */
    }
    if (
      !metadata ||
      metadata.mimeType !== texture.mimeType ||
      !['image/png', 'image/jpeg'].includes(texture.mimeType) ||
      metadata.width <= 0 ||
      metadata.height <= 0
    )
      throw new Error('I3S texture header must match a PNG/JPEG mimeType and positive dimensions');
    const sampler = texture.sampler;
    if (
      sampler &&
      (Object.keys(sampler).some(
        name => !['wrapS', 'wrapT', 'magFilter', 'minFilter'].includes(name)
      ) ||
        sampler.magFilter !== undefined ||
        sampler.minFilter !== undefined ||
        [sampler.wrapS, sampler.wrapT].some(
          value => value !== undefined && ![33071, 33648, 10497].includes(value)
        ))
    )
      throw new Error('I3S texture profile supports wrapping, but not explicit filtering');
  }
  if (!attribute) {
    if (texture) throw new Error('I3S base-color textures require TEXCOORD_0');
    return undefined;
  }
  const values = attribute.value;
  const normalized =
    attribute.normalized === true &&
    (values instanceof Uint8Array || values instanceof Uint16Array);
  if (
    attribute.size !== 2 ||
    values.length !== vertexCount * 2 ||
    !(values instanceof Float32Array || normalized) ||
    (attribute.normalized && !normalized) ||
    attribute.byteOffset ||
    attribute.byteStride ||
    attribute.transform ||
    attribute.componentType ||
    values.some(value => !Number.isFinite(value))
  )
    throw new Error(
      'I3S TEXCOORD_0 requires finite packed Float32 or normalized unsigned UV pairs'
    );
  const transform = texture?.transform;
  if (
    transform &&
    Object.keys(transform).some(name => !['offset', 'rotation', 'scale'].includes(name))
  )
    throw new Error('Unsupported I3S texture transform');
  const offset = transform?.offset || [0, 0];
  const scale = transform?.scale || [1, 1];
  const rotation = transform?.rotation ?? 0;
  if (
    offset.length !== 2 ||
    scale.length !== 2 ||
    [...offset, ...scale, rotation].some(value => !Number.isFinite(value))
  )
    throw new Error('Invalid I3S texture transform');
  const divisor = normalized ? (values instanceof Uint8Array ? 255 : 65535) : 1;
  const output = new Float32Array(values.length);
  for (let index = 0; index < values.length; index += 2) {
    const horizontal = (values[index] / divisor) * scale[0];
    const vertical = (values[index + 1] / divisor) * scale[1];
    output[index] = offset[0] + Math.cos(rotation) * horizontal - Math.sin(rotation) * vertical;
    output[index + 1] = offset[1] + Math.sin(rotation) * horizontal + Math.cos(rotation) * vertical;
  }
  if (output.some(value => !Number.isFinite(value)))
    throw new Error('I3S texture coordinates overflow Float32');
  return output;
}
