// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WeatherSourceOptions} from './location-weather-source';

/** West, south, east, north in longitude/latitude degrees. Does not cross antimeridian. */
export type WeatherBounds = [number, number, number, number];
export type WeatherVariable =
  | 'temperature' | 'cloudCover' | 'rain' | 'snowfall'
  | 'visibility' | 'windSpeed' | 'windDirection' | 'weatherCode';

export type WeatherGridQuery = {
  bounds: WeatherBounds;
  /** UTC instant. Omit for current conditions. */
  time?: Date;
  /** Number of longitude samples (including bounds). */
  width: number;
  /** Number of latitude samples (including bounds). */
  height: number;
  variables?: WeatherVariable[];
};

export type WeatherGrid = {
  bounds: WeatherBounds;
  width: number;
  height: number;
  /** Row-major values, west-to-east, north-to-south. NaN indicates missing. */
  fields: Partial<Record<WeatherVariable, Float32Array>>;
  /** Actual provider time for each sampled cell; may differ by model. */
  times: string[];
  /** True: a collection of sampled point queries, NOT a native meteorological grid. */
  sampled: true;
  /** Requested spacing in degrees. */
  spacing: {longitude: number; latitude: number};
};

const FIELD_NAMES: Record<WeatherVariable, string> = {
  temperature: 'temperature_2m',
  cloudCover: 'cloud_cover',
  rain: 'rain',
  snowfall: 'snowfall',
  visibility: 'visibility',
  windSpeed: 'wind_speed_10m',
  windDirection: 'wind_direction_10m',
  weatherCode: 'weather_code'
};
const ALL_VARIABLES = Object.keys(FIELD_NAMES) as WeatherVariable[];

/**
 * A deliberately bounded regional weather grid sampled from Open-Meteo point
 * queries. This is useful for coarse visualization but is not suitable for
 * high-resolution or globe-scale native model rasters.
 */
export class WeatherGridSource {
  readonly options: WeatherSourceOptions & {maxCells?: number; batchSize?: number};
  constructor(options: WeatherSourceOptions & {maxCells?: number; batchSize?: number} = {}) {
    this.options = options;
  }

  async getWeather(query: WeatherGridQuery): Promise<WeatherGrid> {
    const {bounds, width, height, time} = query;
    const [west, south, east, north] = bounds;
    const maxCells = this.options.maxCells ?? 100;
    const batchSize = this.options.batchSize ?? 20;
    if (!bounds.every(Number.isFinite) || west < -180 || east > 180 ||
        south < -90 || north > 90 || west > east || south > north) {
      throw new Error('Invalid weather bounds (antimeridian crossing not supported)');
    }
    if (!Number.isInteger(width) || !Number.isInteger(height) ||
        width < 2 || height < 2 || width * height > maxCells) {
      throw new Error(`Weather grid requires at least 2x2 cells and at most ${maxCells} cells`);
    }
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
      throw new Error('Invalid weather batch size');
    }
    if (time && !Number.isFinite(time.getTime())) throw new Error('Invalid weather timestamp');
    const variables = query.variables ?? ALL_VARIABLES;
    if (!variables.length) throw new Error('At least one weather variable is required');
    for (const variable of variables) {
      if (!(variable in FIELD_NAMES)) throw new Error(`Unknown weather variable: ${variable}`);
    }

    const latitudes: number[] = [];
    const longitudes: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        latitudes.push(north - (north - south) * y / (height - 1));
        longitudes.push(west + (east - west) * x / (width - 1));
      }
    }

    const fields: WeatherGrid['fields'] = {};
    for (const variable of variables) {
      fields[variable] = new Float32Array(width * height).fill(NaN);
    }
    const times = new Array<string>(width * height);
    const fetcher = this.options.fetch ?? fetch;
    const historical = time !== undefined;
    const endpoint = historical
      ? (this.options.archiveUrl ?? 'https://archive-api.open-meteo.com/v1/archive')
      : (this.options.forecastUrl ?? 'https://api.open-meteo.com/v1/forecast');

    // Limit request sizes; Open-Meteo supports comma-separated point coordinates.
    for (let offset = 0; offset < latitudes.length; offset += batchSize) {
      const end = Math.min(offset + batchSize, latitudes.length);
      const url = new URL(endpoint);
      url.searchParams.set('latitude', latitudes.slice(offset, end).join(','));
      url.searchParams.set('longitude', longitudes.slice(offset, end).join(','));
      url.searchParams.set('timezone', 'UTC');
      url.searchParams.set('wind_speed_unit', 'ms');
      const keys = variables.map(variable => FIELD_NAMES[variable]).join(',');
      if (historical) {
        const day = time!.toISOString().slice(0, 10);
        url.searchParams.set('start_date', day);
        url.searchParams.set('end_date', day);
        url.searchParams.set('hourly', keys);
      } else {
        url.searchParams.set('current', keys);
      }
      const response = await fetcher(url.toString());
      if (!response.ok) throw new Error(`Open-Meteo grid request failed: HTTP ${response.status}`);
      const payload = await response.json();
      const batch: any[] = Array.isArray(payload) ? payload : [payload];
      if (batch.length !== end - offset) throw new Error('Open-Meteo grid response count mismatch');
      for (let i = 0; i < batch.length; i++) {
        const data = batch[i];
        if (data.error) throw new Error(`Open-Meteo: ${data.reason ?? 'unknown error'}`);
        const hourly = data.hourly;
        const hour = time?.toISOString().slice(0, 13) + ':00';
        const hourIndex = historical ? hourly?.time?.indexOf(hour) : -1;
        if (historical && (hourIndex === undefined || hourIndex < 0)) {
          throw new Error(`Weather unavailable at ${hour} UTC`);
        }
        const record = historical ? hourly : data.current;
        if (!record) throw new Error('Missing weather grid point data');
        const index = offset + i;
        times[index] = historical ? hour + ':00Z' : String(record.time) + 'Z';
        for (const variable of variables) {
          const key = FIELD_NAMES[variable];
          const value = historical ? record[key]?.[hourIndex] : record[key];
          if (typeof value === 'number' && Number.isFinite(value)) {
            fields[variable]![index] = variable === 'cloudCover' ? value / 100 : value;
          }
        }
      }
    }

    return {
      bounds: [...bounds],
      width,
      height,
      fields,
      times,
      sampled: true,
      spacing: {longitude: (east - west) / (width - 1), latitude: (north - south) / (height - 1)}
    };
  }
}
