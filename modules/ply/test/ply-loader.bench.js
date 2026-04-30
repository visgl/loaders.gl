import {fetchFile, load, parse} from '@loaders.gl/core';
import {PLYLoader, PLYWorkerLoader} from '@loaders.gl/ply';

const ASCII_PLY_URL = '@loaders.gl/ply/test/data/cube_att.ply';
const BINARY_PLY_URL = '@loaders.gl/ply/test/data/bunny.ply';
const GAUSSIAN_SPLAT_PLY_URL = '@loaders.gl/ply/test/data/gaussian/train-1000.ply';

// TODO - use parseInBatches or remove
// import {createReadStream, makeStreamIterator} from '@loaders.gl/core';
// import {_PLYStreamLoader} from '@loaders.gl/ply';

export default async function PLYLoaderBench(bench) {
  const gaussianSplatResponse = await fetchFile(GAUSSIAN_SPLAT_PLY_URL);
  const gaussianSplatArrayBuffer = await gaussianSplatResponse.arrayBuffer();

  return (
    bench
      // TODO - add parse from arrayBuffer (no load)

      .group('PLYLoader (ASCII)')
      .addAsync('Atomic parsing', async () => {
        await load(ASCII_PLY_URL, PLYLoader);
      })
      .addAsync('Worker parsing', async () => {
        // Once binary is transferred to worker it cannot be read from the main thread
        // Duplicate it here to avoid breaking other tests
        const response = await fetchFile(ASCII_PLY_URL);
        const arrayBuffer = await response.arrayBuffer();
        await load(arrayBuffer, PLYWorkerLoader);
      })
      // .addAsync('Stream parsing', async () => {
      //   const stream = await createReadStream('@loaders.gl/ply/test/data/cube_att.ply');
      //   await _PLYStreamLoader.parseStream(getStreamIterator(stream));
      // })

      .group('PLYLoader (Binary)')
      .addAsync('Atomic parsing', async () => {
        await load(BINARY_PLY_URL, PLYLoader);
      })
      .addAsync('Worker parsing', async () => {
        const response = await fetchFile(BINARY_PLY_URL);
        const arrayBuffer = await response.arrayBuffer();
        await load(arrayBuffer, PLYWorkerLoader);
      })

      .group('PLYLoader (Gaussian Splat Binary Arrow)')
      .addAsync('parse arrow-first arrow-table', {multiplier: 1000, unit: 'splats'}, async () => {
        await parse(gaussianSplatArrayBuffer, PLYLoader, {
          ply: {shape: 'arrow-table'}
        });
      })
      .addAsync('parse arrow-first mesh', {multiplier: 1000, unit: 'splats'}, async () => {
        await parse(gaussianSplatArrayBuffer, PLYLoader, {
          ply: {shape: 'mesh'}
        });
      })
      .addAsync('parse legacy mesh', {multiplier: 1000, unit: 'splats'}, async () => {
        await parse(gaussianSplatArrayBuffer, PLYLoader, {
          ply: {_useLegacyParser: true}
        });
      })
      .addAsync(
        'parse legacy mesh conversion to arrow-table',
        {multiplier: 1000, unit: 'splats'},
        async () => {
          await parse(gaussianSplatArrayBuffer, PLYLoader, {
            ply: {shape: 'arrow-table', _useLegacyParser: true}
          });
        }
      )
  );
}
