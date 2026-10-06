// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {appendGLTFV1BufferData} from './append-gltf-v1-buffer-data';
import type {GLTFWithBuffers, GLTFSkin} from '../types/gltf-types';

/** Skin metadata retained until its legacy transform has been baked. */
type BindShapeSkin = GLTFSkin & {
  /** Column-major transform applied before inverse-bind matrices. */
  bindShapeMatrix?: number[];
  /** Joint names retained on an unresolved best-effort binding. */
  jointNames?: string[];
};

/** Validated matrix data to append without overwriting shared source accessors. */
type BindShapeBake = {
  /** Source buffer receiving this appended payload. */
  bufferIndex: number;
  /** Number of matrices, preserving source accessor order. */
  count: number;
  /** Packed little-endian FLOAT MAT4 values. */
  matrixBytes: ArrayBuffer;
  /** Equivalent skin instances sharing this baked accessor. */
  skins: BindShapeSkin[];
};

/**
 * Bake affine bind shapes as `inverseBindMatrix * bindShapeMatrix`.
 * New matrices are appended to copied source buffers, leaving shared accessors and caller bytes
 * unchanged. Each changed buffer is copied once; URI-backed buffers receive updated data URIs.
 */
export function bakeGLTFV1BindShapes(
  gltf: GLTFWithBuffers,
  reportUnsupported: (feature: string) => void
): void {
  const plannedBindings = new Map<string, BindShapeBake>();

  for (const [skinIndex, skin] of ((gltf.json.skins || []) as BindShapeSkin[]).entries()) {
    if (skin.bindShapeMatrix === undefined) continue;
    const bindShapeMatrix = skin.bindShapeMatrix;
    if (!isFiniteAffineMatrix(bindShapeMatrix)) {
      reportUnsupported(
        `skin ${skinIndex} non-identity bindShapeMatrix requires a finite affine matrix`
      );
      continue;
    }
    const bindingKey = `${skin.inverseBindMatrices}:${bindShapeMatrix.join(',')}`;
    const existingPlan = plannedBindings.get(bindingKey);
    if (existingPlan) {
      if ((skin.joints || skin.jointNames || []).length > existingPlan.count) {
        reportUnsupported(
          `skin ${skinIndex} non-identity bindShapeMatrix has too few inverse-bind matrices`
        );
        continue;
      }
      existingPlan.skins.push(skin);
      continue;
    }
    const plan = prepareBindShapeBake(gltf, skin, bindShapeMatrix);
    if (typeof plan === 'string') {
      reportUnsupported(`skin ${skinIndex} non-identity bindShapeMatrix ${plan}`);
      continue;
    }
    plannedBindings.set(bindingKey, plan);
  }
  appendGLTFV1BufferData(
    gltf,
    Array.from(plannedBindings.values(), plan => ({
      bufferIndex: plan.bufferIndex,
      bytes: plan.matrixBytes,
      apply: bufferViewIndex => {
        gltf.json.accessors ||= [];
        const accessorIndex = gltf.json.accessors.length;
        gltf.json.accessors.push({
          bufferView: bufferViewIndex,
          byteOffset: 0,
          componentType: 5126,
          count: plan.count,
          type: 'MAT4'
        });
        for (const skin of plan.skins) {
          skin.inverseBindMatrices = accessorIndex;
          delete skin.bindShapeMatrix;
        }
      }
    }))
  );
}

