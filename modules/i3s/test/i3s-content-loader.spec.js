import test from 'tape-promise/tape';
import {fetchFile, isBrowser, parse} from '@loaders.gl/core';
import {getSupportedGPUTextureFormats} from '@loaders.gl/textures';
// @ts-expect-error
import I3SNodePagesTiles from '@loaders.gl/i3s/lib/helpers/i3s-nodepages-tiles';
import {TILESET_STUB} from '@loaders.gl/i3s/test/test-utils/load-utils';

import {I3SContentLoader} from '@loaders.gl/i3s';

const I3S_TILE_CONTENT =
  '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/geometries/0';
const NEW_YORK_TILE_CONTENT =
  '@loaders.gl/i3s/test/data/Buildings_NewYork_17/SceneServer/layers/0/nodes/2465/geometries/1';
const NEW_YORK_CONTENT_LOADER_OPTIONS =
  '@loaders.gl/i3s/test/data/Buildings_NewYork_17/i3s-content-loader-options.json';
const MONTREAL_TILE_CONTENT =
  '@loaders.gl/i3s/test/data/Montreal_3DObjects_subset_1_v17_ktx2/SceneServer/layers/0/nodes/1/geometries/1';
const MONTREAL_CONTENT_LOADER_OPTIONS =
  '@loaders.gl/i3s/test/data/Montreal_3DObjects_subset_1_v17_ktx2/i3s-content-loader-options.json';

