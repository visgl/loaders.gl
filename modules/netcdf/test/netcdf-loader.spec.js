// import test from 'tape-promise/tape';

import {describe, it, expect} from 'test/utils/expect-assertions';
import {NetCDFLoader} from '@loaders.gl/netcdf';
import {load} from '@loaders.gl/core';

const DATA_PATH = `@loaders.gl/netcdf/test/data`;

describe('NetCDFLoader', () => {
  // it('Throws on non NetCDF file', async () => {
  //   // expect(() {
  //   //   await load(`${DATA_PATH}/not_nc.txt`, NetCDFLoader);
  //   // }).toThrow('Not a valid NetCDF v3.x file: should start with CDF');
  // });

  it('read header information', async () => {
    const result = await load(`${DATA_PATH}/madis-sao.nc`, [NetCDFLoader]);
    expect(result.loaderData.version).toBe(1);
    expect(result.loaderData.recordDimension).toStrictEqual({
      length: 178,
      id: 21,
      name: 'recNum',
      recordStep: 1220
    });
    expect(result.loaderData.dimensions).toStrictEqual([
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

    expect(result.loaderData.attributes[0]).toStrictEqual({
      name: 'cdlDate',
      type: 'char',
      value: '20010327'
    });
    expect(result.loaderData.attributes[3]).toStrictEqual({
      name: 'filePeriod',
      type: 'int',
      value: 3600
    });

    expect(result.loaderData.variables[0]).toStrictEqual({
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
    expect(result.loaderData.variables[11]).toStrictEqual({
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
    const result = await load(`${DATA_PATH}/madis-sao.nc`, [NetCDFLoader], {
      netcdf: {loadData: true}
    });

    expect(result.data.nStaticIds[0]).toBe(145);
  });

  it('read 2 dimensional variable', async () => {
    const result = await load(`${DATA_PATH}/ichthyop.nc`, [NetCDFLoader], {
      netcdf: {loadData: true}
    });
    expect(result.data.time).toHaveLength(49);
    expect(result.data.time[0]).toBe(1547070300);
    expect(result.data.lat).toHaveLength(49);
    expect(result.data.lat[0]).toHaveLength(1000);
    expect(result.data.lat[0][0]).toBe(53.26256561279297);
  });

  it('read record variable with string', async () => {
    const result = await load(`${DATA_PATH}/madis-sao.nc`, [NetCDFLoader], {
      netcdf: {loadData: true}
    });

    expect(result.data.wmoId[0]).toBe(71419);
    expect(result.data.wmoId[1]).toBe(71415);
    expect(result.data.wmoId[2]).toBe(71408);
  });

  it('read non-record variable with object', async () => {
    const result = await load(`${DATA_PATH}/madis-sao.nc`, [NetCDFLoader], {
      netcdf: {loadData: true}
    });

    const withString = result.data.staticIds;
    const withObject = result.data[result.loaderData.variables[1].name];
    expect(withString[0]).toBe('W');
    expect(withString[1]).toBe('A');
    expect(withString[2]).toBe('F');
    expect(withString[0]).toBe(withObject[0]);
    expect(withString[1]).toBe(withObject[1]);
    expect(withString[2]).toBe(withObject[2]);
  });

  it('read 64 bit offset file', async () => {
    const result = await load(`${DATA_PATH}/model1_md2.nc`, [NetCDFLoader], {
      netcdf: {loadData: true}
    });
    expect(result.loaderData.version).toBe(2);
    expect(result.data.cell_angular[0]).toBe('a');
    expect(result.data.cell_spatial[0]).toBe('a');
  });

  it('read agilent hplc file file', async () => {
    const result = await load(`${DATA_PATH}/agilent_hplc.cdf`, [NetCDFLoader], {
      netcdf: {loadData: true}
    });

    expect(result.loaderData.version).toBe(1);

    expect(Object.entries(result.data)).toHaveLength(24);
    expect(result.data.actual_delay_time).toStrictEqual([0.012000000104308128]);
    expect(result.data.ordinate_values).toHaveLength(4651);
  });
});
