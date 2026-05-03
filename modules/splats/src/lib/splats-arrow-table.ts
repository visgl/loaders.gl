// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Field, MeshArrowTable, Schema} from '@loaders.gl/schema';
import type {GaussianSplats} from '../types';
import {convertColorByteToSphericalHarmonicDc} from './splat-utils';

/** Builds a Mesh Arrow table from decoded Gaussian splat values. */
export function makeGaussianSplatsArrowTable(splats: GaussianSplats): MeshArrowTable {
  const columns: Record<string, arrow.Vector> = {};
  const fields: arrow.Field[] = [];
  const schemaFields: Field[] = [];

  addColumn(
    columns,
    fields,
    schemaFields,
    'POSITION',
    makeFixedSizeListVector(splats.positions, 3),
    {
      type: 'fixed-size-list',
      listSize: 3,
      children: [{name: 'value', type: 'float32'}]
    }
  );

  const colorCoefficients = getColorCoefficients(splats.colors);
  addScalarColumn(columns, fields, schemaFields, 'f_dc_0', colorCoefficients[0], {
    'loaders_gl.gaussian_splats.semantic': 'spherical_harmonic_dc',
    'loaders_gl.gaussian_splats.component': '0',
    'loaders_gl.gaussian_splats.encoding': 'coefficient'
  });
  addScalarColumn(columns, fields, schemaFields, 'f_dc_1', colorCoefficients[1], {
    'loaders_gl.gaussian_splats.semantic': 'spherical_harmonic_dc',
    'loaders_gl.gaussian_splats.component': '1',
    'loaders_gl.gaussian_splats.encoding': 'coefficient'
  });
  addScalarColumn(columns, fields, schemaFields, 'f_dc_2', colorCoefficients[2], {
    'loaders_gl.gaussian_splats.semantic': 'spherical_harmonic_dc',
    'loaders_gl.gaussian_splats.component': '2',
    'loaders_gl.gaussian_splats.encoding': 'coefficient'
  });

  addScalarColumn(columns, fields, schemaFields, 'opacity', splats.opacities, {
    'loaders_gl.gaussian_splats.semantic': 'opacity',
    'loaders_gl.gaussian_splats.encoding': 'linear'
  });
  addVectorComponents(columns, fields, schemaFields, 'scale', splats.scales, 3, {
    'loaders_gl.gaussian_splats.semantic': 'scale',
    'loaders_gl.gaussian_splats.encoding': 'linear'
  });
  addVectorComponents(columns, fields, schemaFields, 'rot', splats.rotations, 4, {
    'loaders_gl.gaussian_splats.semantic': 'rotation',
    'loaders_gl.gaussian_splats.encoding': 'quaternion'
  });

  if (splats.sphericalHarmonics && splats.sphericalHarmonicsComponentCount) {
    addSphericalHarmonicRestColumns(
      columns,
      fields,
      schemaFields,
      splats.sphericalHarmonics,
      splats.sphericalHarmonicsComponentCount
    );
  }

  const metadata = new Map<string, string>([
    ['loaders_gl.semantic_type', 'gaussian-splats'],
    ['loaders_gl.gaussian_splats.version', '1'],
    ['loaders_gl.gaussian_splats.source_format', splats.format],
    ['topology', 'point-list'],
    ['mode', '0']
  ]);
  const arrowSchema = new arrow.Schema(fields, metadata);
  const schema: Schema = {
    fields: schemaFields,
    metadata: Object.fromEntries(metadata)
  };

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, columns),
    topology: 'point-list',
    loaderData: splats.loaderData
  } as MeshArrowTable;
}

/** Adds one scalar Arrow column per component of an interleaved vector array. */
function addVectorComponents(
  columns: Record<string, arrow.Vector>,
  fields: arrow.Field[],
  schemaFields: Field[],
  prefix: string,
  values: Float32Array,
  size: number,
  metadata: Record<string, string>
): void {
  for (let component = 0; component < size; component++) {
    const componentValues = new Float32Array(values.length / size);
    for (let rowIndex = 0; rowIndex < componentValues.length; rowIndex++) {
      componentValues[rowIndex] = values[rowIndex * size + component];
    }
    addScalarColumn(columns, fields, schemaFields, `${prefix}_${component}`, componentValues, {
      ...metadata,
      'loaders_gl.gaussian_splats.component': String(component)
    });
  }
}

/** Adds one scalar Arrow column per spherical harmonic rest component. */
function addSphericalHarmonicRestColumns(
  columns: Record<string, arrow.Vector>,
  fields: arrow.Field[],
  schemaFields: Field[],
  sphericalHarmonics: Float32Array,
  componentCount: number
): void {
  for (let component = 0; component < componentCount; component++) {
    const componentValues = new Float32Array(sphericalHarmonics.length / componentCount);
    for (let rowIndex = 0; rowIndex < componentValues.length; rowIndex++) {
      componentValues[rowIndex] = sphericalHarmonics[rowIndex * componentCount + component];
    }
    addScalarColumn(columns, fields, schemaFields, `f_rest_${component}`, componentValues, {
      'loaders_gl.gaussian_splats.semantic': 'spherical_harmonic_rest',
      'loaders_gl.gaussian_splats.component': String(component),
      'loaders_gl.gaussian_splats.encoding': 'coefficient'
    });
  }
}

/** Adds a Float32 scalar Arrow column and matching loaders.gl schema field. */
function addScalarColumn(
  columns: Record<string, arrow.Vector>,
  fields: arrow.Field[],
  schemaFields: Field[],
  name: string,
  values: Float32Array,
  metadata: Record<string, string>
): void {
  addColumn(columns, fields, schemaFields, name, arrow.makeVector(values), 'float32', metadata);
}

/** Adds an Arrow column, Arrow field, and loaders.gl schema field. */
function addColumn(
  columns: Record<string, arrow.Vector>,
  fields: arrow.Field[],
  schemaFields: Field[],
  name: string,
  column: arrow.Vector,
  schemaType: Field['type'],
  metadata: Record<string, string> = {}
): void {
  columns[name] = column;
  fields.push(new arrow.Field(name, column.type, false, new Map(Object.entries(metadata))));
  schemaFields.push({name, type: schemaType, nullable: false, metadata});
}

/** Builds a FixedSizeList Arrow vector from an interleaved Float32 array. */
function makeFixedSizeListVector(value: Float32Array, size: number): arrow.Vector {
  const values = arrow.makeVector(value);
  const child = values.data[0];
  const type = new arrow.FixedSizeList(size, new arrow.Field('value', child.type, false));
  const data = new arrow.Data(type, 0, value.length / size, 0, {}, [child]);
  return new arrow.Vector([data]);
}

/** Converts interleaved RGB bytes to separate SH DC coefficient arrays. */
function getColorCoefficients(colors: Uint8Array): [Float32Array, Float32Array, Float32Array] {
  const rowCount = colors.length / 3;
  const fdc0 = new Float32Array(rowCount);
  const fdc1 = new Float32Array(rowCount);
  const fdc2 = new Float32Array(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    fdc0[rowIndex] = convertColorByteToSphericalHarmonicDc(colors[rowIndex * 3 + 0]);
    fdc1[rowIndex] = convertColorByteToSphericalHarmonicDc(colors[rowIndex * 3 + 1]);
    fdc2[rowIndex] = convertColorByteToSphericalHarmonicDc(colors[rowIndex * 3 + 2]);
  }
  return [fdc0, fdc1, fdc2];
}
