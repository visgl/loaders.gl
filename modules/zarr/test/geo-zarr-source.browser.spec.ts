import { expect, test } from "vitest";
import { createDataSource } from '@loaders.gl/core';
import type { RasterBoundingBox, RasterViewport } from '@loaders.gl/loader-utils';
import { GeoZarrRasterSource, GeoZarrSourceLoader, type GeoZarrSourceLoaderOptions } from '@loaders.gl/zarr';
const SPATIALDATA_V3_FIXTURE_URL = '/modules/zarr/test/data/spatialdata-v3.zarr';
test('GeoZarrSourceLoader supports browser-relative store metadata', async () => {
    const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [GeoZarrSourceLoader], {
        zarr: { path: 'images/example-image' },
        geozarr: { array: '0' }
    });
    const metadata = await source.getMetadata();
    expect(metadata.crs).toBe('EPSG:4326');
    expect(metadata.spatialDimensions).toEqual(['y', 'x']);
    expect(metadata.boundingBox).toEqual([
        [-20, -6.7],
        [23.9, 10]
    ]);
});
test('GeoZarrRasterSource reads regular CF coordinates and raster windows in browsers', async () => {
    const source = createInMemoryGeoZarrSource();
    const metadata = await source.getMetadata();
    const raster = await source.getRaster({
        viewport: createViewport([
            [100.5, 8.5],
            [102.5, 10.5]
        ], 'EPSG:4326')
    });
    expect(metadata.name).toBe('Air temperature');
    expect(metadata.crs).toBe('EPSG:4326');
    expect(metadata.transform).toEqual([1, 0, 99.5, 0, -1, 10.5]);
    expect(metadata.boundingBox).toEqual([
        [99.5, 8.5],
        [102.5, 10.5]
    ]);
    expect(metadata.selectionDimensions).toEqual([{ name: 'time', size: 2, defaultIndex: 1 }]);
    expect(metadata.noData).toBe(255);
    expect(raster.width).toBe(2);
    expect(raster.height).toBe(2);
    expect(raster.dtype).toBe('uint8');
    expect(Array.from(raster.data as Uint8Array)).toEqual([12, 13, 15, 16]);
});
test('GeoZarrRasterSource validates browser viewport and dimension selections', async () => {
    const source = createInMemoryGeoZarrSource();
    const viewport = createViewport([
        [100, 9],
        [102, 10]
    ], 'EPSG:3857');
    await expect(source.getRaster({ viewport })).rejects.toThrow(/does not support reprojection/);
    viewport.crs = 'EPSG:4326';
    await expect(source.getRaster({ viewport, selection: { channel: 0 } })).rejects.toThrow(/Unknown GeoZarr selection dimension channel/);
    await expect(source.getRaster({ viewport, selection: { time: 2 } })).rejects.toThrow(/time index 2 is out of bounds/);
    await expect(source.getRaster({ viewport, resampleMethod: 'bilinear' })).rejects.toThrow(/native nearest-neighbor windows only/);
});
/** Creates a GeoZarr source backed by a small in-memory CF/xarray-style Zarr v3 store. */
function createInMemoryGeoZarrSource(): GeoZarrRasterSource {
    const baseUrl = 'https://example.com/browser-cf.zarr';
    const options: GeoZarrSourceLoaderOptions = {
        core: { loadOptions: { core: { fetch: createCFZarrFetcher(baseUrl) } } },
        zarr: { requireConsolidatedMetadata: false },
        geozarr: { array: 'temperature', defaultSelection: { time: 1 } }
    };
    return new GeoZarrRasterSource(baseUrl, options);
}
/** Creates the minimal viewport shape accepted by raster sources. */
function createViewport(bounds: RasterBoundingBox, coordinateReferenceSystem?: string): RasterViewport {
    const [[minimumX, minimumY], [maximumX, maximumY]] = bounds;
    return {
        id: 'geo-zarr-browser-test',
        width: 256,
        height: 256,
        zoom: 0,
        center: [(minimumX + maximumX) / 2, (minimumY + maximumY) / 2],
        crs: coordinateReferenceSystem,
        bounds,
        project: coordinates => coordinates,
        unprojectPosition: position => [position[0], position[1], position[2] || 0]
    };
}
/** Creates an in-memory HTTP view of a small xarray-style Zarr v3 climate store. */
function createCFZarrFetcher(baseUrl: string): typeof fetch {
    const responses = new Map<string, BodyInit>([
        [`${baseUrl}/zarr.json`, encodeJson(createGroupMetadata())],
        [
            `${baseUrl}/temperature/zarr.json`,
            encodeJson(createArrayMetadata([2, 2, 3], [1, 2, 3], 'uint8', ['time', 'latitude', 'longitude'], {
                long_name: 'Air temperature',
                _FillValue: 255
            }))
        ],
        [`${baseUrl}/temperature/c/0/0/0`, new Uint8Array([1, 2, 3, 4, 5, 6])],
        [`${baseUrl}/temperature/c/1/0/0`, new Uint8Array([11, 12, 13, 14, 15, 16])],
        [
            `${baseUrl}/latitude/zarr.json`,
            encodeJson(createArrayMetadata([2], [2], 'float64', ['latitude'], {
                standard_name: 'latitude',
                units: 'degrees_north'
            }))
        ],
        [`${baseUrl}/latitude/c/0`, encodeFloat64([10, 9])],
        [
            `${baseUrl}/longitude/zarr.json`,
            encodeJson(createArrayMetadata([3], [3], 'float64', ['longitude'], {
                standard_name: 'longitude',
                units: 'degrees_east'
            }))
        ],
        [`${baseUrl}/longitude/c/0`, encodeFloat64([100, 101, 102])]
    ]);
    return (async (input) => {
        const url = input instanceof Request ? input.url : String(input);
        const body = responses.get(url);
        return body ? new Response(body) : new Response(null, { status: 404 });
    }) as typeof fetch;
}
/** Creates minimal Zarr v3 group metadata. */
function createGroupMetadata(): Record<string, unknown> {
    return { zarr_format: 3, node_type: 'group', attributes: {} };
}
/** Creates minimal uncompressed Zarr v3 array metadata. */
function createArrayMetadata(shape: number[], chunks: number[], dataType: 'uint8' | 'float64', dimensionNames: string[], attributes: Record<string, unknown>): Record<string, unknown> {
    return {
        zarr_format: 3,
        node_type: 'array',
        shape,
        data_type: dataType,
        chunk_grid: { name: 'regular', configuration: { chunk_shape: chunks } },
        chunk_key_encoding: { name: 'default', configuration: { separator: '/' } },
        codecs: [{ name: 'bytes', configuration: { endian: 'little' } }],
        fill_value: 0,
        dimension_names: dimensionNames,
        attributes
    };
}
/** Encodes Zarr metadata as UTF-8 bytes. */
function encodeJson(value: unknown): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(value));
}
/** Encodes float64 coordinate values using the explicit Zarr little-endian byte order. */
function encodeFloat64(values: number[]): Uint8Array {
    const buffer = new ArrayBuffer(values.length * Float64Array.BYTES_PER_ELEMENT);
    const dataView = new DataView(buffer);
    values.forEach((value, index) => dataView.setFloat64(index * Float64Array.BYTES_PER_ELEMENT, value, true));
    return new Uint8Array(buffer);
}
