// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {MeshGeometry, Field} from '@loaders.gl/schema';
import type {GLTFScenegraph} from '@loaders.gl/gltf';
import type {I3SMeshFeatures} from '@loaders.gl/i3s';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';

/** Explicit-schema Arrow features; stable identifiers are distinct from geometry row indices. */
export type MeshTileFeatures = Pick<
  I3SMeshFeatures,
  'batches' | 'triangleFeatureIndices' | 'featureIdField'
>;

/** Expands shared vertices so each complete triangle retains its own feature row through Draco. */
export function prepareMeshFeatureGeometry(
  mesh: MeshGeometry,
  features?: MeshTileFeatures
): MeshGeometry {
  if (!features) return mesh;
  const count = features.batches.reduce((total, batch) => total + batch.data.numRows, 0);
  const indices = mesh.indices?.value;
  const vertexCount = indices?.length ?? mesh.attributes.POSITION.value.length / 3;
  const associations = features.triangleFeatureIndices;
  if (
    !(associations instanceof Uint32Array) ||
    associations.length !== vertexCount / 3 ||
    associations.some(row => row >= count) ||
    new Set(associations).size !== count
  ) {
    throw new TileConversionError(
      'MESH_FEATURE_ASSOCIATION_INVALID',
      'Every feature row must own a triangle and every triangle must reference a valid row'
    );
  }
  if (count > 2 ** 24)
    throw new TileConversionError(
      'MESH_FEATURE_COUNT_UNSUPPORTED',
      'Feature row indices must be exactly representable in a glTF vertex attribute'
    );
  const attributes: MeshGeometry['attributes'] = Object.fromEntries(
    Object.entries(mesh.attributes).map(([name, attribute]) => {
      const values = attribute.value;
      const Constructor = values.constructor as {new (length: number): typeof values};
      const output = new Constructor(vertexCount * attribute.size);
      for (let vertex = 0; vertex < vertexCount; vertex++) {
        const sourceVertex = indices?.[vertex] ?? vertex;
        for (let component = 0; component < attribute.size; component++)
          output[vertex * attribute.size + component] = Number(
            values[sourceVertex * attribute.size + component]
          );
      }
      return [name, {...attribute, value: output}];
    })
  );
  const featureIndices =
    count <= 65536 ? new Uint16Array(vertexCount) : new Float32Array(vertexCount);
  for (let vertex = 0; vertex < vertexCount; vertex++)
    featureIndices[vertex] = associations[Math.floor(vertex / 3)];
  attributes._FEATURE_ID_0 = {value: featureIndices, size: 1};
  return {...mesh, indices: undefined, attributes};
}

/** Writes one inline structural metadata table without number coercion or nullable sentinel collisions. */
export function encodeMeshFeatures(
  scenegraph: GLTFScenegraph,
  meshIndex: number,
  features?: MeshTileFeatures
): void {
  if (!features) return;
  const {batches, featureIdField} = features;
  const schema = batches[0]?.schema;
  const count = batches.reduce((total, batch) => total + batch.data.numRows, 0);
  const metadataClass = schema?.metadata?.['loaders.gl:feature-class'] || 'features';
  if (
    !schema ||
    !count ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/.test(metadataClass) ||
    !schema.fields.some(field => field.name === featureIdField && field.nullable !== true) ||
    new Set(schema.fields.map(field => field.name)).size !== schema.fields.length
  ) {
    throw new TileConversionError(
      'MESH_FEATURE_SCHEMA_INVALID',
      'Features require a single named class, unique fields, and a non-null stable identifier'
    );
  }
  for (const batch of batches) {
    const actual = convertArrowToSchema(batch.data.schema).fields;
    if (
      JSON.stringify(batch.schema) !== JSON.stringify(schema) ||
      batch.length !== batch.data.numRows ||
      JSON.stringify(actual.map(field => [field.name, field.type])) !==
        JSON.stringify(schema.fields.map(field => [field.name, field.type]))
    ) {
      throw new TileConversionError(
        'MESH_FEATURE_SCHEMA_INVALID',
        'Declared feature schemas and Arrow column types must agree across batches'
      );
    }
  }
  const properties: Record<string, object> = Object.create(null);
  const columns: Record<string, object> = Object.create(null);
  for (const field of schema.fields) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.name))
      throw new TileConversionError(
        'MESH_FEATURE_SCHEMA_INVALID',
        'Property names must be metadata identifiers'
      );
    const values = batches.flatMap(batch => {
      const column = batch.data.getChild(field.name);
      if (!column)
        throw new TileConversionError(
          'MESH_FEATURE_SCHEMA_INVALID',
          `Missing Arrow column ${field.name}`
        );
      return Array.from({length: column.length}, (_, index) => column.get(index));
    });
    if (
      field.name === featureIdField &&
      (values.some(
        value =>
          !(typeof value === 'string' || typeof value === 'bigint' || Number.isSafeInteger(value))
      ) ||
        new Set(values).size !== count)
    )
      throw new TileConversionError(
        'MESH_FEATURE_IDS_INVALID',
        'Stable identifiers must be unique strings or exact integers'
      );
    const encoded = encodeFeatureColumn(field, values);
    properties[field.name] = encoded.property;
    columns[field.name] = {
      values: addMetadataBuffer(scenegraph, encoded.data),
      ...(encoded.offsets
        ? {
            stringOffsets: addMetadataBuffer(scenegraph, encoded.offsets),
            stringOffsetType: 'UINT32'
          }
        : {})
    };
  }
  scenegraph.json.extensions ||= {};
  scenegraph.json.extensions.EXT_structural_metadata = {
    schema: {id: 'loaders_gl_features', classes: {[metadataClass]: {properties}}},
    propertyTables: [{class: metadataClass, count, properties: columns}]
  };
  const primitive = scenegraph.json.meshes![meshIndex].primitives[0];
  primitive.extensions ||= {};
  primitive.extensions.EXT_mesh_features = {
    featureIds: [{featureCount: count, attribute: 0, propertyTable: 0}]
  };
  scenegraph.registerUsedExtension('EXT_structural_metadata');
  scenegraph.registerUsedExtension('EXT_mesh_features');
}

