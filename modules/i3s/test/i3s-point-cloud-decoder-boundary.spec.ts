// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import type {CoreAPI} from '@loaders.gl/loader-utils';
import {I3SLEPCCLoader} from '../src/i3s-lepcc-loader-types';
import {I3SLEPCCDecoder} from '../src/i3s-lepcc';
import {I3SPointCloudSource} from '../src/i3s-point-cloud-source';

/** Creates source metadata for a one-point node and three separately compressed attributes. */
function createLayer() {
  return {
    id: 0,
    layerType: 'PointCloud',
    version: '2.1',
    capabilities: [],
    spatialReference: {wkid: 4326},
    store: {
      profile: 'pointcloud',
      version: '2.1',
      defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
    },
    nodePages: {nodesPerPage: 1, rootIndex: 0},
    attributeInfo: [
      {key: 'color', name: 'color', encoding: 'LEPCC-RGB', resource: 2},
      {key: 'power', encoding: 'lepcc-intensity'},
      {name: 'returns', encoding: 'lepcc-flag-bytes'},
      {key: 'optional', valueType: 'UInt8'}
    ]
  };
}

/** Creates an injected source transport and decoder; magic-only buffers identify seam inputs. */
function createSource(
  options: Record<string, unknown> = {},
  decodeOverrides: Record<string, unknown> = {}
) {
  const requestedPaths: string[] = [];
  const layer = createLayer();
  const values = {
    xyz: new Float64Array([10, 20, 30]),
    rgb: new Uint8Array([255, 0, 128]),
    intensity: new Uint16Array([1200]),
    flagBytes: new Uint8Array([7]),
    ...decodeOverrides
  };
  const parse = vi.fn(async (data, loader, loaderOptions) => {
    expect(loader).toBe(I3SLEPCCLoader);
    expect(loaderOptions['i3s-lepcc']).toEqual({verifyChecksum: false});
    const type = new I3SLEPCCDecoder().getBlobType(new Uint8Array(data));
    return {type, value: values[type]};
  });
  const coreApi = {parse} as unknown as CoreAPI;
  const source = new I3SPointCloudSource(
    '/point-layer',
    {
      ...options,
      i3s: {verifyChecksum: false, ...(options.i3s as object)},
      core: {
        fetch: async (url: string) => {
          requestedPaths.push(url);
          if (url === '/point-layer') return Response.json(layer);
          if (url === '/point-layer/nodepages/0') {
            return Response.json({
              nodes: [
                {
                  resourceId: 7,
                  vertexCount: 1,
                  geometryResource: 3,
                  obb: {center: [10, 20, 30], halfSize: [1, 2, 3], quaternion: [0, 0, 0, 1]}
                }
              ]
            });
          }
          const magic = url.endsWith('/geometries/3')
            ? 'LEPCC     '
            : url.endsWith('/attributes/color/2')
              ? 'ClusterRGB'
              : url.endsWith('/attributes/power/0')
                ? 'Intensity '
                : url.endsWith('/attributes/returns/0')
                  ? 'FlagBytes '
                  : null;
          return magic
            ? new Response(new TextEncoder().encode(magic))
            : new Response(null, {status: 404});
        }
      }
    },
    coreApi
  );
  return {source, parse, requestedPaths, layer};
}

afterEach(() => vi.restoreAllMocks());

describe('I3SPointCloudSource injected decoder boundaries', () => {
  test.each([
    'uint8norm',
    'float16',
    'float32'
  ] as const)('loads separate compressed attributes into Arrow with %s colors', async colorFormat => {
    const {source, parse, requestedPaths} = createSource({i3s: {colorFormat}});
    const root = await source.getRootTile();
    const content = await source.loadTileContent(root);
    expect(content?.pointCount).toBe(1);
    expect(content?.coordinateSystem).toBe('lnglat-offsets');
    expect(content?.cartographicOrigin).toEqual([10, 20, 30]);
    expect(content?.data.data.getChild('intensity')?.get(0)).toBe(1200);
    expect(content?.data.data.getChild('flags')?.get(0)).toBe(7);
    expect(content?.data.data.getChild('optional')).toBeNull();
    const colors = Array.from(content!.data.data.getChild('COLOR_0')!.get(0));
    expect(colors[0]).toBe(colorFormat === 'uint8norm' ? 255 : 1);
    expect(colors[1]).toBe(0);
    expect(colors[2]).toBeCloseTo(
      colorFormat === 'uint8norm' ? 128 : 128 / 255,
      colorFormat === 'float16' ? 3 : 6
    );
    const colorField = content!.data.data.schema.fields.find(field => field.name === 'COLOR_0')!;
    if (colorFormat === 'float16') expect(colorField.metadata.get('componentType')).toBe('float16');
    expect(parse).toHaveBeenCalledTimes(4);
    expect(requestedPaths).toContain('/point-layer/nodes/7/geometries/3');
    expect(requestedPaths).toContain('/point-layer/nodes/7/attributes/color/2');
    expect(await source.getChildren(root)).toEqual([]);
    expect(await source.getRootTile()).toBe(root);
  });

  test('falls back to the local attribute decoders when the injected parser returns incompatible arrays', async () => {
    const colorDecoder = vi
      .spyOn(I3SLEPCCDecoder.prototype, 'decodeRgb')
      .mockReturnValue(new Uint8Array([1, 2, 3]));
    const intensityDecoder = vi
      .spyOn(I3SLEPCCDecoder.prototype, 'decodeIntensity')
      .mockReturnValue(new Uint16Array([42]));
    const flagDecoder = vi
      .spyOn(I3SLEPCCDecoder.prototype, 'decodeFlagBytes')
      .mockReturnValue(new Uint8Array([6]));
    const {source} = createSource(
      {},
      {
        rgb: new Float32Array(3),
        intensity: new Float32Array(1),
        flagBytes: new Float32Array(1)
      }
    );
    const content = await source.loadTileContent(await source.getRootTile());
    expect(Array.from(content!.data.data.getChild('COLOR_0')!.get(0))).toEqual([1, 2, 3]);
    expect(content!.data.data.getChild('intensity')!.get(0)).toBe(42);
    expect(content!.data.data.getChild('flags')!.get(0)).toBe(6);
    expect(colorDecoder).toHaveBeenCalledOnce();
    expect(intensityDecoder).toHaveBeenCalledOnce();
    expect(flagDecoder).toHaveBeenCalledOnce();
  });

  test('rejects incompatible geometry arrays and attribute counts rather than constructing inconsistent tables', async () => {
    const invalidGeometry = createSource({}, {xyz: new Float32Array(3)}).source;
    await expect(
      invalidGeometry.loadTileContent(await invalidGeometry.getRootTile())
    ).rejects.toThrow('expected xyz');
    const invalidAttribute = createSource({}, {rgb: new Uint8Array(6)}).source;
    await expect(
      invalidAttribute.loadTileContent(await invalidAttribute.getRootTile())
    ).rejects.toThrow('attribute color count mismatch');
  });
});
