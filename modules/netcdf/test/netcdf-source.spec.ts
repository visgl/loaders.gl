import {fetchFile, isBrowser} from '@loaders.gl/core';
import {expect, test} from 'vitest';
import {NetCDFSource} from '../src/netcdf-source-loader';

const NETCDF_FIXTURE = '@loaders.gl/netcdf/test/data/madis-sao.nc';

test.runIf(isBrowser)('NetCDF source discovers raster metadata from a Blob', async () => {
  const response = await fetchFile(NETCDF_FIXTURE);
  const source = new NetCDFSource(new Blob([await response.arrayBuffer()]));
  const metadata = await source.getQueryMetadata();

  expect(metadata.queryType).toBe('raster');
  expect(metadata.execution).toEqual({status: 'supported', method: 'getRaster'});
  expect(metadata.capabilities.raster?.variables).toBe('pushdown');
  expect(metadata.capabilities.raster?.slices).toBe('residual');
  expect(metadata.statistics?.rowCount).toBe(178);
  expect(metadata.columns.map(column => column.name)).toContain('wmoId');
  expect(metadata.columns.find(column => column.name === 'wmoId')?.metadata?.dimensions).toBe(
    'recNum[178]'
  );
  expect(metadata.schema.metadata['dimension:recNum']).toBe('178');
});

test.runIf(isBrowser)('NetCDF source reads typed variable dimension slices', async () => {
  const response = await fetchFile(NETCDF_FIXTURE);
  const source = new NetCDFSource(new Blob([await response.arrayBuffer()]));
  const raster = await source.getRaster({
    variables: ['wmoId'],
    slices: {recNum: [1, 4]}
  });

  expect(raster.width).toBe(3);
  expect(raster.height).toBe(1);
  expect(raster.bandCount).toBe(1);
  expect(raster.dtype).toBe('int32');
  expect(Array.from(raster.data as Int32Array).slice(0, 2)).toEqual([71415, 71408]);
  expect(raster.metadata).toMatchObject({
    variables: ['wmoId'],
    dimensions: ['recNum'],
    shape: [3]
  });
});

test.runIf(isBrowser)('NetCDF source validates variables, slices, and cancellation', async () => {
  const response = await fetchFile(NETCDF_FIXTURE);
  const source = new NetCDFSource(new Blob([await response.arrayBuffer()]));

  await expect(source.getRaster({variables: ['missing']})).rejects.toThrow('variable not found');
  await expect(
    source.getRaster({variables: ['wmoId'], slices: {recNum: [0, 1000]}})
  ).rejects.toThrow('half-open range');
  await expect(source.getRaster({variables: ['wmoId'], slices: {missing: 0}})).rejects.toThrow(
    'dimension not found'
  );

  const controller = new AbortController();
  controller.abort();
  await expect(
    source.getRaster({variables: ['wmoId'], signal: controller.signal})
  ).rejects.toMatchObject({name: 'AbortError'});
});

test.runIf(isBrowser)(
  'NetCDF source reads a remote header with progressive ranges and caches it',
  async () => {
    const response = await fetchFile(NETCDF_FIXTURE);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const requestedRanges: string[] = [];
    const source = new NetCDFSource('fixture.nc');
    source.fetch = async (_url, options) => {
      const range = new Headers(options?.headers).get('Range') || '';
      requestedRanges.push(range);
      if (requestedRanges.length === 1) {
        return new Response(new Uint8Array(64 * 1024), {
          status: 206,
          headers: {'Content-Range': `bytes 0-${64 * 1024 - 1}/${bytes.length}`}
        });
      }
      return new Response(bytes, {
        status: 206,
        headers: {'Content-Range': `bytes 0-${bytes.length - 1}/${bytes.length}`}
      });
    };

    const metadata = await source.getQueryMetadata();
    await source.getQueryMetadata();

    expect(metadata.statistics?.byteLength).toBe(bytes.length);
    expect(requestedRanges).toEqual(['bytes=0-65535', 'bytes=0-131071']);
  }
);

test.runIf(isBrowser)('NetCDF source reports remote failures and honors cancellation', async () => {
  const source = new NetCDFSource('fixture.nc');
  source.fetch = async () => new Response(null, {status: 503});
  await expect(source.getQueryMetadata()).rejects.toThrow('status 503');

  const controller = new AbortController();
  controller.abort();
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow();
});
