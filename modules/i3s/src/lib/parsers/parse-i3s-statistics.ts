import {load} from '@loaders.gl/core';
import {JSONLoader, LoaderOptions} from '@loaders.gl/loader-utils';
import {StatisticsInfo} from '../../types';

/**
 * Load I3S statistics information
 * Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/statisticsInfo.cmn.md
 * @param statisticsInfo
 * @param options
 * @returns
 */
export async function loadTilesetStatisticsInfo(
  statisticsInfo: StatisticsInfo[],
  options: LoaderOptions
): Promise<StatisticsInfo[]> {
  const statisitcs: StatisticsInfo[] = [];

  for (const statistic of statisticsInfo) {
    try {
      const statUrl = resolveUrl(statistic.href, options.baseUri);
      const data = await load(statUrl, JSONLoader, options);
      const stats = data?.stats;

      statisitcs.push({...statistic, stats});
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  return statisitcs;
}

/**
 * Handle base uri and statistic uri
 * @param statisticUrl
 * @param baseUri
 * @returns
 */
function resolveUrl(statisticUrl: string, baseUri: string): string {
  if (baseUri.startsWith('http')) {
    const statUrl = new URL(statisticUrl, `${baseUri}/`);
    return decodeURI(statUrl.toString());
  }

  return `${baseUri}${statisticUrl}`;
}
