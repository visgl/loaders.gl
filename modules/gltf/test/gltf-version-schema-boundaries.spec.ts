// SPDX-License-Identifier: MIT

import {expect, test} from 'vitest';
import {
  GLTF1Schema,
  GLTF21Schema,
  GLTF2ExtensionSchemas
} from '../src/lib/types/gltf-version-zod-schemas';

test.each([
  [{channels: []}, ['animations', 'walk'], 'samplers'],
  [{samplers: {}}, ['animations', 'walk'], 'parameters']
])('legacy named animation dependencies survive schema conversion: %j', (animation, path, property) => {
  const result = GLTF1Schema.safeParse({asset: {version: '1.0'}, animations: {walk: animation}});
  expect(result.success).toBe(false);
  expect(result.error!.issues).toContainEqual(
    expect.objectContaining({
      code: 'custom',
      path,
      message: expect.stringContaining(String(property))
    })
  );
});

test('legacy dependencies accept empty explicitly supplied collections without adding defaults', () => {
  const document = {
    asset: {version: '1.0'},
    animations: {walk: {channels: [], samplers: {}, parameters: {}}},
    nodes: {joint: {skeletons: ['root'], skin: 'skin', meshes: ['mesh']}},
    materials: {material: {values: {diffuse: [1, 0, 0, 1], roughness: 0.5, enabled: true}}}
  };
  expect(GLTF1Schema.parse(document)).toEqual(document);
});

test.each([
  [{skeletons: ['root']}, 'skin'],
  [{skeletons: ['root'], skin: 'skin'}, 'meshes'],
  [{skin: 'skin', meshes: ['mesh']}, 'skeletons']
])('legacy named node dependencies report their owning node: %j', (node, property) => {
  const result = GLTF1Schema.safeParse({asset: {version: '1.0'}, nodes: {joint: node}});
  expect(result.success).toBe(false);
  expect(result.error!.issues).toContainEqual(
    expect.objectContaining({
      path: ['nodes', 'joint'],
      message: expect.stringContaining(property)
    })
  );
});

test.each([
  [{}, 'Value violates a JSON Schema branch.'],
  [{uri: 'image.png', bufferView: 0, mimeType: 'image/png'}, 'exclusive JSON Schema branch'],
  [{bufferView: 0}, 'mimeType is required']
])('draft image sources require exactly one complete branch: %j', (image, message) => {
  const result = GLTF21Schema.safeParse({asset: {version: '2.1'}, images: [image]});
  expect(result.success).toBe(false);
  expect(result.error!.issues).toContainEqual(
    expect.objectContaining({
      path: ['images', 0],
      message: expect.stringContaining(message)
    })
  );
});

test.each([
  {uri: 'image.png'},
  {bufferView: 0, mimeType: 'image/png'}
])('draft image validation preserves valid sources without default injection: %j', image => {
  const document = {asset: {version: '2.1'}, images: [image]};
  expect(GLTF21Schema.parse(document)).toEqual(document);
});

test.each([
  [
    {accessors: [{byteOffset: 0, componentType: 5126, type: 'SCALAR', count: 1}]},
    ['accessors', 0],
    'bufferView'
  ],
  [{materials: [{alphaCutoff: 0.5}]}, ['materials', 0], 'alphaMode'],
  [{nodes: [{weights: [1]}]}, ['nodes', 0], 'mesh']
])('draft nested dependency paths remain actionable: %j', (properties, path, required) => {
  const result = GLTF21Schema.safeParse({asset: {version: '2.1'}, ...properties});
  expect(result.success).toBe(false);
  expect(result.error!.issues).toContainEqual(
    expect.objectContaining({
      path,
      message: expect.stringContaining(String(required))
    })
  );
});

const INTERACTIVITY_SCHEMAS = GLTF2ExtensionSchemas.Khronos.KHR_interactivity;

test.each([
  [{socket: 'value'}, 'node is required'],
  [{value: [1]}, 'type is required'],
  [{node: 0, type: 0, value: [1]}, 'forbidden JSON Schema'],
  [{}, 'Value violates a JSON Schema branch.']
])('interactivity validates dependency and union constraints inside socket maps: %j', (socket, message) => {
  const result = INTERACTIVITY_SCHEMAS['node.KHR_interactivity'].safeParse({
    declaration: 0,
    values: {input: socket}
  });
  expect(result.success).toBe(false);
  expect(result.error!.issues).toContainEqual(
    expect.objectContaining({
      path: ['values', 'input'],
      message: expect.stringContaining(message)
    })
  );
});

test.each([
  {type: 0, value: [1]},
  {node: 0},
  {node: 0, socket: 'output'}
])('interactivity accepts literal and linked sockets without filling annotations: %j', socket => {
  const document = {declaration: 0, values: {input: socket}};
  expect(INTERACTIVITY_SCHEMAS['node.KHR_interactivity'].parse(document)).toEqual(document);
});

test('interactivity graph validation walks nested arrays before returning a socket issue', () => {
  const result = INTERACTIVITY_SCHEMAS['graph.KHR_interactivity'].safeParse({
    declarations: [{op: 'math/add'}],
    nodes: [{declaration: 0, values: {input: {value: [1]}}}]
  });
  expect(result.success).toBe(false);
  expect(result.error!.issues).toContainEqual(
    expect.objectContaining({
      path: ['nodes', 0, 'values', 'input'],
      message: expect.stringContaining('type is required')
    })
  );
});

test('interactivity event maps reject the reserved event property', () => {
  const result = INTERACTIVITY_SCHEMAS['event.KHR_interactivity'].safeParse({
    values: {event: {type: 0, value: [1]}}
  });
  expect(result.success).toBe(false);
  expect(result.error!.issues).toContainEqual(
    expect.objectContaining({
      path: ['values'],
      message: expect.stringContaining('forbidden JSON Schema')
    })
  );
});

test.each([
  [{}, true],
  [{immutable: true}, true],
  [{immutable: false}, false],
  [{immutable: false, bufferView: 0}, true]
])('timed accessor conditional metadata validates %j', (document, valid) => {
  const schema = GLTF2ExtensionSchemas.Vendor.MPEG_accessor_timed.MPEG_accessor_timed;
  const result = schema.safeParse(document);
  expect(result.success).toBe(valid);
  if (valid) {
    expect(result.data).toEqual(document);
  } else {
    expect(result.error!.issues).toContainEqual(
      expect.objectContaining({
        path: [],
        message: 'Value violates a conditional JSON Schema branch.'
      })
    );
  }
});
