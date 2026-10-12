// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createBrowserTilesetConversionSource} from '@loaders.gl/tile-converter/v5/core';
import {createSelectedMeshConversionSource} from '@loaders.gl/tile-converter/v5/adapters';
import {createTriangle} from './utils/tile-browser-conversion';

/** Declares native ECEF and an optional epoch using the source's supported CRS metadata. */
function createSpatialExtension(epoch?: number) {
  return {
    EXT_geospatial_crs: {
      format: 'wkid',
      extensions: {
        EXT_geospatial_crs_wkid: {
          authority: 'EPSG',
          wkid: 4978,
          ...(epoch === undefined ? {} : {epoch})
        }
      }
    }
  };
}

test.each([
  [2020, 2021, true, false],
  [2020, undefined, true, false],
  [undefined, 2020, true, false],
  [2020, 2020, true, true],
  [2020, undefined, false, true],
  [undefined, undefined, true, true]
] as const)('selected epoch root=%s child=%s declared=%s compatible=%s', async (rootEpoch, childEpoch, declared, compatible) => {
  const root = {
    asset: {version: '1.1'},
    extensions: createSpatialExtension(rootEpoch),
    root: {
      boundingVolume: {sphere: [6378137, 0, 0, 10]},
      geometricError: 1,
      transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 6378137, 0, 0, 1],
      content: {uri: 'nested.json'}
    }
  };
  const nested = {
    asset: {version: '1.1'},
    ...(declared ? {extensions: createSpatialExtension(childEpoch)} : {}),
    root: {
      boundingVolume: {sphere: [0, 0, 0, 1]},
      geometricError: 0,
      content: {uri: 'mesh.glb'}
    }
  };
  const fetcher: typeof fetch = async input =>
    new Response(
      String(input).endsWith('root.json')
        ? JSON.stringify(root)
        : String(input).endsWith('nested.json')
          ? JSON.stringify(nested)
          : createTriangle()
    );
  const rawSource = createBrowserTilesetConversionSource({
    input: 'https://example.invalid/root.json',
    maxInputBytes: 4096,
    maxInputResources: 4,
    maxTilesetDocuments: 2,
    inspectNestedTilesets: true,
    fetcher
  });
  const inspection = await rawSource.inspect();
  const signal = new AbortController().signal;
  const {source, spatialContext} = await createSelectedMeshConversionSource(inspection, {
    resourceIds: [inspection.resources[0].resourceId],
    signal,
    fetcher,
    dracoLibraryOptions: {decoderProfile: 'full'}
  });
  const resources = [];
  const read = async () => {
    for await (const resource of source.read(await source.inspect(signal), signal))
      resources.push(resource);
  };
  if (compatible) {
    await read();
    expect(resources).toHaveLength(1);
    expect(spatialContext.spatialReference.coordinateEpoch).toBe(rootEpoch);
  } else {
    await expect(read()).rejects.toMatchObject({code: 'MESH_SOURCE_EPOCH_MISMATCH'});
    expect(resources).toEqual([]);
  }
});
