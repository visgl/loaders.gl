// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Builds an ArcGIS REST resource URL while preserving authentication query parameters. */
export function buildArcGISResourceURL(
  serviceURL: string,
  resourcePath: string,
  parameters: Record<string, unknown>
): string {
  const url = new URL(serviceURL);
  if (resourcePath) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${resourcePath.replace(/^\//, '')}`;
  }
  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, encodeArcGISParameter(value));
  }
  return url.toString();
}

/** Converts a generic request value to ArcGIS REST query syntax. */
function encodeArcGISParameter(value: unknown): string {
  if (Array.isArray(value)) return value.join(',');
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
