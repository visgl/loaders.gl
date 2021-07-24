import {describe, it, expect} from 'test/utils/expect-assertions';
import {NetCDFReader} from '@loaders.gl/netcdf';
import {fetchFile} from '@loaders.gl/core';

const DATA_PATH = `@loaders.gl/netcdf/test/data`;

describe('NetCDFReader', () => {
  it('Throws on non NetCDF file', async () => {
    const response = await fetchFile(`${DATA_PATH}/not_nc.txt`);
    const data = await response.arrayBuffer();
    expect(function notValid() {
      return new NetCDFReader(data);
    }).toThrow('Not a valid NetCDF v3.x file: should start with CDF');
  });

  it('read header information', async () => {
    const response = await fetchFile(`${DATA_PATH}/madis-sao.nc`);
    const data = await response.arrayBuffer();

    const reader = new NetCDFReader(data);
    expect(reader.version).toBe('classic format');
    expect(reader.recordDimension).toStrictEqual({
      length: 178,
      id: 21,
      name: 'recNum',
      recordStep: 1220
    });
    expect(reader.dimensions).toStrictEqual([
      {name: 'maxAutoStaLen', size: 6},
      {name: 'maxAutoWeather', size: 5},
      {name: 'maxAutoWeaLen', size: 12},
      {name: 'maxCldTypeLen', size: 5},
      {name: 'maxCloudTypes', size: 5},
      {name: 'maxDataSrcLen', size: 8},
      {name: 'maxRepLen', size: 5},
      {name: 'maxSAOLen', size: 256},
      {name: 'maxSkyCover', size: 5},
      {name: 'maxSkyLen', size: 8},
      {name: 'maxSkyMethLen', size: 3},
      {name: 'maxStaNamLen', size: 5},
      {name: 'maxWeatherNum', size: 5},
      {name: 'maxWeatherLen', size: 40},
      {name: 'QCcheckNum', size: 10},
      {name: 'QCcheckNameLen', size: 60},
      {name: 'ICcheckNum', size: 55},
      {name: 'ICcheckNameLen', size: 72},
      {name: 'maxStaticIds', size: 350},
      {name: 'totalIdLen', size: 6},
      {name: 'nInventoryBins', size: 24},
      {name: 'recNum', size: 0}
    ]);

    expect(reader.globalAttributes[0]).toStrictEqual({
      name: 'cdlDate',
      type: 'char',
      value: '20010327'
    });
    expect(reader.globalAttributes[3]).toStrictEqual({
      name: 'filePeriod',
      type: 'int',
      value: 3600
    });

    expect(reader.variables[0]).toStrictEqual({
      name: 'nStaticIds',
      dimensions: [],
      attributes: [
        {
          name: '_FillValue',
          type: 'int',
          value: 0
        }
      ],
      type: 'int',
      size: 4,
      offset: 39208,
      record: false
    });
    expect(reader.variables[11]).toStrictEqual({
      name: 'wmoId',
      dimensions: [21],
      attributes: [
        {name: 'long_name', type: 'char', value: 'WMO numeric station ID'},
        {name: '_FillValue', type: 'int', value: -2147483647},
        {name: 'valid_range', type: 'int', value: [1, 89999]},
        {name: 'reference', type: 'char', value: 'station table'}
      ],
      type: 'int',
      size: 4,
      offset: 48884,
      record: true
    });
  });

  it('read non-record variable', async () => {
    const response = await fetchFile(`${DATA_PATH}/madis-sao.nc`);
    const data = await response.arrayBuffer();
    const reader = new NetCDFReader(data);

    expect(reader.getDataVariable('nStaticIds')[0]).toBe(145);
  });

  it('read 2 dimensional variable', async () => {
    const response = await fetchFile(`${DATA_PATH}/ichthyop.nc`);
    const data = await response.arrayBuffer();
    const reader = new NetCDFReader(data);
    expect(reader.getDataVariable('time')).toHaveLength(49);
    expect(reader.getDataVariable('time')[0]).toBe(1547070300);
    expect(reader.getDataVariable('lat')).toHaveLength(49);
    expect(reader.getDataVariable('lat')[0]).toHaveLength(1000);
    expect(reader.getDataVariable('lat')[0][0]).toBe(53.26256561279297);
  });

  it('read record variable with string', async () => {
    const response = await fetchFile(`${DATA_PATH}/madis-sao.nc`);
    const data = await response.arrayBuffer();
    const reader = new NetCDFReader(data);

    const record = reader.getDataVariable('wmoId');
    expect(record[0]).toBe(71419);
    expect(record[1]).toBe(71415);
    expect(record[2]).toBe(71408);
  });

  it('read non-record variable with object', async () => {
    const response = await fetchFile(`${DATA_PATH}/madis-sao.nc`);
    const data = await response.arrayBuffer();
    const reader = new NetCDFReader(data);
    const variables = reader.variables;

    const withString = reader.getDataVariable('staticIds');
    const withObject = reader.getDataVariable(variables[1]);
    expect(withString[0]).toBe('W');
    expect(withString[1]).toBe('A');
    expect(withString[2]).toBe('F');
    expect(withString[0]).toBe(withObject[0]);
    expect(withString[1]).toBe(withObject[1]);
    expect(withString[2]).toBe(withObject[2]);
  });

  it('read non-existent variable string', async () => {
    const response = await fetchFile(`${DATA_PATH}/madis-sao.nc`);
    const data = await response.arrayBuffer();
    const reader = new NetCDFReader(data);

    expect(reader.getDataVariable.bind(reader, "n'importe quoi")).toThrow(
      'Not a valid NetCDF v3.x file: variable not found'
    );
  });

  it('read 64 bit offset file', async () => {
    const response = await fetchFile(`${DATA_PATH}/model1_md2.nc`);
    const data = await response.arrayBuffer();
    const reader = new NetCDFReader(data);
    expect(reader.version).toBe('64-bit offset format');
    expect(reader.getDataVariable('cell_angular')[0]).toBe('a');
    expect(reader.getDataVariable('cell_spatial')[0]).toBe('a');
  });

  it('read agilent hplc file file', async () => {
    const response = await fetchFile(`${DATA_PATH}/agilent_hplc.cdf`);
    const data = await response.arrayBuffer();
    const reader = new NetCDFReader(data);

    expect(reader.version).toBe('classic format');

    const variables = [];
    for (const variable of reader.variables) {
      variables.push(variable);
      variable.value = reader.getDataVariable(variable);
    }
    expect(variables[3].value).toStrictEqual([0.012000000104308128]);
    expect(variables).toHaveLength(24);
    expect(reader.getDataVariable('ordinate_values')).toHaveLength(4651);
  });

  // API its

  it('attributeExists', async () => {
    const response = await fetchFile(`${DATA_PATH}/P071.CDF`);
    const data = await response.arrayBuffer();

    const reader = new NetCDFReader(data);
    expect(reader.attributeExists('operator_name')).toBe(true);
    expect(reader.attributeExists('operator_nameXX')).toBe(false);
  });

  it('dataVariableExists', async () => {
    const response = await fetchFile(`${DATA_PATH}/P071.CDF`);
    const data = await response.arrayBuffer();

    const reader = new NetCDFReader(data);
    expect(reader.dataVariableExists('instrument_name')).toBe(true);
    expect(reader.dataVariableExists('instrument_nameXX')).toBe(false);
  });

  it('getDataVariableAsString', async () => {
    const response = await fetchFile(`${DATA_PATH}/P071.CDF`);
    const data = await response.arrayBuffer();

    const reader = new NetCDFReader(data);
    expect(reader.getDataVariableAsString('instrument_name')).toBe('Gas Chromatograph');
  });

  // it.skip('toString', function () {
  //   const response = await fetchFile(`${DATA_PATH}/P071.CDF`);
  //   const data = await response.arrayBuffer();
  //   var reader = new NetCDFReader(data);
  //   expect(reader.toString()).toMatchSnapshot();
  // });
});
