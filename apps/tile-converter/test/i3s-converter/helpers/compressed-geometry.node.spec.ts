import {afterEach, expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {DracoLoader, type DracoMesh} from '@loaders.gl/draco';
import {WorkerFarm} from '@loaders.gl/worker-utils';
import {generateCompressedGeometry} from '../../../src/v4/i3s-converter/helpers/geometry-converter';

afterEach(() => WorkerFarm.getWorkerFarm({}).destroy());

test.each([
  false,
  true
])('I3S Edge Breaker preserves vertex attributes and features (UVs: %s)', async includeTextureCoordinates => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
  const normals = new Float32Array(Array.from({length: 6}, () => [0, 0, 1]).flat());
  const colors = new Uint8Array(
    Array.from({length: 6}, (_, vertexIndex) => [vertexIndex, 20, 30, 255]).flat()
  );
  const texCoords = includeTextureCoordinates
    ? new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1])
    : new Float32Array(0);
  const uvRegions = includeTextureCoordinates
    ? new Uint16Array(Array.from({length: 6}, () => [0, 0, 65535, 65535]).flat())
    : new Uint16Array(0);
  const featureIds = [42, 97];
  const expectedCorners = Array.from({length: 6}, (_, vertexIndex) => [
    ...positions.slice(vertexIndex * 3, vertexIndex * 3 + 3),
    ...normals.slice(vertexIndex * 3, vertexIndex * 3 + 3),
    ...colors.slice(vertexIndex * 4, vertexIndex * 4 + 4),
    featureIds[Math.floor(vertexIndex / 3)],
    ...texCoords.slice(vertexIndex * 2, vertexIndex * 2 + 2),
    ...uvRegions.slice(vertexIndex * 4, vertexIndex * 4 + 4)
  ]);
  const compressed = await generateCompressedGeometry(
    6,
    {featureIndices: [42, 42, 42, 97, 97, 97]},
    {
      positions,
      normals,
      colors,
      texCoords,
      uvRegions,
      featureIds,
      faceRange: new Uint32Array([0, 0, 1, 1])
    },
    {}
  );
  // https://github.com/google/draco/blob/main/src/draco/compression/config/compression_shared.h
  expect(new TextDecoder().decode(compressed.slice(0, 5))).toBe('DRACO');
  expect(new Uint8Array(compressed).slice(7, 9)).toEqual(new Uint8Array([1, 1]));
  const decoded = (await parse(compressed, DracoLoader, {
    core: {worker: false},
    useLocalLibraries: true,
    draco: {shape: 'mesh', attributeNameEntry: 'i3s-attribute-type'}
  })) as DracoMesh;
  expect(decoded.loaderData.num_faces).toBe(2);
  expect(decoded.indices?.value).toHaveLength(6);
  const featureAttribute = decoded.attributes['feature-index'];
  const featureMetadata = Object.values(decoded.loaderData.attributes).find(
    attribute => attribute.metadata['i3s-attribute-type']?.string === 'feature-index'
  )!.metadata;
  expect(featureMetadata['i3s-feature-ids'].intArray).toEqual(new Int32Array(featureIds));
  const decodedCorners = Array.from(decoded.indices!.value, vertexIndex => [
    ...decoded.attributes.POSITION.value.slice(vertexIndex * 3, vertexIndex * 3 + 3),
    ...decoded.attributes.NORMAL.value.slice(vertexIndex * 3, vertexIndex * 3 + 3),
    ...decoded.attributes.COLOR_0.value.slice(vertexIndex * 4, vertexIndex * 4 + 4),
    featureIds[featureAttribute.value[vertexIndex]],
    ...(includeTextureCoordinates
      ? [
          ...decoded.attributes.TEXCOORD_0.value.slice(vertexIndex * 2, vertexIndex * 2 + 2),
          ...decoded.attributes['uv-region'].value.slice(vertexIndex * 4, vertexIndex * 4 + 4)
        ]
      : [])
  ]);
  expect(canonicalizeTriangles(decodedCorners)).toEqual(canonicalizeTriangles(expectedCorners));
  expect(Boolean(decoded.attributes.TEXCOORD_0)).toBe(includeTextureCoordinates);
  expect(Boolean(decoded.attributes['uv-region'])).toBe(includeTextureCoordinates);
});

/** Compares oriented triangles while allowing Draco to reorder faces and rotate their corners. */
function canonicalizeTriangles(corners: number[][]): string[] {
  const triangles: string[] = [];
  for (let cornerIndex = 0; cornerIndex < corners.length; cornerIndex += 3) {
    const triangle = corners.slice(cornerIndex, cornerIndex + 3);
    const rotations = triangle.map((_, rotationIndex) =>
      JSON.stringify([...triangle.slice(rotationIndex), ...triangle.slice(0, rotationIndex)])
    );
    triangles.push(rotations.sort()[0]);
  }
  return triangles.sort();
}