/** Aligns every metadata buffer to eight bytes, including INT64, UINT64 and FLOAT64 columns. */
function addMetadataBuffer(scenegraph: GLTFScenegraph, data: ArrayBufferView): number {
  if (scenegraph.byteLength % 8) scenegraph.addBufferView(new Uint8Array(4));
  return scenegraph.addBufferView(data);
}

/** Encodes supported scalar values and chooses an unused noData value for nullable columns. */
function encodeFeatureColumn(
  field: Field,
  values: unknown[]
): {property: object; data: Uint8Array; offsets?: Uint32Array} {
  const type = field.type;
  const hasNull = values.includes(null);
  if (hasNull && field.nullable !== true)
    throw new TileConversionError(
      'MESH_FEATURE_VALUE_INVALID',
      `Required field ${field.name} contains null`
    );
  const present = values.filter(value => value !== null);
  let noData: string | number | undefined;
  if (type === 'utf8') {
    if (
      present.some(
        value =>
          typeof value !== 'string' ||
          new TextDecoder().decode(new TextEncoder().encode(value)) !== value
      )
    )
      throw new TileConversionError('MESH_FEATURE_VALUE_INVALID', 'Strings require valid Unicode');
    if (hasNull) {
      noData = '';
      const strings = new Set(present);
      while (strings.has(noData)) noData += '_';
    }
    const encoded = values.map(value =>
      new TextEncoder().encode(value === null ? (noData as string) : (value as string))
    );
    const offsets = new Uint32Array(values.length + 1);
    for (let index = 0; index < values.length; index++)
      offsets[index + 1] = offsets[index] + encoded[index].length;
    const data = new Uint8Array(offsets[values.length]);
    encoded.forEach((bytes, index) => data.set(bytes, offsets[index]));
    return {
      property: {type: 'STRING', required: field.nullable !== true, ...(hasNull ? {noData} : {})},
      data,
      offsets
    };
  }
  const widths: Record<string, number> = {
    int8: 1,
    uint8: 1,
    int16: 2,
    uint16: 2,
    int32: 4,
    uint32: 4,
    int64: 8,
    uint64: 8,
    float32: 4,
    float64: 8
  };
  const width = widths[String(type)];
  if (!width)
    throw new TileConversionError(
      'MESH_FEATURE_TYPE_UNSUPPORTED',
      `No qualified GLB property mapping for ${String(type)}`
    );
  const isInteger64 = type === 'int64' || type === 'uint64';
  const isFloat = type === 'float32' || type === 'float64';
  const minimum = isFloat
    ? -Infinity
    : String(type).startsWith('uint')
      ? 0n
      : -(1n << BigInt(width * 8 - 1));
  const maximum = isFloat
    ? Infinity
    : (1n << BigInt(width * 8 - (String(type).startsWith('uint') ? 0 : 1))) - 1n;
  if (
    present.some(value =>
      isInteger64
        ? typeof value !== 'bigint' || value < minimum || value > maximum
        : typeof value !== 'number' ||
          !Number.isFinite(value) ||
          (!isFloat &&
            (!Number.isSafeInteger(value) || BigInt(value) < minimum || BigInt(value) > maximum))
    )
  )
    throw new TileConversionError(
      'MESH_FEATURE_VALUE_INVALID',
      `Values do not fit ${String(type)}`
    );
  if (hasNull) {
    const used = new Set(present.map(String));
    noData = 0;
    while (used.has(String(noData))) noData++;
    if (noData > maximum && minimum < 0) {
      noData = -1;
      while (used.has(String(noData))) noData--;
    }
    if (noData > maximum || noData < minimum)
      throw new TileConversionError(
        'MESH_FEATURE_NULL_UNREPRESENTABLE',
        'No unused value remains for null without losing a real value'
      );
  }
  const data = new Uint8Array(values.length * width);
  const view = new DataView(data.buffer);
  values.forEach((value, index) => {
    const selected = value === null ? (isInteger64 ? BigInt(noData!) : noData) : value;
    const offset = index * width;
    switch (type) {
      case 'int8':
        view.setInt8(offset, selected as number);
        break;
      case 'uint8':
        view.setUint8(offset, selected as number);
        break;
      case 'int16':
        view.setInt16(offset, selected as number, true);
        break;
      case 'uint16':
        view.setUint16(offset, selected as number, true);
        break;
      case 'int32':
        view.setInt32(offset, selected as number, true);
        break;
      case 'uint32':
        view.setUint32(offset, selected as number, true);
        break;
      case 'int64':
        view.setBigInt64(offset, selected as bigint, true);
        break;
      case 'uint64':
        view.setBigUint64(offset, selected as bigint, true);
        break;
      case 'float32':
        view.setFloat32(offset, selected as number, true);
        break;
      case 'float64':
        view.setFloat64(offset, selected as number, true);
        break;
    }
    if (
      isFloat &&
      !Number.isFinite(
        type === 'float32' ? view.getFloat32(offset, true) : view.getFloat64(offset, true)
      )
    )
      throw new TileConversionError(
        'MESH_FEATURE_VALUE_INVALID',
        'Floating point property overflow'
      );
  });
  return {
    property: {
      type: 'SCALAR',
      componentType: String(type).toUpperCase(),
      required: field.nullable !== true,
      ...(hasNull ? {noData} : {})
    },
    data
  };
}
