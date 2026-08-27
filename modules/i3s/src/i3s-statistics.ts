// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {StatisticsInfo, StatsInfo} from './types';
import {getUrlWithToken} from './lib/utils/url-utils';

/** Typed statistics keyed by the `statisticsInfo.key` value. */
export type I3SStatistics = Record<string, StatsInfo | null>;

/**
 * Load the statistics resources advertised by an I3S scene layer.
 *
 * Failed or unavailable resources are represented as `null` so one missing field does not prevent
 * callers from consuming the remaining layer statistics.
 * @param statisticsInfo - scene-layer statistics resource descriptors
 * @param options - fetch and I3S token options
 * @returns statistics keyed by descriptor key
 */
export async function loadStatistics(
  statisticsInfo: StatisticsInfo[] | undefined,
  options: LoaderOptions & {i3s?: {token?: string | null}} = {}
): Promise<I3SStatistics> {
  if (!statisticsInfo?.length) {
    return {};
  }

  const entries = await Promise.all(
    statisticsInfo.map(
      async statistic => [statistic.key, await loadStatistic(statistic, options)] as const
    )
  );
  return Object.fromEntries(entries);
}

/**
 * Load one statistics resource.
 * @param statistic - statistics resource descriptor
 * @param options - fetch and I3S token options
 * @returns decoded statistics or null when unavailable
 */
async function loadStatistic(
  statistic: StatisticsInfo,
  options: LoaderOptions & {i3s?: {token?: string | null}}
): Promise<StatsInfo | null> {
  const url = getUrlWithToken(statistic.href, options.i3s?.token || null);
  try {
    const response = await fetchStatisticsResource(url, options.fetch);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as StatsInfo;
  } catch (_error) {
    return null;
  }
}

/**
 * Fetch a statistics resource with either a custom loader fetch function or request options.
 * @param url - resource URL
 * @param fetchOptions - custom fetch function or RequestInit
 * @returns resource response
 */
async function fetchStatisticsResource(
  url: string,
  fetchOptions: LoaderOptions['fetch']
): Promise<Response> {
  if (typeof fetchOptions === 'function') {
    return await fetchOptions(url);
  }
  return await fetch(url, fetchOptions as RequestInit | undefined);
}
