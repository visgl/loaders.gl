import {fetchFile, load, createReadStream, makeStreamIterator} from '@loaders.gl/core';
import {PLYLoader, PLYWorkerLoader, _PLYStreamLoader} from '@loaders.gl/ply';

export default function PLYLoaderBench(bench) {
  return (
    bench
      // TODO - add parse from arrayBuffer (no load)

      .group('PLYLoader (ASCII)')
      .addAsync('Atomic parsing', async () => {
        await load('@loaders.gl/ply/test/data/cube_att.ply', PLYLoader);
      })
      .addAsync('Worker parsing', async () => {
        // Once binary is transferred to worker it cannot be read from the main thread
        // Duplicate it here to avoid breaking other tests
        const response = await fetchFile('@loaders.gl/ply/test/data/bun_zipper.ply');
        const arrayBuffer = await response.arrayBuffer();
        await load(arrayBuffer, PLYWorkerLoader);
      })
      .addAsync('Stream parsing', async () => {
        const stream = await createReadStream('@loaders.gl/ply/test/data/cube_att.ply');
        await _PLYStreamLoader.parseStream(makeStreamIterator(stream));
      })

      .group('PLYLoader (Binary)')
      .addAsync('Atomic parsing', async () => {
        await load('@loaders.gl/ply/test/data/cube_att.ply', PLYLoader);
      })
      .addAsync('Worker parsing', async () => {
        const response = await fetchFile('@loaders.gl/ply/test/data/bun_zipper.ply');
        const arrayBuffer = await response.arrayBuffer();
        await load(arrayBuffer, PLYWorkerLoader);
      })
  );
}
