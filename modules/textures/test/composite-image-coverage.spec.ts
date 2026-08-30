// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getCompositeImageUrlTree,
  loadCompositeImageManifest,
  loadCompositeImageMember,
  normalizeCompositeImageOptions,
  parseCompositeImageManifest,
  resolveCompositeImageUrl,
  testCompositeImageManifestShape
} from '../src/lib/composite-image/parse-composite-image';

test('composite image shape detection tolerates malformed JSON', () => {
  expect(testCompositeImageManifestShape('{"shape":"image-texture"}', 'image-texture')).toBe(true);
  expect(testCompositeImageManifestShape('{"shape":"image-texture-array"}', 'image-texture')).toBe(
    false
  );
  expect(testCompositeImageManifestShape('{broken', 'image-texture')).toBe(false);
});

test('composite image URL resolution handles absolute, aliased, and relative paths', () => {
  expect(resolveCompositeImageUrl('data:image/png;base64,AA==')).toBe('data:image/png;base64,AA==');
  expect(resolveCompositeImageUrl('/absolute/member.png')).toBe('/absolute/member.png');
  expect(resolveCompositeImageUrl('member.png', {baseUrl: 'fixtures/images/'})).toBe(
    'fixtures/images/member.png'
  );
  expect(
    resolveCompositeImageUrl('member.png', {core: {baseUrl: 'https://example.com/a/manifest.json'}})
  ).toBe('https://example.com/a/member.png');
  expect(
    resolveCompositeImageUrl('member.png', {}, {baseUrl: 'https://example.com/context'} as any)
  ).toBe('https://example.com/context/member.png');
  expect(() => resolveCompositeImageUrl('member.png')).toThrow(/without a base URL/);

  const options = normalizeCompositeImageOptions({baseUrl: 'https://example.com/assets'});
  expect(options.core?.baseUrl).toBe('https://example.com/assets');
  expect(normalizeCompositeImageOptions({core: {baseUrl: 'kept'}}).core?.baseUrl).toBe('kept');
  expect(normalizeCompositeImageOptions({})).toEqual({});
});

test('composite image source validation rejects ambiguous and empty manifests', async () => {
  await expect(
    getCompositeImageUrlTree({
      shape: 'image-texture',
      image: 'a.png',
      template: 'b-{lod}.png'
    } as any)
  ).rejects.toThrow(/must define image, mipmaps, or template/);
  await expect(
    getCompositeImageUrlTree({shape: 'image-texture', image: 'a.png', mipmaps: ['b.png']} as any)
  ).rejects.toThrow(/must define image, mipmaps, or template/);
  await expect(getCompositeImageUrlTree({shape: 'image-texture'} as any)).rejects.toThrow(
    /must define image, mipmaps, or template/
  );
  await expect(
    getCompositeImageUrlTree({shape: 'image-texture-array', layers: []} as any)
  ).rejects.toThrow(/one or more layers/);
  await expect(
    getCompositeImageUrlTree({shape: 'image-texture-cube-array', layers: []} as any)
  ).rejects.toThrow(/one or more layers/);
  await expect(getCompositeImageUrlTree({shape: 'future'} as any)).rejects.toThrow(
    /Unsupported composite image manifest/
  );
});

test('composite image templates validate mip counts, escapes, and placeholders', async () => {
  const getTemplate = (template: string, mipLevels: number | 'auto' = 1) =>
    getCompositeImageUrlTree({shape: 'image-texture', template, mipLevels} as any);

  await expect(getTemplate('level-{lod}.png', 0)).rejects.toThrow(/Invalid mipLevels/);
  await expect(getTemplate('level.png', 'auto')).rejects.toThrow(/must include a \{lod\}/);
  await expect(getTemplate('level-\\q.png')).rejects.toThrow(/Invalid escape sequence/);
  await expect(getTemplate('level-}.png')).rejects.toThrow(/Unexpected }/);
  await expect(getTemplate('level-{lod.png')).rejects.toThrow(/Unterminated placeholder/);
  await expect(getTemplate('level-{lo-d}.png')).rejects.toThrow(/Invalid placeholder/);
  await expect(getTemplate('level-{{lod}}.png')).rejects.toThrow(/Nested placeholders/);
  await expect(getTemplate('level-{face}.png')).rejects.toThrow(/unsupported placeholder/);
  await expect(getTemplate('level-{lod}.png', Number.POSITIVE_INFINITY)).rejects.toThrow(
    /Invalid mipLevels/
  );
  await expect(getTemplate('level-\\\\-{lod}.png', 2)).resolves.toEqual([
    'level-\\-0.png',
    'level-\\-1.png'
  ]);
});

