import {fetchFile} from '@loaders.gl/core';
import {isBrowser} from '@loaders.gl/core/loader-utils';
import {expect, test} from 'vitest';
import {
  NetCDFSource,
  NetCDFSourceLoaderWithParser as NetCDFSourceLoader
} from '../../src/netcdf/netcdf-source-loader';

const NETCDF_FIXTURE = '@loaders.gl/scientific/test/netcdf/data/madis-sao.nc';

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
  await expect(source.getRaster({variables: ['int'], slices: {row: 2}})).rejects.toThrow(
    /must be an index/
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

test('NetCDF source handles scalar variables and files without raster variables', async () => {
  const header = {
    version: 1,
    recordDimension: {length: 0, id: -1, name: '', recordStep: 0},
    dimensions: [],
    attributes: [],
    variables: [
      {
        name: 'scalar',
        dimensions: [],
        attributes: [],
        type: 'double',
        size: 8,
        offset: 0,
        record: false
      }
    ]
  } as any;
  const source = new NetCDFSource(new Blob());
  (source as any).loadReader = async () => ({header, getDataVariable: () => 42});

  await expect(source.getRaster()).rejects.toThrow(/no numeric variables/);
  const raster = await source.getRaster({variables: ['scalar']});
  expect(raster).toMatchObject({width: 1, height: 1, bandCount: 1, dtype: 'float64', noData: null});
  expect(Array.from(raster.data as Float64Array)).toEqual([42]);
  expect(raster.metadata).toMatchObject({dimensions: [], shape: [], slices: {}});

  header.variables[0].attributes = [{name: 'missing_value', type: 'double', value: '0'}];
  expect((await source.getRaster({variables: ['scalar']})).noData).toBe(0);
  header.variables[0].attributes[0].value = 'unknown';
  expect((await source.getRaster({variables: ['scalar']})).noData).toBeNull();
});

test('NetCDF source exposes every primitive field type in query metadata', async () => {
  const primitiveTypes = [
    ['byte', 'int8'],
    ['ubyte', 'uint8'],
    ['short', 'int16'],
    ['ushort', 'uint16'],
    ['int', 'int32'],
    ['uint', 'uint32'],
    ['int64', 'int64'],
    ['uint64', 'uint64'],
    ['float', 'float32'],
    ['double', 'float64'],
    ['char', 'utf8'],
    ['string', 'utf8'],
    ['opaque', 'binary']
  ] as const;
  const header = {
    version: 1,
    recordDimension: {length: 0, id: 0, name: 'record', recordStep: 0},
    dimensions: [{name: 'record', size: 0, recordId: 0, recordName: 'record'}],
    attributes: [],
    variables: primitiveTypes.map(([type]) => ({
      name: type,
      dimensions: [0],
      attributes: [{name: 'units', type: 'char', value: 'sample'}],
      type,
      size: 0,
      offset: 0,
      record: true
    }))
  } as any;
  const source = new NetCDFSource('https://example.com/all-types.nc');
  (source as any).headerPromise = Promise.resolve({header, byteLength: 128});

  const metadata = await source.getQueryMetadata();
  expect(metadata.name).toBe('all-types.nc');
  expect(metadata.statistics?.rowCount).toBeUndefined();
  expect(metadata.schema.fields.map(field => field.type)).toEqual(
    primitiveTypes.map(([, schemaType]) => schemaType)
  );
  expect(metadata.schema.fields[0].metadata).toMatchObject({
    dimensions: 'record[0]',
    units: 'sample'
  });
});

test.runIf(isBrowser)(
  'NetCDF source retries a failed header and reads full responses',
  async () => {
    const response = await fetchFile(NETCDF_FIXTURE);
    const bytes = await response.arrayBuffer();
    const source = new NetCDFSource('fixture.nc');
    let requests = 0;
    source.fetch = async () => {
      requests++;
      return requests === 1
        ? new Response(null, {status: 503})
        : new Response(bytes, {status: 200, headers: {'Content-Length': String(bytes.byteLength)}});
    };

    await expect(source.getQueryMetadata()).rejects.toThrow('status 503');
    const metadata = await source.getQueryMetadata();
    expect(metadata.name).toBe('fixture.nc');
    expect(metadata.statistics?.byteLength).toBe(bytes.byteLength);
    expect(requests).toBe(2);

    const raster = await source.getRaster({variables: ['wmoId'], slices: {recNum: [0, 1]}});
    expect(raster.width).toBe(1);
    expect(requests).toBe(3);

    source.fetch = async () => new Response(null, {status: 503});
    await expect(source.getRaster({variables: ['wmoId']})).rejects.toThrow('status 503');
  }
);
