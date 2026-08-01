// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load, parse} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene';
import {USDLoaderWithParser} from '@loaders.gl/scene/usd-loader';

test('USDLoader exposes metadata at the package root', t => {
  t.equal(USDLoader.id, 'usd', 'uses the usd identifier');
  t.equal(typeof USDLoader.preload, 'function', 'exposes preload');
  t.notOk('parse' in USDLoader, 'does not expose a parser at the package root');
  t.equal(typeof USDLoaderWithParser.parse, 'function', 'exports parser from the loader subpath');
  t.end();
});

test('USDLoader parses an ASCII scene hierarchy', async t => {
  const source = `#usda 1.0
(
    defaultPrim = "World"
    upAxis = "Z"
    metersPerUnit = 0.01
)

def Xform "World"
{
    def Mesh "Triangle"
    {
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        color3f[] primvars:displayColor = [(0.1, 0.4, 0.9)]
    }
}`;
  const stage = await parse(source, USDLoader);

  t.equal(stage.metadata['upAxis'], 'Z', 'preserves stage metadata');
  t.equal(stage.metadata['metersPerUnit'], 0.01, 'parses numeric metadata');
  t.equal(stage.rootPrims[0].children[0].type, 'Mesh', 'preserves nested prim types');
  t.deepEqual(
    stage.rootPrims[0].children[0].attributes['points'].value,
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0]
    ],
    'decodes nested point arrays'
  );
  t.end();
});

test('USDLoader resolves references, variants, and local overrides', async t => {
  const layers = new Map([
    [
      'https://example.com/assets/geometry.usda',
      `#usda 1.0
(defaultPrim = "Geometry")
def Mesh "Geometry"
{
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    def GeomSubset "Paint"
    {
        int[] indices = [0]
        rel material:binding = </Materials/Original>
    }
}`
    ],
    [
      'https://example.com/assets/variants.usda',
      `#usda 1.0
(defaultPrim = "Selection")
def Xform "Selection" (
    variants = {string finish = "blue"}
    prepend variantSets = "finish"
)
{
    variantSet "finish" = {
        "blue" {def "Body" (prepend references = @./geometry.usda@) {}}
        "gold" {def "GoldBody" (prepend references = @./geometry.usda@) {}}
    }
}`
    ]
  ]);
  const source = `#usda 1.0
(defaultPrim = "World")
def Xform "World"
{
    def "Vehicle" (
        prepend references = @./assets/variants.usda@
        variants = {string finish = "gold"}
    )
    {
        over "GoldBody"
        {
            over "Paint" {rel material:binding = </Materials/Gold>}
        }
    }
}`;
  const stage = await parse(source, USDLoader, {
    core: {
      baseUrl: 'https://example.com/scene.usda',
      fetch: async url => {
        const layer = layers.get(String(url));
        return new Response(layer, {status: layer ? 200 : 404});
      }
    }
  });
  const vehicle = stage.rootPrims[0].children[0];
  const goldBody = vehicle.children.find(child => child.name === 'GoldBody');

  t.equal(stage.layers.length, 3, 'tracks the root and referenced layers');
  t.equal(goldBody?.type, 'Mesh', 'resolves referenced geometry for the selected variant');
  t.deepEqual(
    goldBody?.children[0].attributes['material:binding'].value,
    {path: '/Materials/Gold'},
    'applies local overrides to referenced prims'
  );
  t.end();
});

test('USDLoader resolves references from relative filesystem paths', async t => {
  const source = `#usda 1.0
def Xform "World" (prepend references = @./assets/model.usda@) {}`;
  const referencedLayer = `#usda 1.0
def Mesh "Model" {int[] faceVertexCounts = [3]}`;
  const requestedUrls: string[] = [];
  const stage = await parse(source, USDLoader, {
    core: {
      baseUrl: 'fixtures/scenes/scene.usda',
      fetch: async url => {
        requestedUrls.push(String(url));
        return new Response(referencedLayer);
      }
    }
  });

  t.deepEqual(
    requestedUrls,
    ['fixtures/scenes/./assets/model.usda'],
    'preserves the relative source location'
  );
  t.deepEqual(
    stage.rootPrims[0].attributes['faceVertexCounts'].value,
    [3],
    'composes the referenced layer'
  );
  t.end();
});

