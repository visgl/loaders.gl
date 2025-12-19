import {loadI3STile} from '@loaders.gl/i3s/test/test-utils/load-utils';

export default async function i3sLoaderBench(suite) {
  suite.group('i3sLoader');

  suite.addAsync('Geometry with textures (I3SLoader) - sequential loading', async () => {
    await loadI3STile({i3s: {useDracoGeometry: false, useCompressedTextures: false}});
  });

  suite.addAsync(
    'Geometry with textures (I3SLoader) - parallel loading',
    {_throughput: 100},
    async () => {
      await loadI3STile({i3s: {useDracoGeometry: false, useCompressedTextures: false}});
    }
  );

  suite.addAsync('Compressed geometry with textures (I3SLoader) - sequential loading', async () => {
    await loadI3STile({i3s: {useDracoGeometry: true, useCompressedTextures: false}});
  });

  suite.addAsync(
    'Compressed geometry with textures (I3SLoader) - parallel loading',
    {_throughput: 100},
    async () => {
      await loadI3STile({i3s: {useDracoGeometry: true, useCompressedTextures: false}});
    }
  );

  suite.addAsync(
    'Compressed geometry with compressed texture (I3SLoader) - sequential loading',
    async () => {
      await loadI3STile({i3s: {useDracoGeometry: true, useCompressedTextures: true}});
    }
  );

  suite.addAsync(
    'Compressed geometry with compressed textures (I3SLoader) - parallel loading',
    {_throughput: 100},
    async () => {
      await loadI3STile({i3s: {useDracoGeometry: true, useCompressedTextures: true}});
    }
  );
}
