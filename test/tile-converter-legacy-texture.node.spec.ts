import {expect, test} from 'vitest';
import {TextureOwners} from '../apps/tile-converter/src/v4/i3s-converter/helpers/texture-owners';
import {NodeIndexDocument} from '../apps/tile-converter/src/v4/i3s-converter/helpers/node-index-document';

const bounds = {
  mbs: [8, 52, 0, 1],
  obb: {center: [8, 52, 0], halfSize: [1, 1, 1], quaternion: [0, 0, 0, 1]}
};

test('legacy textures share exact bytes and format while preserving ownership snapshots', () => {
  const owners = new TextureOwners();
  const bytes = Buffer.from([1, 2, 3]);
  expect(owners.findOrAddOwner('image/png', bytes, 1)).toBe(1);
  bytes[0] = 9;
  expect(owners.findOrAddOwner('image/png', new Uint8Array([1, 2, 3]), 2)).toBe(1);
  expect(owners.findOrAddOwner('image/jpeg', new Uint8Array([1, 2, 3]), 3)).toBe(3);
  expect(owners.findOrAddOwner('image/png', bytes, 4)).toBe(4);
  owners.clear();
  expect(owners.findOrAddOwner('image/png', new Uint8Array([1, 2, 3]), 5)).toBe(5);
});

test('legacy texture matching remains bounded for large unique image sets', () => {
  const owners = new TextureOwners(4);
  const bytes = new Uint8Array(5);
  expect(owners.findOrAddOwner('image/png', bytes, 1)).toBe(1);
  expect(owners.findOrAddOwner('image/png', bytes, 2)).toBe(2);
});

test.each([
  false,
  true
])('legacy texture references survive dumped=%s resource metadata', async dumped => {
  const resources = {textureOwnerId: 1, ...(dumped ? {texelCountHint: 4} : {texture: {}})};
  const parent = {id: 'root', load: async () => ({version: '1', level: 0, ...bounds})};
  const node = await NodeIndexDocument.createNodeIndexDocument(
    parent as never,
    bounds,
    [],
    {index: 2, mesh: {material: {resource: 1}}} as never,
    resources as never
  );
  expect(node.textureData).toEqual([{href: '../1/textures/0'}, {href: '../1/textures/1'}]);
  expect(node.geometryData).toEqual([{href: './geometries/0'}]);
});

test('legacy duplicate nodes skip image writes and redirect shared material image paths', async () => {
  const {default: I3SConverter} = await import(
    '../apps/tile-converter/src/v4/i3s-converter/i3s-converter'
  );
  const converter = new I3SConverter();
  let textureWrites = 0;
  let shared: any;
  Object.assign(converter, {
    _writeGeometries: async () => {},
    _writeShared: async (options: any) => {
      shared = options.sharedResources;
    },
    _writeTexture: async () => {
      textureWrites++;
    },
    _writeAttributes: async () => {}
  });
  const resources = {
    textureOwnerId: 1,
    sharedResources: {textureDefinitionInfos: [{images: [{href: ['../textures/0']}]}]}
  };
  await (
    converter as unknown as {
      _writeResources: (resources: unknown, path: string, source: unknown) => Promise<void>;
    }
  )._writeResources(resources, '2', {id: 'source'});
  expect(textureWrites).toBe(0);
  expect(shared.textureDefinitionInfos[0].images[0].href).toEqual(['../../1/textures/0']);
  expect(resources.sharedResources.textureDefinitionInfos[0].images[0].href).toEqual([
    '../textures/0'
  ]);
});