test('USDLoader uses an absolute response URL when the configured location is relative', async t => {
  const source = `#usda 1.0
def Xform "World" (prepend references = @./assets/model.usda@) {}`;
  const referencedLayer = `#usda 1.0
def Mesh "Model" {int[] faceVertexCounts = [3]}`;
  const requestedUrls: string[] = [];
  const stage = await load('relative/scene.usda', USDLoader, {
    core: {
      fetch: async url => {
        const requestedUrl = String(url);
        requestedUrls.push(requestedUrl);
        const response = new Response(
          requestedUrl === 'relative/scene.usda' ? source : referencedLayer
        );
        Object.defineProperty(response, 'url', {
          value:
            requestedUrl === 'relative/scene.usda'
              ? 'https://example.com/scenes/scene.usda'
              : requestedUrl
        });
        return response;
      }
    }
  });

  t.deepEqual(
    requestedUrls,
    ['relative/scene.usda', 'https://example.com/scenes/assets/model.usda'],
    'falls back to the response URL for browser-style reference resolution'
  );
  t.deepEqual(
    stage.rootPrims[0].attributes['faceVertexCounts'].value,
    [3],
    'composes the referenced layer'
  );
  t.end();
});

test('USDLoader does not count prim nesting against reference depth', async t => {
  const source = `#usda 1.0
def Xform "Level1" {
  def Xform "Level2" {
    def Xform "Level3" {}
  }
}`;
  const stage = await parse(source, USDLoader, {usd: {maxReferenceDepth: 0}});

  t.equal(stage.rootPrims[0].children[0].children[0].name, 'Level3', 'parses nested prims');
  t.end();
});

test('USDLoader rejects unsupported binary USDC layers', async t => {
  await t.rejects(
    parse(new TextEncoder().encode('PXR-USDC\0\0'), USDLoader),
    /Binary USDC crate layers are not implemented/,
    'reports unsupported binary crates'
  );
  t.end();
});

test('USDLoader reads uncompressed ASCII-root USDZ archives', async t => {
  const archive = makeUSDZArchive('scene.usda', '#usda 1.0\ndef Xform "PackagedWorld" {}');
  const stage = await parse(archive, USDLoader);

  t.equal(stage.format, 'usdz', 'retains the USDZ container format');
  t.equal(stage.rootPrims[0].name, 'PackagedWorld', 'parses the archive root layer');
  t.end();
});

/** Builds a minimal stored ZIP archive containing one ASCII USD layer. */
function makeUSDZArchive(filenameValue: string, contentsValue: string): ArrayBuffer {
  const filename = new TextEncoder().encode(filenameValue);
  const contents = new TextEncoder().encode(contentsValue);
  const localHeaderLength = 30 + filename.length;
  const centralDirectoryOffset = localHeaderLength + contents.length;
  const centralDirectoryLength = 46 + filename.length;
  const archive = new ArrayBuffer(centralDirectoryOffset + centralDirectoryLength + 22);
  const bytes = new Uint8Array(archive);
  const view = new DataView(archive);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint32(18, contents.length, true);
  view.setUint32(22, contents.length, true);
  view.setUint16(26, filename.length, true);
  bytes.set(filename, 30);
  bytes.set(contents, localHeaderLength);

  view.setUint32(centralDirectoryOffset, 0x02014b50, true);
  view.setUint16(centralDirectoryOffset + 4, 20, true);
  view.setUint16(centralDirectoryOffset + 6, 20, true);
  view.setUint32(centralDirectoryOffset + 20, contents.length, true);
  view.setUint32(centralDirectoryOffset + 24, contents.length, true);
  view.setUint16(centralDirectoryOffset + 28, filename.length, true);
  bytes.set(filename, centralDirectoryOffset + 46);

  const endOffset = centralDirectoryOffset + centralDirectoryLength;
  view.setUint32(endOffset, 0x06054b50, true);
  view.setUint16(endOffset + 8, 1, true);
  view.setUint16(endOffset + 10, 1, true);
  view.setUint32(endOffset + 12, centralDirectoryLength, true);
  view.setUint32(endOffset + 16, centralDirectoryOffset, true);

  return archive;
}
