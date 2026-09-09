// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Prefix used by versioned Portolan STAC profile schema URIs. */
export const PORTOLAN_EXTENSION_URL_PREFIX = 'https://schemas.portolan-sdi.org/portolan/';

const PORTOLAN_EXTENSION_URL_PATTERN =
  /^https:\/\/schemas\.portolan-sdi\.org\/portolan\/v(\d+\.\d+\.\d+)\/schema\.json$/;

/** Returns the Portolan profile schema URI declared by a STAC object, if any. */
export function getPortolanExtension(stacExtensions?: readonly string[]): string | null {
  return (
    stacExtensions?.find(extension => extension.startsWith(PORTOLAN_EXTENSION_URL_PREFIX)) || null
  );
}

/** Returns the semantic version declared by a Portolan profile schema URI, if it is versioned. */
export function getPortolanVersion(stacExtensions?: readonly string[]): string | null {
  const extension = getPortolanExtension(stacExtensions);
  return extension ? (extension.match(PORTOLAN_EXTENSION_URL_PATTERN)?.[1] ?? null) : null;
}

/** Tests whether a STAC object declares the Portolan profile. */
export function isPortolanObject(object: {stac_extensions?: readonly string[]}): boolean {
  return Boolean(getPortolanExtension(object.stac_extensions));
}
