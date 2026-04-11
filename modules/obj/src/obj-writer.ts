// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable, MeshAttribute} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {OBJFormat} from './obj-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `OBJWriter`. */
export type OBJWriterOptions = WriterOptions & {
  /** Reserved for future OBJ writer options. */
  obj?: Record<string, never>;
};

/**
 * Writer for the OBJ geometry format.
 */
export const OBJWriter = {
  ...OBJFormat,
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as never,
  version: VERSION,
  options: {
    obj: {}
  },
  text: true,
  encode: async (data, options) => encodeOBJSync(data, options),
  encodeSync: encodeOBJSync,
  encodeTextSync: encodeOBJ
} as const satisfies WriterWithEncoder<Mesh | MeshArrowTable, never, OBJWriterOptions>;

/** Encode mesh category data as OBJ bytes. */
function encodeOBJSync(data: Mesh | MeshArrowTable, options?: OBJWriterOptions): ArrayBuffer {
  const text = encodeOBJ(data, options);
  return new TextEncoder().encode(text).buffer;
}

/** Encode mesh category data as OBJ text. */
function encodeOBJ(data: Mesh | MeshArrowTable, options?: OBJWriterOptions): string {
  const mesh = convertTableToMesh(normalizeMeshArrowTable(data));
  const positionAttribute = getRequiredAttribute(mesh, 'POSITION');
  const normalAttribute = mesh.attributes.NORMAL;
  const textureCoordinateAttribute = mesh.attributes.TEXCOORD_0;
  const colorAttribute = mesh.attributes.COLOR_0;
  const vertexCount = positionAttribute.value.length / positionAttribute.size;
  const lines: string[] = ['# loaders.gl OBJ'];

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const vertex = [
      getComponent(positionAttribute, vertexIndex, 0),
      getComponent(positionAttribute, vertexIndex, 1),
      getComponent(positionAttribute, vertexIndex, 2)
    ];

    if (colorAttribute) {
      vertex.push(
        getColorComponent(colorAttribute, vertexIndex, 0),
        getColorComponent(colorAttribute, vertexIndex, 1),
        getColorComponent(colorAttribute, vertexIndex, 2)
      );
    }

    lines.push(`v ${vertex.join(' ')}`);
  }

  if (textureCoordinateAttribute) {
    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
      lines.push(
        `vt ${getComponent(textureCoordinateAttribute, vertexIndex, 0)} ${getComponent(
          textureCoordinateAttribute,
          vertexIndex,
          1
        )}`
      );
    }
  }

  if (normalAttribute) {
    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
      lines.push(
        `vn ${getComponent(normalAttribute, vertexIndex, 0)} ${getComponent(
          normalAttribute,
          vertexIndex,
          1
        )} ${getComponent(normalAttribute, vertexIndex, 2)}`
      );
    }
  }

  const triangleIndices = getTriangleIndices(mesh, vertexCount);
  for (let triangleIndex = 0; triangleIndex < triangleIndices.length; triangleIndex += 3) {
    const face = [
      getFaceVertex(
        triangleIndices[triangleIndex],
        Boolean(textureCoordinateAttribute),
        Boolean(normalAttribute)
      ),
      getFaceVertex(
        triangleIndices[triangleIndex + 1],
        Boolean(textureCoordinateAttribute),
        Boolean(normalAttribute)
      ),
      getFaceVertex(
        triangleIndices[triangleIndex + 2],
        Boolean(textureCoordinateAttribute),
        Boolean(normalAttribute)
      )
    ];
    lines.push(`f ${face.join(' ')}`);
  }

  return `${lines.join('\n')}\n`;
}

/** Return mesh data as a MeshArrowTable, converting plain Mesh data first. */
function normalizeMeshArrowTable(data: Mesh | MeshArrowTable): MeshArrowTable {
  if ('shape' in data && data.shape === 'arrow-table') {
    return data;
  }
  return convertMeshToTable(data as Mesh, 'arrow-table');
}

/** Return a required mesh attribute or throw a format-specific error. */
function getRequiredAttribute(mesh: Mesh, attributeName: string): MeshAttribute {
  const attribute = mesh.attributes[attributeName];
  if (!attribute) {
    throw new Error(`OBJWriter: ${attributeName} attribute is required`);
  }
  return attribute;
}

/** Return a single attribute component with 0 as the missing component fallback. */
function getComponent(
  attribute: MeshAttribute,
  vertexIndex: number,
  componentIndex: number
): number {
  return attribute.value[vertexIndex * attribute.size + componentIndex] || 0;
}

/** Return a color component normalized for OBJ vertex colors. */
function getColorComponent(
  attribute: MeshAttribute,
  vertexIndex: number,
  componentIndex: number
): number {
  const value = getComponent(attribute, vertexIndex, componentIndex);
  return attribute.normalized || value > 1 ? value / 255 : value;
}

/** Return triangle indices for indexed or sequential triangle-list meshes. */
function getTriangleIndices(mesh: Mesh, vertexCount: number): number[] {
  if (mesh.indices?.value?.length) {
    return Array.from(mesh.indices.value);
  }

  if (mesh.mode !== 4 && mesh.topology !== 'triangle-list') {
    return [];
  }

  const triangleIndices: number[] = [];
  for (let vertexIndex = 0; vertexIndex + 2 < vertexCount; vertexIndex += 3) {
    triangleIndices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
  }
  return triangleIndices;
}

/** Return an OBJ face vertex reference. */
function getFaceVertex(
  vertexIndex: number,
  hasTextureCoordinates: boolean,
  hasNormals: boolean
): string {
  const faceIndex = vertexIndex + 1;
  if (hasTextureCoordinates && hasNormals) {
    return `${faceIndex}/${faceIndex}/${faceIndex}`;
  }
  if (hasTextureCoordinates) {
    return `${faceIndex}/${faceIndex}`;
  }
  if (hasNormals) {
    return `${faceIndex}//${faceIndex}`;
  }
  return String(faceIndex);
}