test('ParseI3sTileContent#should parse tile content', async (t) => {
  const tileset = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(tileset, {});
  const tile = await i3SNodePagesTiles.formTileFromNodePages(1);
  const response = await fetchFile(I3S_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const content = await parse(data, I3SContentLoader, {
    i3s: {
      ...getI3SOptions(tile, tileset),
      useDracoGeometry: false
    }
  });
  t.ok(content);

  // color array should be colorized by attribute
  const colorsArray = content.attributes.colors.value;
  const testArray = new Uint8Array(9);
  testArray.fill(255);
  t.deepEquals(colorsArray.subarray(0, 9), testArray);
  const arrayMiddle = (colorsArray.length - (colorsArray.length % 2)) / 2;
  t.deepEquals(colorsArray.subarray(arrayMiddle, arrayMiddle + 9), testArray);
  t.deepEquals(colorsArray.subarray(colorsArray.length - 9), testArray);

  t.end();
});

test('ParseI3sTileContent#should load "dds" texture if it is supported', async (t) => {
  const tileset = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(tileset, {});
  const tile = await i3SNodePagesTiles.formTileFromNodePages(1);
  const response = await fetchFile(I3S_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const content = await parse(data, I3SContentLoader, {
    i3s: {
      ...getI3SOptions(tile, tileset),
      useDracoGeometry: false,
      decodeTextures: true
    }
  });
  const texture = content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
  if (isBrowser) {
    const supportedFormats = getSupportedGPUTextureFormats();
    if (supportedFormats.has('dxt')) {
      t.ok(texture.compressed);
      t.ok(texture.data instanceof Array);
    } else {
      t.ok(texture instanceof ImageBitmap);
    }
  } else {
    t.ok(texture instanceof Object);
    t.ok(texture.data instanceof Uint8Array);
  }
  t.end();
});

test('ParseI3sTileContent#should decode "ktx2" texture with basis loader', async (t) => {
  const response = await fetchFile(MONTREAL_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const responseOptions = await fetchFile(MONTREAL_CONTENT_LOADER_OPTIONS);
  const i3sLoaderOptions = await responseOptions.json();
  const content = await parse(data, I3SContentLoader, {
    i3s: i3sLoaderOptions
  });
  const texture =
    content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image.data[0];
  t.ok(texture instanceof Object);
  t.ok(texture.data instanceof Uint8Array);
  t.end();
});

test('ParseI3sTileContent#should make PBR material', async (t) => {
  const tileset = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(tileset, {});
  const tile = await i3SNodePagesTiles.formTileFromNodePages(1);
  const response = await fetchFile(I3S_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const content = await parse(data, I3SContentLoader, {
    i3s: {
      ...getI3SOptions(tile, tileset),
      useDracoGeometry: false,
      decodeTextures: true
    }
  });
  const material = content.material;
  t.ok(material.doubleSided);
  t.deepEqual(material.emissiveFactor, [1, 1, 1]);
  t.ok(material.pbrMetallicRoughness);
  t.ok(material.pbrMetallicRoughness.baseColorTexture);

  const texture = material.pbrMetallicRoughness.baseColorTexture.texture;
  t.ok(texture);
  t.ok(texture.source);
  if (isBrowser) {
    const supportedFormats = getSupportedGPUTextureFormats();
    if (supportedFormats.has('dxt')) {
      t.ok(texture.source.image.compressed);
      t.ok(texture.source.image.data instanceof Array);
    } else {
      t.ok(texture.source.image instanceof ImageBitmap);
    }
  } else {
    t.ok(texture.source.image instanceof Object);
    t.ok(texture.source.image.data instanceof Uint8Array);
  }
  t.end();
});

test('ParseI3sTileContent#should have featureIds', async (t) => {
  const tileset = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(tileset, {});
  const tile = await i3SNodePagesTiles.formTileFromNodePages(1);
  const response = await fetchFile(I3S_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const content = await parse(data, I3SContentLoader, {
    i3s: {
      ...getI3SOptions(tile, tileset),
      useDracoGeometry: false,
      decodeTextures: true
    }
  });
  t.ok(content);
  t.ok(content.featureIds);
  t.equal(content.featureIds.length, 25638);
  t.end();
});

test('ParseI3sTileContent#should generate mbs from obb', async (t) => {
  const tileset = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(tileset, {});
  const tile = await i3SNodePagesTiles.formTileFromNodePages(1);
  t.ok(tile.mbs);
  t.equals(tile.mbs.length, 4);
  t.deepEquals(tile.mbs.slice(0, 3), tile.obb.center);
  t.end();
});

test('ParseI3sTileContent#should not decode the texture image if "decodeTextures" === false', async (t) => {
  const tileset = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(tileset, {});
  const tile = await i3SNodePagesTiles.formTileFromNodePages(1);
  const response = await fetchFile(I3S_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const content = await parse(data, I3SContentLoader, {
    i3s: {
      ...getI3SOptions(tile, tileset),
      useDracoGeometry: false,
      decodeTextures: false
    }
  });
  const texture = content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
  t.ok(texture instanceof ArrayBuffer);
  if (isBrowser) {
    const supportedFormats = getSupportedGPUTextureFormats();
    if (supportedFormats.has('dxt')) {
      t.equal(texture.byteLength, 45200);
    } else {
      t.equal(texture.byteLength, 7199);
    }
  } else {
    t.equal(texture.byteLength, 7199);
  }

  const i3SNodePagesTiles2 = new I3SNodePagesTiles(tileset, {i3s: {useCompressedTextures: false}});
  const tile2 = await i3SNodePagesTiles2.formTileFromNodePages(1);
  const response2 = await fetchFile(I3S_TILE_CONTENT);
  const data2 = await response2.arrayBuffer();
  const content2 = await parse(data2, I3SContentLoader, {
    i3s: {
      ...getI3SOptions(tile2, tileset),
      useDracoGeometry: false,
      decodeTextures: false
    }
  });
  const texture2 = content2.material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
  t.ok(texture2 instanceof ArrayBuffer);
  t.equal(texture2.byteLength, 7199);

  t.end();
});

test('ParseI3sTileContent#should colorize by attribute', async (t) => {
  const response = await fetchFile(NEW_YORK_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const responseOptions = await fetchFile(NEW_YORK_CONTENT_LOADER_OPTIONS);
  const i3sLoaderOptions = await responseOptions.json();
  i3sLoaderOptions.colorsByAttribute.mode = 'replace';
  const content = await parse(data, I3SContentLoader, {
    i3s: i3sLoaderOptions
  });
  t.ok(content);

  // color array should be colorized by attribute
  const colorsArray = content.attributes.colors.value;
  t.deepEquals(colorsArray.subarray(0, 9), [139, 139, 247, 255, 139, 139, 247, 255, 139]);
  const arrayMiddle = (colorsArray.length - (colorsArray.length % 2)) / 2;
  t.deepEquals(
    colorsArray.subarray(arrayMiddle, arrayMiddle + 9),
    [244, 255, 135, 135, 244, 255, 135, 135, 244]
  );
  t.deepEquals(
    colorsArray.subarray(colorsArray.length - 9),
    [255, 141, 141, 248, 255, 141, 141, 248, 255]
  );

  t.end();
});

test('ParseI3sTileContent#should colorize by attribute using mutiplying colors', async (t) => {
  const response = await fetchFile(NEW_YORK_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const responseOptions = await fetchFile(NEW_YORK_CONTENT_LOADER_OPTIONS);
  const i3sLoaderOptions = await responseOptions.json();
  i3sLoaderOptions.colorsByAttribute.mode = 'multiply';
  const content = await parse(data, I3SContentLoader, {
    i3s: i3sLoaderOptions
  });
  t.ok(content);

  // color array should be colorized by attribute using multiplying colors
  const colorsArray = content.attributes.colors.value;
  t.deepEquals(colorsArray.subarray(0, 9), [139, 139, 247, 255, 139, 139, 247, 255, 139]);
  const arrayMiddle = (colorsArray.length - (colorsArray.length % 2)) / 2;
  t.deepEquals(
    colorsArray.subarray(arrayMiddle, arrayMiddle + 9),
    [244, 255, 135, 135, 244, 255, 135, 135, 244]
  );
  t.deepEquals(
    colorsArray.subarray(colorsArray.length - 9),
    [255, 141, 141, 248, 255, 141, 141, 248, 255]
  );

  t.end();
});

function getI3SOptions(tile, tileset) {
  return {
    _tileOptions: {
      attributeUrls: tile.attributeUrls,
      textureUrl: tile.textureUrl,
      textureFormat: tile.textureFormat,
      textureLoaderOptions: tile.textureLoaderOptions,
      materialDefinition: tile.materialDefinition,
      isDracoGeometry: tile.isDracoGeometry,
      mbs: tile.mbs
    },
    _tilesetOptions: {
      store: tileset.store,
      attributeStorageInfo: tileset.attributeStorageInfo,
      fields: tileset.fields
    }
  };
}
