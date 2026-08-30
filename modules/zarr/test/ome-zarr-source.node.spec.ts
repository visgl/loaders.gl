// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { pathToFileURL } from 'node:url';
import '@loaders.gl/polyfills';
import { expect, test } from "vitest";
import { createDataSource, fetchFile, resolvePath } from '@loaders.gl/core';
import { OMEZarrImageSource, OMEZarrSourceLoader, loadZarrConsolidatedMetadata } from '@loaders.gl/zarr';
const CONTENT_BASE = resolvePath('@loaders.gl/zarr/test/data');
const OME_FIXTURE = `${CONTENT_BASE}/ome.zarr`;
const OME_FIXTURE_URL = pathToFileURL(OME_FIXTURE).href;
const SPATIALDATA_V3_FIXTURE = `${CONTENT_BASE}/spatialdata-v3.zarr`;
const SPATIALDATA_V3_FIXTURE_URL = pathToFileURL(SPATIALDATA_V3_FIXTURE).href;
function createOMEZarrSource(url: string, options: Parameters<typeof OMEZarrSourceLoader.createDataSource>[1] = {}): OMEZarrImageSource {
    return createDataSource(url, [OMEZarrSourceLoader], options);
}
test('OMEZarrSourceLoader creates a source via createDataSource()', () => {
    const source = createOMEZarrSource(OME_FIXTURE_URL);
    expect(source instanceof OMEZarrImageSource).toBeTruthy();
});
test('OMEZarrImageSource exposes normalized metadata', async () => {
    const source = createOMEZarrSource(OME_FIXTURE_URL);
    const metadata = await source.getMetadata();
    expect(metadata.name).toBe('ome-zarr example');
    expect(metadata.width).toBe(439);
    expect(metadata.height).toBe(167);
    expect(metadata.bandCount).toBe(3);
    expect(metadata.dtype).toBe('int8');
    expect(metadata.labels).toEqual(['t', 'c', 'z', 'y', 'x']);
    expect(metadata.levels.length).toBe(2);
    expect(metadata.tileSize).toEqual({ width: 439, height: 167 });
});
test('OMEZarrImageSource#getRaster returns planar and interleaved channel data', async () => {
    const source = createOMEZarrSource(OME_FIXTURE_URL);
    const planarRaster = await source.getRaster({ channels: [0, 1, 2] });
    const interleavedRaster = await source.getRaster({ channels: [0, 2], interleaved: true });
    expect(planarRaster.width).toBe(439);
    expect(planarRaster.height).toBe(167);
    expect(planarRaster.bandCount).toBe(3);
    expect(planarRaster.dtype).toBe('int8');
    expect(Array.isArray(planarRaster.data), 'planar channel selection returns array data').toBeTruthy();
    expect(planarRaster.data[0].length).toBe(439 * 167);
    expect(Array.isArray(interleavedRaster.data), 'interleaved selection returns one typed array').toBeFalsy();
    expect(interleavedRaster.data.length).toBe(439 * 167 * 2);
    expect(interleavedRaster.bandCount).toBe(2);
});
test('OMEZarrImageSource validates pyramid levels and channels', async () => {
    const source = createOMEZarrSource(OME_FIXTURE_URL);
    await expect(source.getRaster({ level: 10 })).rejects.toThrow(/pyramid level 10 is not available/);
    await expect(source.getRaster({ channels: [3] })).rejects.toThrow(/Channel 3 is out of bounds/);
    await expect(source.getRaster({ channels: [] })).rejects.toThrow(/must include at least one channel/);
    await expect(source.getRaster({ channels: [0.5] })).rejects.toThrow(/Channel 0.5 is out of bounds/);
    await expect(source.getRaster({ t: 1 })).rejects.toThrow(/time index 1 is out of bounds/);
    await expect(source.getRaster({ z: -1 })).rejects.toThrow(/z index -1 is out of bounds/);
});
test('loadZarrConsolidatedMetadata handles .zmetadata and extracts top-level groups', async () => {
    const metadata = await loadZarrConsolidatedMetadata(OME_FIXTURE, { fetch: fetchFile });
    expect(metadata.format).toBe('v2');
  expect(metadata.metadataPath).toBe('.zmetadata');
  expect(metadata.rootAttributes).toHaveProperty('multiscales');
    expect(metadata.topLevelGroups).toEqual([]);
    expect(metadata.topLevelArrays).toEqual(['0', '1']);
});
test('OMEZarrImageSource reads a v3 SpatialData fixture', async () => {
    const source = createOMEZarrSource(SPATIALDATA_V3_FIXTURE_URL, {
        zarr: { path: 'images/example-image' }
    });
    const metadata = await source.getMetadata();
    const raster = await source.getRaster({ channels: [0, 1, 2] });
    expect(metadata.name).toBe('ome-zarr example');
    expect(metadata.width).toBe(439);
    expect(metadata.height).toBe(167);
    expect(metadata.labels).toEqual(['t', 'c', 'z', 'y', 'x']);
    expect(raster.width).toBe(439);
    expect(raster.height).toBe(167);
    expect(raster.bandCount).toBe(3);
});
test('loadZarrConsolidatedMetadata handles v3 zarr.json fixture metadata', async () => {
    const metadata = await loadZarrConsolidatedMetadata(SPATIALDATA_V3_FIXTURE, {
        fetch: fetchFile
    });
    expect(metadata.format).toBe('v3');
  expect(metadata.metadataPath).toBe('zarr.json');
  expect(metadata.rootAttributes).toMatchObject({spatialdata_attrs: {version: '0.1.0'}});
    expect(metadata.topLevelGroups).toEqual(['images', 'labels', 'points', 'shapes', 'tables']);
    expect(metadata.topLevelArrays).toEqual([]);
});
test('loadZarrConsolidatedMetadata handles zmetadata and zarr.json payloads', async () => {
    const baseUrl = 'https://example.com/spatialdata.zarr';
    const fetcher = async (url: string) => {
        if (url === `${baseUrl}/zmetadata`) {
            return new Response(JSON.stringify({
                metadata: {
                    '.zgroup': { zarr_format: 2 },
                    'images/.zgroup': { zarr_format: 2 },
                    'labels/.zgroup': { zarr_format: 2 }
                }
            }), { status: 200 });
        }
        return new Response(null, { status: 404 });
    };
    const zmetadata = await loadZarrConsolidatedMetadata(baseUrl, {
        metadataPath: 'zmetadata',
        fetch: fetcher
    });
    expect(zmetadata.format).toBe('v2');
    expect(zmetadata.topLevelGroups).toEqual(['images', 'labels']);
    expect(zmetadata.topLevelArrays).toEqual([]);
    const zarrJson = await loadZarrConsolidatedMetadata(baseUrl, {
        metadataPath: 'zarr.json',
        fetch: async () => new Response(JSON.stringify({
            consolidated_metadata: {
                metadata: {
                    images: { node_type: 'group' },
                    'images/example': { node_type: 'group' },
                    labels: { node_type: 'group' }
                }
            }
        }), { status: 200 })
    });
    expect(zarrJson.format).toBe('v3');
    expect(zarrJson.topLevelGroups).toEqual(['images', 'labels']);
    expect(zarrJson.topLevelArrays).toEqual([]);
});
test('loadZarrConsolidatedMetadata auto probing skips non-consolidated zarr.json', async () => {
    const baseUrl = 'https://example.com/mixed.zarr';
    const metadata = await loadZarrConsolidatedMetadata(baseUrl, {
        fetch: async (url) => {
            if (url.endsWith('/zarr.json')) {
                return new Response(JSON.stringify({ zarr_format: 3, node_type: 'group' }));
            }
            if (url.endsWith('/.zmetadata')) {
                return new Response(JSON.stringify({
                    metadata: {
                        '.zgroup': { zarr_format: 2 },
                        'image/.zarray': { shape: [1, 1] }
                    }
                }));
            }
            return new Response(null, { status: 404 });
        }
    });
    expect(metadata.format).toBe('v2');
    expect(metadata.topLevelArrays).toEqual(['image']);
});
