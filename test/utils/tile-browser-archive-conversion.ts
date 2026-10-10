import {vi} from 'vitest';
import {Tiles3DArchiveWriter} from '@loaders.gl/3d-tiles';
import {createTriangle} from './tile-browser-conversion';

/** Creates a tiny archive with a nested content path and explicit ECEF placement. */
export async function createTiles3DConversionArchive() {
  const document = {
    asset: {version: '1.1', gltfUpAxis: 'Y'},
    geometricError: 2,
    root: {
      boundingVolume: {region: [-0.001, -0.001, 0.001, 0.001, 0, 200]},
      geometricError: 2,
      transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 6378137, 0, 0, 1],
      content: {uri: 'meshes/triangle.glb'}
    }
  };
  const data = await Tiles3DArchiveWriter.encode!({
    'tileset.json': new TextEncoder().encode(JSON.stringify(document)).buffer,
    'meshes/triangle.glb': createTriangle()
  });
  return new File([data], 'fixture.3tz');
}

/** Supplies exact validator-bearing HTTP ranges, with mutable identity for replacement checks. */
export function createArchiveRangeFetcher(bytes: Uint8Array) {
  const identity = {etag: '"fixture-v1"'};
  const assetFetcher = globalThis.fetch.bind(globalThis);
  const fetcher = vi.fn<typeof fetch>(async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
    if (url.origin === window.location.origin && /\/modules\/draco\/src\/libs\//.test(url.pathname))
      return assetFetcher(input, options);
    options?.signal?.throwIfAborted();
    const range = new Headers(options?.headers).get('Range');
    const match = /^bytes=(\d+)-(\d+)$/.exec(range ?? '');
    if (!match) throw new Error('Archive transport must use byte ranges');
    const start = Number(match[1]);
    const end = Number(match[2]);
    return new Response(bytes.slice(start, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${start}-${end}/${bytes.length}`, ETag: identity.etag}
    });
  });
  return {fetcher, identity};
}
