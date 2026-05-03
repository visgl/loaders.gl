// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, MeshAttributes} from '@loaders.gl/schema';
import {deduceMeshSchema} from '@loaders.gl/schema-utils';
import type {PLYHeader} from './ply-types';

/**
 * Gets schema from PLY header
 * @param plyHeader
 * @param metadata
 * @returns Schema
 */
export function getPLYSchema(plyHeader: PLYHeader, attributes: MeshAttributes): Schema {
  const metadata = makeMetadataFromPlyHeader(plyHeader);
  const schema = deduceMeshSchema(attributes, metadata);
  addGaussianSplatSchemaMetadata(schema, plyHeader);
  return schema;
}

/**
 * Make arrow like schema metadata by PlyHeader properties
 * @param plyHeader
 * @returns
 */
function makeMetadataFromPlyHeader(plyHeader: PLYHeader): Record<string, string> {
  /* eslint-disable camelcase */
  const metadata: Record<string, string> = {};
  metadata.ply_comments = JSON.stringify(plyHeader.comments);
  metadata.ply_elements = JSON.stringify(plyHeader.elements);
  if (plyHeader.format !== undefined) {
    metadata.ply_format = plyHeader.format;
  }
  if (plyHeader.version !== undefined) {
    metadata.ply_version = plyHeader.version;
  }
  if (plyHeader.headerLength !== undefined) {
    metadata.ply_headerLength = plyHeader.headerLength.toString(10);
  }
  return metadata;
}

/** Add Gaussian splat metadata conventions for GraphDECO-style PLY columns. */
function addGaussianSplatSchemaMetadata(schema: Schema, plyHeader: PLYHeader): void {
  const vertexPropertyNames = getVertexPropertyNames(plyHeader);
  if (!isGaussianSplatPLY(vertexPropertyNames)) {
    return;
  }

  schema.metadata['loaders_gl.semantic_type'] = 'gaussian-splats';
  schema.metadata['loaders_gl.gaussian_splats.version'] = '1';

  for (const field of schema.fields) {
    addGaussianSplatFieldMetadata(field);
  }
}

/** Return the property names for the PLY vertex element. */
function getVertexPropertyNames(plyHeader: PLYHeader): Set<string> {
  const vertexElement = plyHeader.elements.find(element => element.name === 'vertex');
  return new Set(vertexElement?.properties.map(property => property.name) || []);
}

/** Return true if the PLY vertex properties match the de facto Gaussian splat layout. */
function isGaussianSplatPLY(propertyNames: Set<string>): boolean {
  const requiredPropertyNames = [
    'x',
    'y',
    'z',
    'f_dc_0',
    'f_dc_1',
    'f_dc_2',
    'opacity',
    'scale_0',
    'scale_1',
    'scale_2',
    'rot_0',
    'rot_1',
    'rot_2',
    'rot_3'
  ];
  return requiredPropertyNames.every(propertyName => propertyNames.has(propertyName));
}

/** Add loaders.gl Gaussian splat metadata to one schema field. */
function addGaussianSplatFieldMetadata(field: Field): void {
  field.metadata ||= {};
  const metadata = field.metadata;

  if (field.name === 'opacity') {
    metadata['loaders_gl.gaussian_splats.semantic'] = 'opacity';
    metadata['loaders_gl.gaussian_splats.encoding'] = 'logit';
    return;
  }

  const scaleComponent = getNumberedPropertyComponent(field.name, 'scale');
  if (scaleComponent !== undefined) {
    metadata['loaders_gl.gaussian_splats.semantic'] = 'scale';
    metadata['loaders_gl.gaussian_splats.component'] = scaleComponent;
    metadata['loaders_gl.gaussian_splats.encoding'] = 'log';
    return;
  }

  const rotationComponent = getNumberedPropertyComponent(field.name, 'rot');
  if (rotationComponent !== undefined) {
    metadata['loaders_gl.gaussian_splats.semantic'] = 'rotation';
    metadata['loaders_gl.gaussian_splats.component'] = rotationComponent;
    metadata['loaders_gl.gaussian_splats.encoding'] = 'quaternion';
    return;
  }

  const sphericalHarmonicDCComponent = getNumberedPropertyComponent(field.name, 'f_dc');
  if (sphericalHarmonicDCComponent !== undefined) {
    metadata['loaders_gl.gaussian_splats.semantic'] = 'spherical_harmonic_dc';
    metadata['loaders_gl.gaussian_splats.component'] = sphericalHarmonicDCComponent;
    metadata['loaders_gl.gaussian_splats.encoding'] = 'coefficient';
    return;
  }

  const sphericalHarmonicRestComponent = getNumberedPropertyComponent(field.name, 'f_rest');
  if (sphericalHarmonicRestComponent !== undefined) {
    metadata['loaders_gl.gaussian_splats.semantic'] = 'spherical_harmonic_rest';
    metadata['loaders_gl.gaussian_splats.component'] = sphericalHarmonicRestComponent;
    metadata['loaders_gl.gaussian_splats.encoding'] = 'coefficient';
  }
}

/** Return the numeric suffix for a property such as scale_0. */
function getNumberedPropertyComponent(name: string, prefix: string): string | undefined {
  const match = name.match(new RegExp(`^${prefix}_(\\d+)$`));
  return match?.[1];
}
