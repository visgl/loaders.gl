import {readFile, loadFile, createReadStream, getStreamIterator} from '@loaders.gl/core';
import {PLYLoader, PLYWorkerLoader, PLYStreamingLoader} from '@loaders.gl/ply';

export default function PLYLoaderBench(bench) {

  return bench
    // TODO - add parse from arrayBuffer (no load)

    .group('PLYLoader (ASCII)')
    .addAsync('Atomic parsing', async () => {
      await loadFile('@loaders.gl/ply/../data/cube_att.ply', PLYLoader);
    })
    .addAsync('Worker parsing', async () => {
      // Once binary is transferred to worker it cannot be read from the main thread
      // Duplicate it here to avoid breaking other tests
      const arrayBuffer = await readFile('@loaders.gl/ply/../data/bun_zipper.ply');
      await loadFile(arrayBuffer, PLYWorkerLoader);
    })
    .addAsync('Stream parsing', async () => {
      const stream = await createReadStream('@loaders.gl/ply/../data/cube_att.ply');
      await PLYStreamingLoader.parseAsIterator(getStreamIterator(stream));
    })

    .group('PLYLoader (Binary)')
    .addAsync('Atomic parsing', async () => {
      await loadFile('@loaders.gl/ply/../data/cube_att.ply', PLYLoader);
    })
    .addAsync('Worker parsing', async () => {
      const arrayBuffer = await readFile('@loaders.gl/ply/../data/bun_zipper.ply');
      await loadFile(arrayBuffer, PLYWorkerLoader);
    });

}
