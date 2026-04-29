// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SplatAttributes} from '@loaders.gl/schema';
import {getMeshBoundingBox} from '@loaders.gl/schema-utils';
import type {PLYGaussianSplats, PLYHeader, PLYAttributes, MeshHeader} from './ply-types';
import {getPLYSchema} from './get-ply-schema';

const SH_C0 = 0.28209479177387814;

/** Normalizes Gaussian Splat PLY vertex columns into a renderer-oriented schema. */
export default function normalizeGaussianSplatPLY(
  plyHeader: MeshHeader & PLYHeader,
  plyAttributes: PLYAttributes
): PLYGaussianSplats {
  const attributes = getSplatAttributes(plyAttributes);
  const splatCount = attributes.POSITION?.value.length / 3 || 0;
  const boundingBox = attributes.POSITION
    ? getMeshBoundingBox({POSITION: attributes.POSITION})
    : undefined;

  return {
    loader: 'ply',
    loaderData: plyHeader,
    header: {
      splatCount,
      boundingBox
    },
    schema: getPLYSchema(plyHeader, attributes),
    attributes
  };
}

function getSplatAttributes(attributes: PLYAttributes): SplatAttributes {
  const splatAttributes: SplatAttributes = {};

  if (attributes.vertices?.length > 0) {
    splatAttributes.POSITION = {value: new Float32Array(attributes.vertices), size: 3};
  }

  addTupleAttribute(splatAttributes, attributes, 'SCALE', ['scale_0', 'scale_1', 'scale_2']);
  addTupleAttribute(splatAttributes, attributes, 'SCALE', ['f_scale_0', 'f_scale_1', 'f_scale_2']);
  addTupleAttribute(splatAttributes, attributes, 'ROTATION', ['rot_0', 'rot_1', 'rot_2', 'rot_3']);

  if (attributes.opacity?.length > 0) {
    splatAttributes.OPACITY = {value: new Float32Array(attributes.opacity), size: 1};
  }

  if (attributes.colors?.length > 0) {
    splatAttributes.COLOR_0 = {
      value: new Uint8Array(attributes.colors),
      size: 3,
      normalized: true
    };
  } else {
    addSHDCColorAttribute(splatAttributes, attributes);
  }

  addRestSHAttribute(splatAttributes, attributes);

  return splatAttributes;
}

function addTupleAttribute(
  splatAttributes: SplatAttributes,
  attributes: PLYAttributes,
  name: string,
  sourceNames: string[]
): void {
  if (
    splatAttributes[name] ||
    !sourceNames.every(sourceName => attributes[sourceName]?.length > 0)
  ) {
    return;
  }

  const count = attributes[sourceNames[0]].length;
  const value = new Float32Array(count * sourceNames.length);
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < sourceNames.length; j++) {
      value[i * sourceNames.length + j] = attributes[sourceNames[j]][i];
    }
  }

  splatAttributes[name] = {value, size: sourceNames.length};
}

function addSHDCColorAttribute(splatAttributes: SplatAttributes, attributes: PLYAttributes): void {
  const sourceNames = ['f_dc_0', 'f_dc_1', 'f_dc_2'];
  if (!sourceNames.every(sourceName => attributes[sourceName]?.length > 0)) {
    return;
  }

  const count = attributes.f_dc_0.length;
  const value = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    value[i * 3 + 0] = Math.min(Math.max(attributes.f_dc_0[i] * SH_C0 + 0.5, 0), 1);
    value[i * 3 + 1] = Math.min(Math.max(attributes.f_dc_1[i] * SH_C0 + 0.5, 0), 1);
    value[i * 3 + 2] = Math.min(Math.max(attributes.f_dc_2[i] * SH_C0 + 0.5, 0), 1);
  }

  splatAttributes.COLOR_0 = {value, size: 3};
}

function addRestSHAttribute(splatAttributes: SplatAttributes, attributes: PLYAttributes): void {
  const sourceNames = Object.keys(attributes)
    .filter(name => /^f_rest_\d+$/.test(name) && attributes[name].length > 0)
    .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));

  if (sourceNames.length === 0) {
    return;
  }

  const count = attributes[sourceNames[0]].length;
  const value = new Float32Array(count * sourceNames.length);
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < sourceNames.length; j++) {
      value[i * sourceNames.length + j] = attributes[sourceNames[j]][i];
    }
  }

  splatAttributes.SH_COEFFICIENTS = {value, size: sourceNames.length};
}