test('composite cube sources accept direction names and require every face', async () => {
  const faces = {
    right: 'right.png',
    left: 'left.png',
    top: 'top.png',
    bottom: 'bottom.png',
    front: 'front.png',
    back: 'back.png'
  };
  const urls = await getCompositeImageUrlTree({shape: 'image-texture-cube', faces} as any);
  expect(Object.values(urls)).toEqual(Object.values(faces));
  await expect(
    getCompositeImageUrlTree({shape: 'image-texture-cube', faces: {right: 'right.png'}} as any)
  ).rejects.toThrow(/missing -X face/);
  await expect(
    getCompositeImageUrlTree({shape: 'image-texture-array', layers: [[]]} as any)
  ).rejects.toThrow(/strings or non-empty mip arrays/);
});

test('composite image parser reports a valid but unexpected shape', async () => {
  await expect(
    parseCompositeImageManifest(
      JSON.stringify({shape: 'image-texture-array', layers: ['a.png']}),
      'image-texture'
    )
  ).rejects.toThrow('Expected image-texture manifest, got image-texture-array');
});

test('composite image loading materializes every texture shape through loader context', async () => {
  const requestedUrls: string[] = [];
  const context = {
    baseUrl: 'https://example.com/textures',
    fetch: async (url: string) => {
      requestedUrls.push(String(url));
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: {'content-type': 'image/png'}
      });
    },
    coreApi: {},
    _parse: async () => new ImageData(8, 4)
  } as any;
  const cubeFaces = {
    right: 'right.png',
    left: 'left.png',
    top: 'top.png',
    bottom: 'bottom.png',
    front: 'front.png',
    back: 'back.png'
  };
  const manifests = [
    {shape: 'image-texture', image: 'single.png'},
    {shape: 'image-texture-array', layers: ['one.png', ['two-0.png', 'two-1.png']]},
    {shape: 'image-texture-cube', faces: cubeFaces},
    {shape: 'image-texture-cube-array', layers: [{faces: cubeFaces}, {faces: cubeFaces}]}
  ] as const;
  const expectedTypes = ['2d', '2d-array', 'cube', 'cube-array'];

  for (let index = 0; index < manifests.length; index++) {
    const texture = await loadCompositeImageManifest(manifests[index] as any, {}, context);
    expect(texture.type).toBe(expectedTypes[index]);
    expect(texture.format).toBe('rgba8unorm');
  }
  expect(requestedUrls.length).toBeGreaterThan(10);
});

test('composite image templates derive automatic mip counts from the level-zero image', async () => {
  const context = {
    baseUrl: 'https://example.com/textures',
    fetch: async () => new Response(new Uint8Array([1])),
    coreApi: {},
    _parse: async () => new ImageData(8, 4)
  } as any;
  const urls = await getCompositeImageUrlTree(
    {shape: 'image-texture', template: 'level-{lod}.png', mipLevels: 'auto'} as any,
    {},
    context
  );
  expect(urls).toEqual(['level-0.png', 'level-1.png', 'level-2.png', 'level-3.png']);

  const member = await loadCompositeImageMember(
    'direct.png',
    {core: {baseUrl: '/root/a.json'}},
    {
      ...context,
      baseUrl: undefined
    }
  );
  expect(member).toBeInstanceOf(ImageData);
});
