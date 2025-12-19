// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// parse-wkt-crs was forked from https://github.com/DanielJDufour/wkt-crs under Creative Commons CC0 1.0 license.

/* eslint-disable no-console */ // TODO switch to options.log

export type ParseWKTCRSOptions = {
  sort?: boolean;
  keywords?: string[];
  raw?: boolean;
  debug?: boolean;
};

export type WKTCRS = any;

/**
 *
 * @param wkt
 * @param options
 * @returns
 */
export function parseWKTCRS(wkt: string, options?: ParseWKTCRSOptions): WKTCRS {
  if (options?.debug) {
    console.log('[wktcrs] parse starting with\n', wkt);
  }

  // move all keywords into first array item slot
  // from PARAM[12345, 67890] to ["PARAM", 12345, 67890]
  wkt = wkt.replace(/[A-Z][A-Z\d_]+\[/gi, (match) => `["${match.substr(0, match.length - 1)}",`);

  // wrap variables in strings
  // from [...,NORTH] to [...,"NORTH"]
  wkt = wkt.replace(/, ?([A-Z][A-Z\d_]+[,\]])/gi, (match, p1) => {
    const varname = p1.substr(0, p1.length - 1);
    return ',' + `"${options?.raw ? 'raw:' : ''}${varname}"${p1[p1.length - 1]}`;
  });

  if (options?.raw) {
    // replace all numbers with strings
    wkt = wkt.replace(/, {0,2}(-?[\.\d]+)(?=,|\])/g, function (match, p1) {
      return ',' + `"${options?.raw ? 'raw:' : ''}${p1}"`;
    });
  }

  // str should now be valid JSON
  if (options?.debug) {
    console.log(`[wktcrs] json'd wkt: '${wkt}'`);
  }

  let data;
  try {
    data = JSON.parse(wkt);
  } catch (error) {
    console.error(`[wktcrs] failed to parse '${wkt}'`);
    throw error;
  }

  if (options?.debug) {
    console.log(`[wktcrs] json parsed: '${wkt}'`);
  }

  function process(data, parent) {
    const kw = data[0];

    // after removing the first element with .shift()
    // data is now just an array of attributes

    data.forEach(function (it) {
      if (Array.isArray(it)) {
        process(it, data);
      }
    });

    const kwarr = `MULTIPLE_${kw}`;

    if (kwarr in parent) {
      parent[kwarr].push(data);
    } else if (kw in parent) {
      parent[kwarr] = [parent[kw], data];
      delete parent[kw];
    } else {
      parent[kw] = data;
    }
    return parent;
  }

  const result = process(data, [data]);
  if (options?.debug) {
    console.log('[wktcrs] parse returning', result);
  }

  if (options?.sort) {
    sort(result, options);
  }

  return result;
}

function sort(data: string[], options?: {keywords?: string[]}) {
  const keys = Object.keys(data).filter((k) => !/\d+/.test(k));

  const keywords: string[] = options?.keywords || [];
  if (!options?.keywords) {
    // try to find multiples
    const counts = {};
    if (Array.isArray(data)) {
      data.forEach((it) => {
        if (Array.isArray(it) && it.length >= 2 && typeof it[1] === 'string') {
          const k = it[0];
          if (!counts[k]) counts[k] = 0;
          counts[k]++;
        }
      });
      for (const k in counts) {
        if (counts[k] > 0) keywords.push(k);
      }
    }
  }

  keys.forEach((key) => {
    data[key] = sort(data[key]);
  });

  keywords.forEach((key) => {
    const indices: number[] = [];
    const params: string[] = [];

    data.forEach((item, i) => {
      if (Array.isArray(item) && item[0] === key) {
        indices.push(i);
        params.push(item);
      }
    });

    params.sort((a, b) => {
      a = a[1].toString();
      b = b[1].toString();
      return a < b ? -1 : a > b ? 1 : 0;
    });

    // replace in order
    params.forEach((param, i) => {
      data[indices[i]] = param;
    });
  });

  return data;
}