/** Validate the source and calculate a complete payload before committing any buffer changes. */
function prepareBindShapeBake(
  gltf: GLTFWithBuffers,
  skin: BindShapeSkin,
  bindShapeMatrix: number[]
): BindShapeBake | string {
  const accessor = gltf.json.accessors?.[skin.inverseBindMatrices as number];
  const jointCount = (skin.joints || skin.jointNames || []).length;
  if (
    !accessor ||
    accessor.componentType !== 5126 ||
    accessor.type !== 'MAT4' ||
    accessor.normalized ||
    accessor.sparse ||
    accessor.extensions ||
    Object.hasOwn(accessor, 'byteStride') ||
    !Number.isSafeInteger(accessor.count) ||
    accessor.count < 1
  )
    return 'requires packed FLOAT MAT4 inverse-bind matrices';
  if (accessor.count < jointCount) return 'has too few inverse-bind matrices';
  const bufferView = gltf.json.bufferViews?.[accessor.bufferView as number];
  const bufferIndex = bufferView?.buffer;
  const bufferDefinition = gltf.json.buffers?.[bufferIndex as number];
  const loadedBuffer = gltf.buffers[bufferIndex as number];
  if (!bufferView || bufferIndex === undefined || !bufferDefinition || !loadedBuffer)
    return 'requires a loaded inverse-bind buffer';
  if (bufferView.extensions) return 'does not support inverse-bind buffer-view extensions';
  const bufferViewByteOffset = bufferView.byteOffset ?? 0;
  const accessorByteOffset = accessor.byteOffset ?? 0;
  const matrixByteLength = accessor.count * 64;
  if (
    !(loadedBuffer.arrayBuffer instanceof ArrayBuffer) ||
    !Number.isSafeInteger(bufferDefinition.byteLength) ||
    bufferDefinition.byteLength < 1 ||
    !Number.isSafeInteger(loadedBuffer.byteOffset) ||
    loadedBuffer.byteOffset < 0 ||
    !Number.isSafeInteger(loadedBuffer.byteLength) ||
    loadedBuffer.byteLength < bufferDefinition.byteLength ||
    loadedBuffer.byteOffset + loadedBuffer.byteLength > loadedBuffer.arrayBuffer.byteLength ||
    !Number.isSafeInteger(bufferViewByteOffset) ||
    bufferViewByteOffset < 0 ||
    bufferViewByteOffset % 4 !== 0 ||
    !Number.isSafeInteger(bufferView.byteLength) ||
    bufferView.byteLength < 1 ||
    bufferView.byteStride !== undefined ||
    bufferViewByteOffset + bufferView.byteLength > bufferDefinition.byteLength ||
    !Number.isSafeInteger(accessorByteOffset) ||
    accessorByteOffset < 0 ||
    accessorByteOffset % 4 !== 0 ||
    accessorByteOffset + matrixByteLength > bufferView.byteLength
  )
    return 'has an invalid inverse-bind buffer layout';

  const sourceData = new DataView(loadedBuffer.arrayBuffer);
  const sourceByteOffset = loadedBuffer.byteOffset + bufferViewByteOffset + accessorByteOffset;
  const matrixBytes = new ArrayBuffer(matrixByteLength);
  const outputData = new DataView(matrixBytes);
  for (let matrixIndex = 0; matrixIndex < accessor.count; matrixIndex++) {
    const inverseBindMatrix = Array.from({length: 16}, (_, componentIndex) =>
      sourceData.getFloat32(sourceByteOffset + matrixIndex * 64 + componentIndex * 4, true)
    );
    if (!isFiniteAffineMatrix(inverseBindMatrix))
      return 'requires finite affine inverse-bind matrices';
    for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
      for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
        let value = 0;
        for (let innerIndex = 0; innerIndex < 4; innerIndex++) {
          value +=
            inverseBindMatrix[innerIndex * 4 + rowIndex] *
            bindShapeMatrix[columnIndex * 4 + innerIndex];
        }
        if (!Number.isFinite(Math.fround(value))) return 'produces non-finite FLOAT matrix values';
        outputData.setFloat32(matrixIndex * 64 + (columnIndex * 4 + rowIndex) * 4, value, true);
      }
    }
  }
  return {bufferIndex, count: accessor.count, matrixBytes, skins: [skin]};
}

/** Check glTF 2's finite values and required affine fourth row, including sparse JS arrays. */
function isFiniteAffineMatrix(matrix: unknown): matrix is number[] {
  if (!Array.isArray(matrix) || matrix.length !== 16) return false;
  for (let componentIndex = 0; componentIndex < 16; componentIndex++) {
    if (!Number.isFinite(matrix[componentIndex])) return false;
  }
  return matrix[3] === 0 && matrix[7] === 0 && matrix[11] === 0 && matrix[15] === 1;
}
