// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import outputCases from '../apps/tile-converter/test/data/dependency-cleanup/builder-output.json';
import {createStore} from '../apps/tile-converter/src/v4/i3s-converter/json-templates/store';
import {createMetadata} from '../apps/tile-converter/src/v4/i3s-converter/json-templates/metadata';
import {createSceneServer} from '../apps/tile-converter/src/v4/i3s-converter/json-templates/scene-server';
import {createNode} from '../apps/tile-converter/src/v4/i3s-converter/json-templates/node';
import {createLayers} from '../apps/tile-converter/src/v4/i3s-converter/json-templates/layers';
import {createGeometryDefinition} from '../apps/tile-converter/src/v4/i3s-converter/json-templates/geometry-definitions';
import {createSharedResources} from '../apps/tile-converter/src/v4/i3s-converter/json-templates/shared-resources';
import {createTileset} from '../apps/tile-converter/src/v4/3d-tiles-converter/json-templates/tileset';

const builders = {
  createStore,
  createMetadata,
  createSceneServer,
  createNode,
  createLayers,
  createGeometryDefinition,
  createSharedResources,
  createTileset
};

test.each(outputCases)('$builder preserves legacy serialized output for $input', ({
  builder,
  input,
  expected
}) => {
  const build = builders[builder as keyof typeof builders] as (input: never) => unknown;
  const result = build(structuredClone(input) as never);
  expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
});

test('node builders retain missing fields and independent mutable defaults', () => {
  const first = createNode({id: 'root', version: 'v'});
  const second = createNode({id: 'root', version: 'v'});
  expect(Object.hasOwn(first, 'path')).toBe(true);
  expect(first.path).toBeUndefined();
  expect(first.parentNode).toEqual({
    id: undefined,
    href: undefined,
    mbs: undefined,
    obb: undefined
  });
  expect(first.lodSelection).not.toBe(second.lodSelection);
});

test('shared resources retain image-index annotations and root-level material parameters', () => {
  const input = {
    nodePath: '7',
    materialDefinitionInfos: [],
    textureDefinitionInfos: [{encoding: ['image/png'], images: [{id: '0', size: 1, length: 4}]}]
  };
  createSharedResources(input as never);
  expect(input.textureDefinitionInfos[0]).toHaveProperty('imageIndex', '70');
});

test('tile-converter(i3s)#json-templates - shared-resources - Verify the default shared data', async () => {
  const SHARED_RESOURCES_ENTRY = {
    materialDefinitionInfos: [
      {
        params: {}
      }
    ],
    nodePath: '1'
  };
  const EXPECTED_DATA = {
    Mat10: {
      name: 'standard',
      type: 'standard',
      params: {
        renderMode: 'solid',
        shininess: 1,
        reflectivity: 0,
        ambient: [1, 1, 1],
        diffuse: [1, 1, 1],
        specular: [0, 0, 0],
        useVertexColorAlpha: false,
        vertexRegions: false,
        vertexColors: true
      }
    }
  };
  const sharedData = createSharedResources(SHARED_RESOURCES_ENTRY as never);
  expect(sharedData ? sharedData.materialDefinitions : {}).toEqual(EXPECTED_DATA);
});
