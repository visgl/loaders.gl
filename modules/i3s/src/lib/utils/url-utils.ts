// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Node3DIndexDocument, SceneLayer3D} from '../../types';
import type {SearchParams} from '@loaders.gl/loader-utils';

/**
 * Return URL seperated from search params
 * @param url - URL that might have search params
 * @returns url without search params
 */
export function getUrlWithoutParams(url: string): string {
  let urlWithoutParams: string | null;

  try {
    const urlObj = new URL(url);
    urlWithoutParams = `${urlObj.origin}${urlObj.pathname}`;

    // On Windows `new URL(url)` makes `C:\...` -> `null\...`
    if (urlWithoutParams.startsWith('null')) {
      urlWithoutParams = null;
    }
  } catch (_e) {
    urlWithoutParams = null;
  }
  return urlWithoutParams || url;
}

/**
 * Generates url with token if it is exists.
 * @param url
 * @param token
 * @returns
 */
export function getUrlWithToken(url: string, token: string | null = null): string {
  return getUrlWithSearchParams(url, token ? {token} : undefined);
}

/**
 * Adds search parameters to an I3S resource URL without replacing existing values.
 * @param url URL to update
 * @param searchParams Parameters to append
 * @returns URL with the supplied parameters
 */
export function getUrlWithSearchParams(url: string, searchParams?: SearchParams): string {
  if (!searchParams || Object.keys(searchParams).length === 0 || /^(?:data|blob):/i.test(url)) {
    return url;
  }

  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const urlWithoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = urlWithoutHash.indexOf('?');
  const path = queryIndex >= 0 ? urlWithoutHash.slice(0, queryIndex) : urlWithoutHash;
  const query = queryIndex >= 0 ? urlWithoutHash.slice(queryIndex + 1) : '';
  const existingSearchParams = new URLSearchParams(query);
  const appendedSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (!existingSearchParams.has(key)) {
      appendedSearchParams.set(key, String(value));
    }
  }

  const serializedAppendedSearchParams = appendedSearchParams.toString();
  return `${path}${queryIndex >= 0 ? `?${query}` : ''}${
    serializedAppendedSearchParams
      ? `${queryIndex >= 0 ? '&' : '?'}${serializedAppendedSearchParams}`
      : ''
  }${hash}`;
}

/**
 * Generates attribute urls for tile.
 * @param tile
 * @returns list of attribute urls
 */
export function generateTileAttributeUrls(url: string, tile: Node3DIndexDocument): string[] {
  const {attributeData = []} = tile;
  const attributeUrls: string[] = [];

  for (let index = 0; index < attributeData.length; index++) {
    const attributeUrl = attributeData[index].href.replace('./', '');
    attributeUrls.push(`${url}/${attributeUrl}`);
  }

  return attributeUrls;
}

/**
 * Generates attribute urls for tileset based on tileset and resource
 * @param tileset - tileset metadata
 * @param url - tileset base url
 * @param resource - resource id per I3S spec
 * @returns {Array}
 */
export function generateTilesetAttributeUrls(tileset: SceneLayer3D, url: string, resource: number) {
  const attributeUrls: string[] = [];
  const {attributeStorageInfo = []} = tileset;

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const fileName = attributeStorageInfo[index].key;
    attributeUrls.push(`${url}/nodes/${resource}/attributes/${fileName}/0`);
  }

  return attributeUrls;
}
