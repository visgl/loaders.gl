import {expect, test} from 'vitest';
import {load, parse} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene';
import {USDLoaderWithParser} from '@loaders.gl/scene/usd-loader';
test('USDLoader exposes metadata at the package root', () => {
  expect(USDLoader.id, 'uses the usd identifier').toBe('usd');
  expect(typeof USDLoader.preload, 'exposes preload').toBe('function');
  expect('parse' in USDLoader, 'does not expose a parser at the package root').toBeFalsy();
  expect(typeof USDLoaderWithParser.parse, 'exports parser from the loader subpath').toBe(
    'function'
  );
});
test('USDLoader parses an ASCII scene hierarchy', async () => {
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
  expect(stage.metadata['upAxis'], 'preserves stage metadata').toBe('Z');
  expect(stage.metadata['metersPerUnit'], 'parses numeric metadata').toBe(0.01);
  expect(stage.rootPrims[0].children[0].type, 'preserves nested prim types').toBe('Mesh');
  expect(
    stage.rootPrims[0].children[0].attributes['points'].value,
    'decodes nested point arrays'
  ).toEqual([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0]
  ]);
});
test('USDLoader resolves references, variants, and local overrides', async () => {
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
  expect(stage.layers.length, 'tracks the root and referenced layers').toBe(3);
  expect(goldBody?.type, 'resolves referenced geometry for the selected variant').toBe('Mesh');
  expect(
    goldBody?.children[0].attributes['material:binding'].value,
    'applies local overrides to referenced prims'
  ).toEqual({path: '/Materials/Gold'});
});
test('USDLoader resolves references from relative filesystem paths', async () => {
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
  expect(requestedUrls, 'preserves the relative source location').toEqual([
    'fixtures/scenes/./assets/model.usda'
  ]);
  expect(
    stage.rootPrims[0].attributes['faceVertexCounts'].value,
    'composes the referenced layer'
  ).toEqual([3]);
});
test('USDLoader uses an absolute response URL when the configured location is relative', async () => {
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
  expect(
    requestedUrls,
    'falls back to the response URL for browser-style reference resolution'
  ).toEqual(['relative/scene.usda', 'https://example.com/scenes/assets/model.usda']);
  expect(
    stage.rootPrims[0].attributes['faceVertexCounts'].value,
    'composes the referenced layer'
  ).toEqual([3]);
});
test('USDLoader does not count prim nesting against reference depth', async () => {
  const source = `#usda 1.0
def Xform "Level1" {
  def Xform "Level2" {
    def Xform "Level3" {}
  }
}`;
  const stage = await parse(source, USDLoader, {usd: {maxReferenceDepth: 0}});
  expect(stage.rootPrims[0].children[0].children[0].name, 'parses nested prims').toBe('Level3');
});
test('USDLoader rejects unsupported binary USDC layers', async () => {
  await expect(
    parse(new TextEncoder().encode('PXR-USDC\0\0'), USDLoader),
    'reports unsupported binary crates'
  ).rejects.toThrow(/Binary USDC crate layers are not implemented/);
});
test('USDLoader reads uncompressed ASCII-root USDZ archives', async () => {
  const archive = makeUSDZArchive('scene.usda', '#usda 1.0\ndef Xform "PackagedWorld" {}');
  const stage = await parse(archive, USDLoader);
  expect(stage.format, 'retains the USDZ container format').toBe('usdz');
  expect(stage.rootPrims[0].name, 'parses the archive root layer').toBe('PackagedWorld');
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
