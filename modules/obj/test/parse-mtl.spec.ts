import {expect, test} from 'vitest';
import {parseMTL} from '../src/lib/parse-mtl';

test('parseMTL reads material colors, scalar properties, and texture maps', () => {
  const materials = parseMTL(`
    # material library
    newmtl painted
    Ka 0.1 0.2 0.3
    Kd 0.4 0.5 0.6
    Ks 0.7 0.8 0.9
    Ke 1.0 0.5 0.25
    Ns 42
    Ni 1.33
    illum 2
    map_Kd diffuse.png
    map_Ks specular.png
    map_Ke emission.png
    map_Ns ignored.png
    unknown ignored
    newmtl plain
    Kd 1 0 0
  `);

  expect(materials).toEqual([
    {
      name: 'painted',
      ambientColor: [0.1, 0.2, 0.3],
      diffuseColor: [0.4, 0.5, 0.6],
      specularColor: [0.7, 0.8, 0.9],
      emissiveColor: [1, 0.5, 0.25],
      shininess: 42,
      refraction: 1.33,
      illumination: 2,
      diffuseTextureUrl: 'diffuse.png',
      specularTextureUrl: 'specular.png',
      emissiveTextureUrl: 'emission.png'
    },
    {name: 'plain', diffuseColor: [1, 0, 0]}
  ]);
});

test('parseMTL ignores blank/comment-only input before the first material', () => {
  expect(parseMTL('\n# comment\nunknown value\n')).toEqual([]);
});
