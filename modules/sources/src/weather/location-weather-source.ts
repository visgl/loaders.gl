// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** SI units, UTC timestamps, and nullable values for missing model fields. */
export type WeatherObservation = {
  time: string;
  latitude: number;
  longitude: number;
  temperature: number | null; // °C
  cloudCover: number | null; // 0..1
  rain: number | null; // mm per reporting interval
  snowfall: number | null; // cm per reporting interval
  visibility: number | null; // meters
  windSpeed: number | null; // m/s
  windDirection: number | null; // degrees, meteorological FROM direction
  weatherCode: number | null; // WMO interpretation code
};

export type WeatherQueryOptions = {
  longitude: number;
  latitude: number;
  /** UTC instant. Omit to request current conditions. Historical data is hourly. */
  time?: Date;
};

export type WeatherSourceOptions = {
  fetch?: typeof fetch;
  forecastUrl?: string;
  archiveUrl?: string;
};

const FIELDS = [
  'temperature_2m', 'cloud_cover', 'rain', 'snowfall',
  'visibility', 'wind_speed_10m', 'wind_direction_10m', 'weather_code'
] as const;

/**
 * Lightweight Open-Meteo point source. Does not supply regional grids:
 * globe-scale weather requires a separate gridded-data provider.
 */
export class LocationWeatherSource {
  readonly options: WeatherSourceOptions;
  constructor(options: WeatherSourceOptions = {}) {
    this.options = options;
  }

  async getWeather(query: WeatherQueryOptions): Promise<WeatherObservation> {
    const {latitude, longitude, time} = query;
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Invalid weather coordinates');
    }
    if (time && !Number.isFinite(time.getTime())) {
      throw new Error('Invalid weather timestamp');
    }
    const historical = time !== undefined;
    const url = new URL(historical
      ? (this.options.archiveUrl ?? 'https://archive-api.open-meteo.com/v1/archive')
      : (this.options.forecastUrl ?? 'https://api.open-meteo.com/v1/forecast'));
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('wind_speed_unit', 'ms');
    if (historical) {
      const day = time!.toISOString().slice(0, 10);
      url.searchParams.set('start_date', day);
      url.searchParams.set('end_date', day);
      url.searchParams.set('hourly', FIELDS.join(','));
    } else {
      url.searchParams.set('current', FIELDS.join(','));
    }
    const response = await (this.options.fetch ?? fetch)(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo request failed: HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error(`Open-Meteo: ${payload.reason ?? 'unknown error'}`);
    let record: Record<string, unknown>;
    let timestamp: string;
    if (historical) {
      const hourly = payload.hourly;
      if (!hourly || !Array.isArray(hourly.time)) throw new Error('Missing historical weather data');
      // Select the containing UTC hour; historical Open-Meteo data is hourly.
      const hour = time!.toISOString().slice(0, 13) + ':00';
      const index = hourly.time.indexOf(hour);
      if (index < 0) throw new Error(`Weather unavailable at ${hour} UTC`);
      record = Object.fromEntries(FIELDS.map(field => [field, hourly[field]?.[index] ?? null]));
      timestamp = hour + ':00Z';
    } else {
      if (!payload.current) throw new Error('Missing current weather data');
      record = payload.current;
      timestamp = String(record.time) + 'Z';
    }
    const number = (key: string): number | null => {
      const value = record[key];
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    };
    const cover = number('cloud_cover');
    return {
      time: timestamp,
      latitude: Number(payload.latitude ?? latitude),
      longitude: Number(payload.longitude ?? longitude),
      temperature: number('temperature_2m'),
      cloudCover: cover === null ? null : cover / 100,
      rain: number('rain'),
      snowfall: number('snowfall'),
      visibility: number('visibility'),
      windSpeed: number('wind_speed_10m'),
      windDirection: number('wind_direction_10m'),
      weatherCode: number('weather_code')
    };
  }
}
