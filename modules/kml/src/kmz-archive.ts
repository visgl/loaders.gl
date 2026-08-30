// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {HttpFile} from '@loaders.gl/loader-utils';
import {ZipFileSystem} from '@loaders.gl/zip';
import type {KMLDocument} from './kml-parser';
import {parseKMLDocument} from './kml-parser';

/** An opened KMZ archive with lazy access to its entries. */
export type KMZArchive = {
  /** Name of the primary KML document inside the archive. */
  readonly kmlFileName: string;
  /** Names of all non-directory archive entries. */
  readonly fileNames: string[];
  /** Parsed primary KML document. */
  readonly document: KMLDocument;
  /** Reads an archive entry by its path relative to the primary KML file. */
  getResource(path: string): Promise<ArrayBuffer>;
  /** Closes the archive's underlying file handle. */
  close(): Promise<void>;
};

/** Opens a KMZ URL, Blob, or ArrayBuffer and parses its primary KML document. */
export async function openKMZArchive(
  data: string | Blob | ArrayBuffer,
  fetch?: (url: string, options?: RequestInit) => Promise<Response>
): Promise<KMZArchive> {
  const file =
    typeof data === 'string'
      ? new HttpFile(data, fetch ? {fetch} : {})
      : (data as Blob | ArrayBuffer);
  const zipFileSystem = new ZipFileSystem(file as Blob | ArrayBuffer | HttpFile);
  const fileNames = (await zipFileSystem.readdir()).filter(fileName => !fileName.endsWith('/'));
  const kmlFileName = findPrimaryKMLFile(fileNames);
  const response = await zipFileSystem.fetch(kmlFileName);
  const document = parseKMLDocument(await response.text());

  return {
    kmlFileName,
    fileNames,
    document,
    getResource: async path => {
      const resourceName = resolveKMZResourcePath(kmlFileName, path);
      if (!resourceName) throw new Error(`KMZ resource is external: ${path}`);
      return await (await zipFileSystem.fetch(resourceName)).arrayBuffer();
    },
    close: () => zipFileSystem.destroy()
  };
}

function findPrimaryKMLFile(fileNames: string[]): string {
  const rootDocument = fileNames.find(fileName => fileName.toLowerCase() === 'doc.kml');
  if (rootDocument) return rootDocument;

  const rootKMLFiles = fileNames.filter(
    fileName => !fileName.includes('/') && fileName.toLowerCase().endsWith('.kml')
  );
  if (rootKMLFiles.length) return rootKMLFiles[0];

  const anyKMLFile = fileNames.find(fileName => fileName.toLowerCase().endsWith('.kml'));
  if (anyKMLFile) return anyKMLFile;
  throw new Error('KMZ archive does not contain a KML document');
}

/** Resolves a KML href relative to the primary KML document within the archive. */
export function resolveKMZResourcePath(kmlFileName: string, href: string): string | null {
  const trimmedHref = href.trim();
  if (!trimmedHref || /^[a-z][a-z\d+.-]*:/i.test(trimmedHref) || trimmedHref.startsWith('//')) {
    return null;
  }

  const hrefWithoutQuery = trimmedHref.split(/[?#]/, 1)[0];
  const baseParts = kmlFileName.split('/').slice(0, -1);
  const pathParts = [...baseParts, ...decodeURIComponent(hrefWithoutQuery).split('/')];
  const normalizedParts: string[] = [];
  for (const part of pathParts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!normalizedParts.length) return null;
      normalizedParts.pop();
    } else {
      normalizedParts.push(part);
    }
  }
  return normalizedParts.join('/');
}
