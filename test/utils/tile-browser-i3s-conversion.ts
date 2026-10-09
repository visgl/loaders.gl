import {vi} from 'vitest';
import {encodeI3SMeshLayer, SLPKWriter} from '@loaders.gl/i3s';
import {GZipDecompressor} from '@loaders.gl/compression';
import {convertFeatureAttributesToArrowBatches} from '@loaders.gl/tile-converter/v5/adapters';

/** Builds a tiny real I3S mesh with one explicit feature, reused as HTTP and local SLPK input. */
export async function createI3SConversionFixture() {
  const png = Uint8Array.from(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII='
    ),
    character => character.charCodeAt(0)
  );
  const schema = {
    fields: [
      {name: 'feature_id', type: 'int32' as const, nullable: false},
      {name: 'label', type: 'utf8' as const, nullable: true}
    ]
  };
  const encoded = encodeI3SMeshLayer(
    {
      mode: 4,
      topology: 'triangle-list',
      attributes: {
        POSITION: {value: new Float64Array([6378137, 0, 0, 6378137, 1, 0, 6378137, 0, 1]), size: 3},
        TEXCOORD_0: {value: new Float32Array([0, 0, 1, 0, 0, 1]), size: 2}
      }
    },
    {
      maxPositionError: 0.01,
      maxResourceBytes: 8192,
      material: {baseColorTexture: {data: png, mimeType: 'image/png'}},
      features: {
        batches: convertFeatureAttributesToArrowBatches(
          [{featureId: 17, metadataClass: 'buildings', properties: {label: '東京'}}],
          {schema}
        ),
        triangleFeatureIndices: new Uint32Array([0]),
        featureIdField: 'feature_id'
      }
    }
  );
  const decompressor = new GZipDecompressor();
  const resources: Record<string, ArrayBuffer> = {};
  for (const [path, bytes] of Object.entries(encoded.files))
    resources[path.replace(/\.gz$/, '')] = path.endsWith('.gz')
      ? await decompressor.decompress(bytes)
      : bytes;
  const data = await SLPKWriter.encode!(encoded.files, {slpk: {maxArchiveBytes: 32768}});
  const file = new File([data], 'fixture.slpk');
  const features = {
    schema,
    metadataClass: 'buildings',
    objectIdProperty: 'OBJECTID',
    sourceFeatureIdProperty: 'feature_id',
    maxAttributeBytes: 1024
  };
  return {resources, file, features};
}

/** Resolves only fixture metadata/content and locally bundled Draco assets; no public network. */
export function createI3SFixtureFetcher(resources: Record<string, ArrayBuffer>) {
  const assetFetcher = globalThis.fetch.bind(globalThis);
  return vi.fn<typeof fetch>(async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
    if (
      url.origin === window.location.origin &&
      /\/modules\/draco\/src\/libs\/draco_[^/]+\.(js|wasm)$/.test(url.pathname)
    )
      return assetFetcher(input, options);
    const path = url.pathname.replace(/^\/layers\/0\/?/, '');
    const resource =
      path === ''
        ? '3dSceneLayer.json'
        : path.startsWith('nodepages/')
          ? `${path}.json`
          : /^nodes\/[^/]+$/.test(path)
            ? `${path}/3dNodeIndexDocument.json`
            : path.includes('/textures/')
              ? `${path}.png`
              : `${path}.bin`;
    if (!resources[resource]) throw new Error(`Unexpected I3S resource: ${url.href}`);
    return new Response(resources[resource]);
  });
}
