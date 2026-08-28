import {fetchFile, isBrowser} from '@loaders.gl/core';
import {expect, test} from 'vitest';
import {NetCDFSource, NetCDFSourceLoader} from '../src/netcdf-source-loader';

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

test('NetCDF source validates cheap query options before loading data', async () => {
  const source = new NetCDFSource(new Blob());
  await expect(
    source.getRaster({
      bounds: [
        [0, 0],
        [1, 1]
      ]
    })
  ).rejects.toThrow('bounds are not supported');
  await expect(source.getRaster({level: 1})).rejects.toThrow('levels are not supported');
  await expect(source.getRaster({width: 1})).rejects.toThrow('resampling is not supported');
  await expect(source.getRaster({channels: [0]})).rejects.toThrow('named variables');
  expect(NetCDFSourceLoader.testURL('data/file.nc?download=1')).toBe(true);
  expect(NetCDFSourceLoader.testURL('data/file.bin')).toBe(false);
  expect(NetCDFSourceLoader.createDataSource(new Blob(), {})).toBeInstanceOf(NetCDFSource);
});

test('NetCDF source materializes every supported numeric type and slice form', async () => {
  const dimensions = [
    {name: 'row', size: 2, recordId: -1, recordName: ''},
    {name: 'column', size: 2, recordId: -1, recordName: ''},
    {name: 'single', size: 4, recordId: -1, recordName: ''}
  ];
  const typeNames = ['byte', 'ubyte', 'short', 'ushort', 'int', 'uint', 'float', 'double'];
  const variables = [
    ...typeNames.map(type => ({
      name: type,
      dimensions: [0, 1],
      attributes: type === 'int' ? [{name: '_FillValue', type: 'int', value: '-999'}] : [],
      type,
      size: 4,
      offset: 0,
      record: false
    })),
    {
      name: 'intFlat',
      dimensions: [2],
      attributes: [],
      type: 'int',
      size: 4,
      offset: 0,
      record: false
    },
    {
      name: 'text',
      dimensions: [0],
      attributes: [],
      type: 'char',
      size: 2,
      offset: 0,
      record: false
    }
  ];
  const header = {
    version: 1,
    recordDimension: {length: 0, id: -1, name: '', recordStep: 0},
    dimensions,
    attributes: [],
    variables
  } as any;
  const source = new NetCDFSource(new Blob());
  (source as any).loadReader = async () => ({
    header,
    getDataVariable: variable =>
      variable.name === 'text' ? ['a', 'b'] : new Float64Array([1, 2, 3, 4])
  });

  const expectedConstructors = [
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
  ];
  for (let index = 0; index < typeNames.length; index++) {
    const raster = await source.getRaster({
      variables: [typeNames[index]],
      slices: {row: 1, column: [0, 2]}
    });
    expect(raster.data).toBeInstanceOf(expectedConstructors[index]);
    expect(raster.width).toBe(2);
    expect(raster.height).toBe(1);
    expect(raster.metadata.dimensions).toEqual(['column']);
  }
  expect((await source.getRaster({variables: ['int']})).noData).toBe(-999);
  await expect(source.getRaster({variables: ['int', 'float']})).rejects.toThrow(
    /same shape and numeric type/
  );
  await expect(source.getRaster({variables: ['int', 'intFlat']})).rejects.toThrow(
    /same shape and numeric type/
  );
  await expect(source.getRaster({variables: ['int', 'int']})).rejects.toThrow(/duplicates/);
  await expect(source.getRaster({variables: ['text']})).rejects.toThrow(/not supported as raster/);
  await expect(source.getRaster({variables: ['int'], slices: {row: -1}})).rejects.toThrow(
    /must be an index/
  );
  await expect(source.getRaster({variables: ['int'], slices: {row: [0, 3]}})).rejects.toThrow(
    /half-open range/
  );

  (source as any).loadReader = async () => ({
    header,
    getDataVariable: () => [
      ['not numeric', 'values'],
      ['at', 'all']
    ]
  });
  await expect(source.getRaster({variables: ['int']})).rejects.toThrow(
    /must contain numeric values/
  );
});
