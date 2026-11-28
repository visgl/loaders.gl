// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  LocationWeatherSource,
  WeatherGridSource,
  type WeatherVariable
} from '@loaders.gl/ogc/wms/bundled';
import {expect, test, vi} from 'vitest';

test('WeatherGridSource validates requested variable names before fetching', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  const source = new WeatherGridSource({fetch});
  await expect(
    source.getWeather({
      bounds: [-90, 20, -70, 35],
      width: 2,
      height: 2,
      variables: ['toString' as WeatherVariable]
    })
  ).rejects.toThrow('Unknown weather variable');
  expect(fetch).not.toHaveBeenCalled();
});

test('WeatherGridSource batches current observations in north-to-south order', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(
      Response.json([
        {current: {time: '2024-01-15T12:00', cloud_cover: 25}},
        {current: {time: '2024-01-15T12:00', cloud_cover: 50}}
      ])
    )
    .mockResolvedValueOnce(
      Response.json([
        {current: {time: '2024-01-15T12:00', cloud_cover: 75}},
        {current: {time: '2024-01-15T12:00'}}
      ])
    );
  const source = new WeatherGridSource({fetch, batchSize: 2});
  const grid = await source.getWeather({
    bounds: [-90, 20, -70, 35],
    width: 2,
    height: 2,
    variables: ['cloudCover']
  });
  expect(Array.from(grid.fields.cloudCover!)).toEqual([0.25, 0.5, 0.75, NaN]);
  const requests = fetch.mock.calls.map(([input]) => new URL(String(input)).searchParams);
  expect(requests.map(query => query.get('latitude'))).toEqual(['35,35', '20,20']);
  expect(requests.map(query => query.get('current'))).toEqual(['cloud_cover', 'cloud_cover']);
});

test('LocationWeatherSource selects the containing historical hour', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    Response.json({
      hourly: {
        time: ['2024-01-15T11:00', '2024-01-15T12:00'],
        temperature_2m: [10, 20],
        cloud_cover: [25, 75]
      }
    })
  );
  const result = await new LocationWeatherSource({fetch}).getWeather({
    longitude: -80,
    latitude: 25,
    time: new Date('2024-01-15T12:15:00Z')
  });
  expect(result).toMatchObject({
    time: '2024-01-15T12:00:00Z',
    temperature: 20,
    cloudCover: 0.75,
    windSpeed: null
  });
  const request = new URL(String(fetch.mock.calls[0][0]));
  expect(request.searchParams.get('start_date')).toBe('2024-01-15');
});
