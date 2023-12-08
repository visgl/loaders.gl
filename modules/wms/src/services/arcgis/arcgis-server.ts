// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type Service = {name: string; type: string; url: string};

type FetchLike = typeof fetch;

/**
 * (Recursively) load the service directory from an ArcGIS Server URL
 * @param url
 * @param fetchFile= Optional fetch function override
 * @returns
 */
export async function getArcGISServices(
  url: string,
  fetchFile: FetchLike = fetch
): Promise<Service[] | null> {
  if (url.includes('rest/services')) {
    const serverUrl = url.replace(/rest\/services.*$/i, 'rest/services');
    return loadServiceDirectory(serverUrl, fetchFile, []);
  }
  return null;
}

async function loadServiceDirectory(
  serverUrl: string,
  fetch: FetchLike,
  path: string[]
): Promise<Service[]> {
  const serviceUrl = `${serverUrl}/${path.join('/')}`;

  const response = await fetch(`${serviceUrl}?f=pjson`);
  const directory = await response.json();

  const services = extractServices(directory, serviceUrl);

  const folders = (directory.folders || []) as string[];
  const promises = folders.map((folder) =>
    loadServiceDirectory(`${serverUrl}`, fetch, [...path, folder])
  );

  for (const folderServices of await Promise.all(promises)) {
    services.push(...folderServices);
  }

  return services;
}

function extractServices(directory: unknown, url: string): Service[] {
  const arcgisServices = ((directory as any).services || []) as {name: string; type: string}[];
  const services: Service[] = [];
  for (const service of arcgisServices) {
    services.push({
      name: service.name,
      type: `arcgis-${service.type.toLocaleLowerCase().replace('server', '-server')}`,
      url: `${url}${service.name}/${service.type}`
    });
  }
  return services;
}
